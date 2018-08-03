import uuidv4 from 'uuid/v4';
import axios from 'axios';
const debug = require('debug');

var log = debug('turtleDB:syncTo');
var httpLog = debug('turtleDB:http');

const BATCH_LIMIT = 5;
const STORE_BATCH_LIMIT = 5;

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

      .then(() => this.createChangeLog())
      .then(() => this.syncBatches())
      .then(() => console.log('all batches completed'))

      .then(() => this.createNewSyncToTortoiseDoc()) //this.newSyncToTortoiseDoc
      .then(() => this.sendUpdatedSyncToTortoiseDoc('/_complete_sync')) //this.newSyncToTortoiseDoc
      .then(() => this.updateSyncToTortoiseDoc())
      .catch(err => console.log('Sync start error:', err));
  }

  //default to 5 metadocs at a time until tree compaction is complete
  createChangeLog() {
    if (this.lastTortoiseKey === this.highestTurtleKey) {
      return Promise.reject("No sync needed.")
    }

    this.changeLog = [];

    return this.getIDsBetweenStoreKeys(this.lastTortoiseKey, this.highestTurtleKey)
    .then(ids => {
      this.changeLog = ids;
    })
  }

  syncBatches() {
    let end = (this.changeLog.length <= BATCH_LIMIT ? this.changeLog.length - 1 : BATCH_LIMIT - 1);
    let currentBatch = this.changeLog.slice(0, end + 1);

    if (currentBatch.length === 0) {
      return;
    }

    return this.syncBatch(currentBatch)
    .then(() => {
      console.log('Finished current batch');
      this.changeLog = this.changeLog.splice(end + 1);
      return this.syncBatches();
    });
  }

  syncBatch(currentBatch) {
    return this.getMetaDocsByIDs(currentBatch)
    .then(docs => this.changedTurtleMetaDocs = docs)
    .then(() => this.sendChangedMetaDocsToTortoise('/_missing_rev_ids'))
    .then(revIdsFromTortoise => this.createStoreChangeLog(revIdsFromTortoise.data))
    .then(() => this.syncStoreBatches())
    .then(() => console.log('all store batches complete'))

    //.catch(err => console.log('Sync batch Error:', err));
  }

  //default to 5 metadocs at a time until tree compaction is complete
  createStoreChangeLog(revIdsFromTortoise) {
    log(`\n #4 HTTP <== receive request from Tortoise for ${revIdsFromTortoise.length} records`);
    this.storeChangeLog = revIdsFromTortoise;
  }

  syncStoreBatches() {
    let storeBatchEnd = (this.storeChangeLog.length <= STORE_BATCH_LIMIT ? this.storeChangeLog.length - 1 : STORE_BATCH_LIMIT - 1);
    let currentStoreBatch = this.storeChangeLog.slice(0, storeBatchEnd + 1);

    if (currentStoreBatch.length === 0) {
      return this.sendTurtleDocsToTortoise('/_insert_docs', true)
      .then(() => console.log('Tortoise confirmed batch complete'));
    }

    return this.syncStoreBatch(currentStoreBatch)
    .then(() => {
      this.storeChangeLog = this.storeChangeLog.splice(storeBatchEnd + 1);

      return this.syncStoreBatches();
    });
  }

  syncStoreBatch(listOfRevIds) {
    return this.getStoreDocsForTortoise(listOfRevIds)
    .then(() => console.log('store docs for tortoise', this.storeDocsForTortoise))
    .then(() => this.sendTurtleDocsToTortoise('/_insert_docs'))
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
    if (this.lastTortoiseKey === this.highestTurtleKey) {
      return Promise.reject("No sync needed.")
    } else {
      return this.getMetaDocsBetweenStoreKeys(this.lastTortoiseKey, this.highestTurtleKey)
        .then(metaDocs => this.changedTurtleMetaDocs = metaDocs)
        .then(() => log(`\n Get revision trees for all records between ${this.lastTortoiseKey} - ${this.highestTurtleKey} in the store`))
    }
  }

  getIDsBetweenStoreKeys(lastTortoiseKey, highestTurtleKey) {
    return this.idb.command(this.idb._store, "READ_BETWEEN", { x: lastTortoiseKey + 1, y: highestTurtleKey })
      .then(docs => this.getUniqueIDs(docs))
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

  sendUpdatedSyncToTortoiseDoc(path) {
    return axios.post(this.targetUrl + path, { newSyncToTortoiseDoc: this.newSyncToTortoiseDoc });
  }

  sendTurtleDocsToTortoise(path, finishedBatch=false) {
    log('\n #5 HTTP ==> Tortoise with batch of store docs');
    return axios.post(this.targetUrl + path, { finishedBatch: finishedBatch, docs: this.storeDocsForTortoise }) //, newSyncToTortoiseDoc: this.newSyncToTortoiseDoc })
  }

  updateSyncToTortoiseDoc() {
    log('\n #6 HTTP <== receive confirmation from Tortoise, update sync history');
    return this.idb.command(this.idb._syncToStore, "UPDATE", { data: this.newSyncToTortoiseDoc });
  }
}

export default SyncTo;
