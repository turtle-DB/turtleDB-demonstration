import uuidv4 from 'uuid/v4';
import axios from 'axios';

class SyncTo {
  constructor(targetUrl) {
    this.targetUrl = targetUrl;
    this.sessionID = new Date().toISOString();
  }

  start() {
    this.getSyncToTortoiseDoc() //this.syncToTortoiseDoc
    .then(() => this.getHighestTurtleKey()) //this.highestTurtleKey
    .then(() => this.sendRequestForLastTortoiseKey('/_last_tortoise_key')) //this.lastTortoiseKey
    .then(() => this.getChangedMetaDocsForTortoise()) //this.changedTurtleMetaDocs
    .then(() => this.sendChangedMetaDocsToTortoise('/_missing_rev_ids'))
    .then(revIdsFromTortoise => this.getStoreDocsForTortoise(revIdsFromTortoise.data))
    .then(() => this.createNewSyncToTortoiseDoc()) //this.newSyncToTortoiseDoc
    .then(() => this.sendTurtleDocsToTortoise('/_insert_docs'))
    .then(() => this.updateSyncToTortoiseDoc())
    .catch(err => console.log(err));
  }

  getSyncToTortoiseDoc() {
    return this.idb.command(this.idb._syncToStore, "READ_ALL", {})
    .then(syncRecords => this.syncToTortoiseDoc = syncRecords[0])
  }

  getHighestTurtleKey() {
    return this.idb.command(this.idb._store, "GET_ALL_KEYS", {})
      .then(keys => keys[keys.length - 1])
      .then(key => this.highestTurtleKey = key)
  }

  sendRequestForLastTortoiseKey(path) {
    return axios.post(this.targetUrl + path, this.syncToTortoiseDoc)
      .then(res => {
        this.lastTortoiseKey = res.data;
      })
  }

  getChangedMetaDocsForTortoise() {
    if (this.lastTortoiseKey === this.highestTurtleKey) {
      return Promise.reject("No sync needed.")
    } else {
      return this.getMetaDocsBetweenStoreKeys(this.lastTortoiseKey, this.highestTurtleKey)
      .then(metaDocs => this.changedTurtleMetaDocs = metaDocs)
    }
  }

  getMetaDocsBetweenStoreKeys(lastTortoiseKey, highestTurtleKey) {
    return this.idb.command(this.idb._store, "READ_BETWEEN", { x: lastTortoiseKey + 1, y: highestTurtleKey })
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

  sendChangedMetaDocsToTortoise(path) {
    return axios.post(this.targetUrl + path, { metaDocs: this.changedTurtleMetaDocs });
  }

  getStoreDocsForTortoise(revIdsFromTortoise) {
    // console.log('rev ids recieved from tortoise:', revIdsFromTortoise);
    const promises = revIdsFromTortoise.map(_id_rev => {
      return this.idb.command(this.idb._store, "INDEX_READ", {data: { indexName: '_id_rev', key: _id_rev }});
    });
    return Promise.all(promises).then(docs => this.storeDocsForTortoise = docs)
  }

  createNewSyncToTortoiseDoc() {
    let newHistory = { lastKey: this.highestTurtleKey, sessionID: this.sessionID };
    this.newSyncToTortoiseDoc = Object.assign(
      this.syncToTortoiseDoc, { history: [newHistory].concat(this.syncToTortoiseDoc.history) }
    );
  }

  sendTurtleDocsToTortoise(path) {
    return axios.post(this.targetUrl + path, { docs: this.storeDocsForTortoise, newSyncToTortoiseDoc: this.newSyncToTortoiseDoc })
  }

  updateSyncToTortoiseDoc() {
    return this.idb.command(this.idb._syncToStore, "UPDATE", { data: this.newSyncToTortoiseDoc });
  }
}

export default SyncTo;
