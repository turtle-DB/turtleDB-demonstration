import uuidv4 from 'uuid/v4';
import axios from 'axios';

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
    this.getLastTurtleKey()
    .then(() => this.sendRequestForTortoiseMetaDocs('/_changed_meta_docs'))
    .then(changedTortoiseMetaDocs => this.findMissingRevIds(changedTortoiseMetaDocs.data)) // this.missingRevIds
    .then(() => this.sendRequestForTortoiseDocs('/_changed_docs'))
    .then(docsFromTortoise => this.updateStoreAndSyncFromStore(docsFromTortoise.data))
    .then(() => this.sendSuccessConfirmation('/_confirm_sync'))
    .catch((err) => console.log('Sync From Error:', err));
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
    return axios.post(this.targetUrl + path, { turtleID: this.turtleID, lastTurtleKey: this.lastTurtleKey });
  }

  sendSuccessConfirmation(path) {
    return axios.get(this.targetUrl + path);
  }

  findMissingRevIds(tortoiseMetaDocs) {
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

    return Promise.all(promises).then(() => this.missingRevIds = missingLeafNodes);
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
    return axios.post(this.targetUrl + path, { revIds: this.missingRevIds });
  }

  updateTurtleMetaDocStore(missingMetaDocs) {
    let promises = [];
    missingMetaDocs.forEach(doc => promises.push(this.idb.command(this.idb._meta, "UPDATE", { data: doc })))
    return Promise.all(promises);
  }

  updateStoreAndSyncFromStore(docsFromTortoise) {
    const { docs, newSyncToTurtleDoc } = docsFromTortoise;
    this.insertNewDocsIntoStore(docs)
    .then(() => this.updateSyncFromDoc(newSyncToTurtleDoc));
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
