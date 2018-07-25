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
    .then(() => this.sendRequestForTortoiseMetaDocs('/_source_meta_docs'))
    .then(changedTortoiseMetaDocs => this.findMissingRevIds(changedTortoiseMetaDocs.data)) // this.missingRevIds
    .then(() => this.sendRequestForTortoiseDocs('/_source_store_docs'))
    .then(docsFromTortoise => this.updateStoreAndSyncFromStore(docsFromTortoise.data));
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

  findMissingRevIds(tortoiseMetaDocs) {
    const ids = tortoiseMetaDocs.map(doc => doc._id);

    return this.getMetaDocsByIds(ids)
    .then(turtleMetaDocs => {
      const missingMetaDocs = this.findMissingRevs(tortoiseMetaDocs, turtleMetaDocs);
      this.updateTurtleMetaDocStore(missingMetaDocs);
      return missingMetaDocs;
    })
    .then(missingMetaDocs => {
      this.missingRevIds = missingMetaDocs.map(doc => {
        return doc._id + "::" + doc.revisions[0];
      })
    })
    .catch(err => console.log(err));
  }

  getMetaDocsByIds(ids) {
    let promises = [];
    ids.forEach(_id => promises.push(this.idb.command(this.idb._meta, "READ", { _id })))
    return Promise.all(promises).then(metadocs => metadocs.filter(doc => doc));
  }

  findMissingRevs(tortoiseMetaDocs, turtleMetaDocs) {
    const latestTurtleDocRevs = {};
    turtleMetaDocs.forEach(doc => {
      latestTurtleDocRevs[doc._id] = doc.revisions[0];
    })

    return tortoiseMetaDocs.filter(doc => {
      let turtleRevId = latestTurtleDocRevs[doc._id];

      if (turtleRevId) {
        if (turtleRevId !== doc.revisions[0]) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    })
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
    this.idb.command(this.idb._syncFromStore, "UPDATE", { data: newSyncToTurtleDoc });
  }
}


export default SyncFrom;
