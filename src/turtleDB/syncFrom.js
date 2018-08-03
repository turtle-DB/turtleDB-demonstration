import uuidv4 from 'uuid/v4';
import axios from 'axios';

const debug = require('debug');
var log = debug('turtleDB:syncFrom');
var httpLog = debug('turtleDB:http');

class SyncFrom {
  constructor(targetUrl) {
    this.targetUrl = targetUrl;
    this.sessionID = new Date().toISOString();
  }

  getTurtleID() {
    return this.idb.command(this.idb._turtleDBMeta, "READ_ALL", {})
      .then(docs => this.turtleID = docs[0]._id);
  }

  start() {
    return this.checkServerConnection('/connect')
      .then(() => this.getTurtleID())
      .then(() => this.getLastTurtleKey())
      .then(() => this.sendRequestForTortoiseMetaDocs('/_changed_meta_docs'))
      .then(changedTortoiseMetaDocs => this.findMissingRevIds(changedTortoiseMetaDocs.data)) // this.missingRevIds
      .then(() => this.sendRequestForTortoiseDocs('/_changed_docs'))
      .then(docsFromTortoise => this.updateStoreAndSyncFromStore(docsFromTortoise.data))
      .then(() => this.sendSuccessConfirmation('/_confirm_sync'))
      .catch((err) => console.log('Sync From Error:', err));
  }

  checkServerConnection(path) {
    return axios.get(this.targetUrl + path)
      .then((res) => {
        return res.status === 200 ? true : false;
      })
      .catch((error) => {
        if (!error.response) {
          // network error
          return Promise.reject('Failed to connect to server');
        } else {
          // http status code
          const code = error.response.status
          // response data
          const response = error.response.data
        }
      });
  }

  getLastTurtleKey() {
    return this.idb.command(this.idb._syncFromStore, "READ_ALL", {})
      .then(docs => {
        const syncFromTortoiseDoc = docs[0];
        this.lastTurtleKey = syncFromTortoiseDoc.history.length === 0 ?
          '0' : syncFromTortoiseDoc.history[0].lastKey;
      })
  }

  sendRequestForTortoiseMetaDocs(path) {
    log(`\n Get TurtleDBs ID and local checkpoint (${this.lastTurtleKey}) from previous sync session`);
    log('\n #1 HTTP ==> to Tortoise requesting any changed metadocs');
    return axios.post(this.targetUrl + path, { turtleID: this.turtleID, lastTurtleKey: this.lastTurtleKey });
  }

  sendSuccessConfirmation(path) {
    log('\n #5 HTTP ==> to Tortoise with confirmation of sync');
    return axios.get(this.targetUrl + path);
  }

  findMissingRevIds(tortoiseMetaDocs) {
    log(`\n #2 HTTP <== from Tortoise with ${tortoiseMetaDocs.length} changed metadocs`);

    if (tortoiseMetaDocs.length === 0) {
      return Promise.reject("No sync needed - no changes waiting in Tortoise")
    }

    // console.log('metaDocs from tortoise:', tortoiseMetaDocs);

    // returns a list of all tortoise leaf nodes that turtle doesn't have
    const missingLeafNodes = [];

    const promises = tortoiseMetaDocs.map(tortoiseMetaDoc => {
      return this.idb.command(this.idb._meta, "READ", { _id: tortoiseMetaDoc._id })
        .then(turtleMetaDoc => {
          // console.log('turtle version of metadoc', turtleMetaDoc);

          if (turtleMetaDoc) {
            if (JSON.stringify(turtleMetaDoc._revisions) === JSON.stringify(tortoiseMetaDoc._revisions)) {
              // console.log('revision trees are the same, no metadoc updates needed');
              return;
            } else {
              return this.findMissingLeafRevs(tortoiseMetaDoc)
                .then((idRevs) => {
                  missingLeafNodes.push(...idRevs);
                  return this.idb.command(this.idb._meta, "UPDATE", { data: tortoiseMetaDoc });
                });
            }
          } else {
            let revs = this.collectAllLeafRevs(tortoiseMetaDoc._revisions);
            let idRevs = revs.map(rev => tortoiseMetaDoc._id + '::' + rev);
            missingLeafNodes.push(...idRevs);
            return this.idb.command(this.idb._meta, "CREATE", { data: tortoiseMetaDoc });
          }
        })
    });

    return Promise.all(promises)
      .then(() => this.missingRevIds = missingLeafNodes)
      .then(() => log(`\n compare Turtle/Tortoise metadocs to make a list of ${this.missingRevIds.length} missing records`));
  }

  collectAllLeafRevs(node, leafRevs = []) {
    if (node[2].length === 0) {
      leafRevs.push(node[0]);
    }

    for (let i = 0; i < node[2].length; i++) {
      this.collectAllLeafRevs(node[2][i], leafRevs);
    }

    return leafRevs;
  }

  findMissingLeafRevs(tortoiseMetaDoc) {
    const leafRevs = this.collectAllLeafRevs(tortoiseMetaDoc._revisions);
    const docId = tortoiseMetaDoc._id;
    const leafIdRevs = leafRevs.map(rev => docId + '::' + rev);

    // console.log('tortoise metadoc leaf id revs:', leafIdRevs);

    return this.idb.getStoreDocsByIdRevs(leafIdRevs)
      .then((turtleDocs) => {
        // note: here returns an array w/ some undefined, some docs
        const existingTurtleIdRevs = turtleDocs.filter(d => d).map(doc => doc._id_rev);
        // console.log('existing turtle leaf id revs', existingTurtleIdRevs);
        return leafIdRevs.filter(idRev => !existingTurtleIdRevs.includes(idRev));
      });
  }

  sendRequestForTortoiseDocs(path) {
    log('\n #3 HTTP ==> to Tortoise requesting missing records');
    return axios.post(this.targetUrl + path, { revIds: this.missingRevIds });
  }

  updateTurtleMetaDocStore(missingMetaDocs) {
    let promises = [];
    missingMetaDocs.forEach(doc => promises.push(this.idb.command(this.idb._meta, "UPDATE", { data: doc })))
    return Promise.all(promises);
  }

  updateStoreAndSyncFromStore(docsFromTortoise) {
    log(`\n #4 HTTP <== from Tortoise with ${docsFromTortoise.docs.length} missing records`);
    const { docs, newSyncToTurtleDoc } = docsFromTortoise;
    this.insertNewDocsIntoStore(docs)
      .then(() => this.updateSyncFromDoc(newSyncToTurtleDoc))
      .then(() => log('\n insert missing records and updated sync history into IndexedDB'))
  }

  insertNewDocsIntoStore(docs) {
    let promises = [];
    docs.forEach(doc => promises.push(this.idb.command(this.idb._store, "CREATE", { data: doc })))
    return Promise.all(promises);
  }

  updateSyncFromDoc(newSyncToTurtleDoc) {
    return this.idb.command(this.idb._syncFromStore, "UPDATE", { data: newSyncToTurtleDoc });
  }
}


export default SyncFrom;
