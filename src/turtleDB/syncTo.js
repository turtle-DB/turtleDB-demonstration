import uuidv4 from 'uuid/v4';
import axios from 'axios';
const debug = require('debug');

var log = debug('turtleDB:syncTo');
var httpLog = debug('turtleDB:http');

const BATCH_LIMIT = 25;

class SyncTo {
  constructor(targetUrl) {
    this.targetUrl = targetUrl;
    this.sessionID = new Date().toISOString();
  }

  start() {
    return this.checkServerConnection('/connect')
      .then(() => this.getSyncToTortoiseDoc()) //this.syncToTortoiseDoc
      .then(() => this.getHighestTurtleKey()) //this.highestTurtleKey
      .then(() => this.sendRequestForLastTortoiseKey('/_last_tortoise_key')) //this.lastTortoiseKey
      .then(() => this.setBatchLimits())

      .then(() => this.getChangedMetaDocsForTortoise()) //this.changedTurtleMetaDocs
      .then(() => this.sendChangedMetaDocsToTortoise('/_missing_rev_ids'))
      .then(revIdsFromTortoise => this.getStoreDocsForTortoise(revIdsFromTortoise.data))
      .then(() => this.createNewSyncToTortoiseDoc()) //this.newSyncToTortoiseDoc
      .then(() => this.sendTurtleDocsToTortoise('/_insert_docs'))
      .then(() => this.updateSyncToTortoiseDoc())
      .catch((err) => {
        if (err === 'SYNC_COMPLETE') {
          return Promise.reject();
        } else {
          console.log('Sync To Error:', err)
        }
      });
  }

  setBatchLimits() {
    if (this.lastTortoiseKey === this.highestTurtleKey) {
      return Promise.reject("SYNC_COMPLETE")
    }

    let changes = this.highestTurtleKey - this.lastTortoiseKey;
    if (changes > BATCH_LIMIT) {
      this.highestTurtleKey = this.lastTortoiseKey + BATCH_LIMIT;
    }
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

  getSyncToTortoiseDoc() {
    return this.idb.command(this.idb._syncToStore, "READ_ALL", {})
      .then(syncRecords => this.syncToTortoiseDoc = syncRecords[0])
      .then(() => log('\n Get record of previous syncs to Tortoise', 'getSyncToTortoiseDoc'))
  }

  getHighestTurtleKey() {
    return this.idb.command(this.idb._store, "GET_ALL_KEYS", {})
      .then(keys => {
        const lastKey = keys[keys.length - 1];
        this.highestTurtleKey = lastKey ? lastKey : 0;
        log(`\n Get highest primary key in the Turtle store (${this.highestTurtleKey})`)
      });
  }

  sendRequestForLastTortoiseKey(path) {
    log('\n #1 HTTP ==> to Tortoise requesting checkpoint from last sync');
    return axios.post(this.targetUrl + path, this.syncToTortoiseDoc)
      .then(res => {
        this.lastTortoiseKey = res.data;
        log(`\n #2 HTTP <== receive response from Tortoise with checkpoint (${this.lastTortoiseKey})`);
      })
  }

  getChangedMetaDocsForTortoise() {
    return this.getMetaDocsBetweenStoreKeys(this.lastTortoiseKey, this.highestTurtleKey)
      .then(metaDocs => this.changedTurtleMetaDocs = metaDocs)
      .then(() => log(`\n Get revision trees for all records between ${this.lastTortoiseKey} - ${this.highestTurtleKey} in the store`))
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
    log(`\n #3 HTTP ==> Tortoise with ${this.changedTurtleMetaDocs.length} changed revision trees`);
    return axios.post(this.targetUrl + path, { metaDocs: this.changedTurtleMetaDocs });
  }

  getStoreDocsForTortoise(revIdsFromTortoise) {
    const promises = revIdsFromTortoise.map(_id_rev => {
      return this.idb.command(this.idb._store, "INDEX_READ", { data: { indexName: '_id_rev', key: _id_rev } });
    });
    return Promise.all(promises)
      .then(docs => this.storeDocsForTortoise = docs)
      .then(() => log(`\n Get ${this.storeDocsForTortoise.length} changed records for Tortoise`))
  }

  createNewSyncToTortoiseDoc() {
    let newHistory = { lastKey: this.highestTurtleKey, sessionID: this.sessionID };
    this.newSyncToTortoiseDoc = Object.assign(
      this.syncToTortoiseDoc, { history: [newHistory].concat(this.syncToTortoiseDoc.history) }
    );
    log('\n prepare updated record of sync history with Tortoise');
  }

  sendTurtleDocsToTortoise(path) {
    log('\n #5 HTTP ==> Tortoise with batch of store docs');
    return axios.post(this.targetUrl + path, { docs: this.storeDocsForTortoise, newSyncToTortoiseDoc: this.newSyncToTortoiseDoc }) //, newSyncToTortoiseDoc: this.newSyncToTortoiseDoc })
  }

  updateSyncToTortoiseDoc() {
    log('\n #6 HTTP <== receive confirmation from Tortoise, update sync history');
    return this.idb.command(this.idb._syncToStore, "UPDATE", { data: this.newSyncToTortoiseDoc });
  }
}

export default SyncTo;
