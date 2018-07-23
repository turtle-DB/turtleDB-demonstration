import uuidv4 from 'uuid/v4';
import axios from 'axios';

class Replicator {
  constructor(host) {
    this.host = host; // for testing purposes only
    this.sessionID = this.generateSessionID();
  }

  //get the "last key" tortoise has on record from last sync
  //get the metadocs of all docs that have been updated since that last key
  //send the metadocs to tortoise
  //tortoise compares to its db and sends back the _id_revs it doesn't have
  //get those store docs for tortoise
  //create a new sync record based on the session ID and current highest key
  //send required store docs and new sync record to tortoise
  //tortoise will update its stores and send back an OK
  //with OK, update the sync history with the new sync record

  replicate() {
    this.getTurtleHistoryDoc() //this.turtleHistoryDoc
    .then(() => this.getHighestStoreKey()) //this.highestTurtleKey
    .then(() => this.getLastTortoiseKey('/_compare_sync_history')) //this.lastTortoiseKey
    .then(() => this.getChangedMetaDocsForTortoise()) //this.metaDocs
    .then(() => this.sendChangedMetaDocsToTortoise('/_rev_diffs'))
    .then(tortoiseResponse => this.getChangedStoreDocsForTortoise(tortoiseResponse))
    .then(() => this.createNewSyncDocument()) //this.turtleSyncRecord
    .then(() => this.sendTurtleDocsAndSyncRecordToTortoise('/_bulk_docs'))
    .then(() => this.updateTurtleSyncHistory(this.turtleSyncRecord))
    .catch(err => console.log(err));
  }

  sendTurtleDocsAndSyncRecordToTortoise(path) {
    return axios.post(this.host + path, { docs: this.turtleStoreDocsForTortoise, turtleSyncRecord: this.turtleSyncRecord })
  }

  sendChangedMetaDocsToTortoise(path) {
    return axios.post(this.host + path, { sessionID: this.sessionID, metaDocs: this.metaDocs });
  }

  getLastTortoiseKey(path) {
    return axios.post(this.host + path, this.turtleHistoryDoc)
      .then(res => this.lastTortoiseKey = res.data)
    }

  generateSessionID() {
    return new Date().toISOString();
  }

  getTurtleHistoryDoc() {
    return this.idb.command(this.idb._sync, "READ_ALL", {})
    .then(syncRecords => syncRecords.filter(record => record._id.split("::")[0] === 'turtleDB')[0])
    .then(history => this.turtleHistoryDoc = history)
  }

  getHighestStoreKey() {
    return this.idb.command(this.idb._store, "GET_ALL_KEYS", {})
      .then(keys => keys[keys.length - 1])
      .then(key => this.highestTurtleKey = key)
  }

  getChangedMetaDocsForTortoise() {
    if (this.lastTortoiseKey === this.highestTurtleKey) {
      return Promise.reject("No sync needed.")
    } else {
      return Promise.resolve(this.getMetaDocsOfUpdatedDocs(this.lastTortoiseKey, this.highestTurtleKey))
      .then(metaDocs => this.metaDocs = metaDocs)
    }
  }

  getMetaDocsOfUpdatedDocs(lastKey, highestTurtleKey) {
    return this.idb.command(this.idb._store, "READ_BETWEEN", { x: lastKey + 1, y: highestTurtleKey })
    .then(docs => this.getUniqueIDs(docs))
    .then(ids => this.getMetaDocsByIDs(ids))
  }

  getUniqueIDs(docs) {
    let ids = {};
    for (let i = 0; i < docs.length; i++) {
      const id = docs[i]._id_rev.split("::")[0];
      if (ids[id]) continue;
      ids[id] = true;
    }
    const uniqueIDs = Object.keys(ids);
    return uniqueIDs;
  }

  getMetaDocsByIDs(ids) {
    let promises = [];
    ids.forEach(_id => promises.push(this.idb.command(this.idb._meta, "READ", { _id })))
    return Promise.all(promises);
  }

  getChangedStoreDocsForTortoise(tortoiseResponse) {
    const promises = tortoiseResponse.data.map(_id_rev => {
      return this.idb.command(this.idb._store, "INDEX_READ", {data: { indexName: '_id_rev', key: _id_rev }});
    });
    return Promise.all(promises).then(docs => this.turtleStoreDocsForTortoise = docs)
  }

  createNewSyncDocument() {
    let newHistory = { lastKey: this.highestTurtleKey, sessionID: this.sessionID };
    this.turtleSyncRecord = Object.assign(
      this.turtleHistoryDoc, { history: [newHistory].concat(this.turtleHistoryDoc.history) }
    );
  }

  updateTurtleSyncHistory(turtleSyncRecord) {
    return this.idb.command(this.idb._sync, "UPDATE", { data: turtleSyncRecord });
  }
}

export default Replicator
