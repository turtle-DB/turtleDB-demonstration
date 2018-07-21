import uuidv4 from 'uuid/v4';
import IDBShell from './IDBShell';
import md5 from 'md5';
import axios from 'axios';

class TurtleDB {
  constructor() {
    this.idb = new IDBShell('turtleDB');
  }

  _readMetaDoc(_id) {
    return this.idb.command(this.idb._meta, 'READ', { _id })
      .then(meta => meta);
  }

  _readRevFromIndex(_id, rev) {
    const _id_rev = _id + "::" + rev;
    return this.idb.command(this.idb._store, "INDEX_READ", {data: { indexName: '_id_rev', key: _id_rev }});
    //return this.idb.readFromIndex(this.idb._store, '_id_rev', _id_rev);
  }

  _readWithoutDeletedError(_id) {
    return this._readMetaDoc(_id)
      .then(meta => meta.revisions[0])
      .then(winningRev => this._readRevFromIndex(_id, winningRev))
      .then(doc => {

        if (doc._deleted) { return false; }

        const data = Object.assign({}, doc);
        [ data._id, data._rev ] = data._id_rev.split('::');
        delete data._id_rev;
        return data;
      })
      .catch(err => console.log("Read error:", err));
  }

  _readAllLeafDocs() {
    return this.idb.command(this._meta, "READ_ALL")
     .then(metaDocs => {
       let promises = metaDocs.map(doc => this._read(doc._id));
       return Promise.all(promises);
     })
     .catch(err => console.log("readAllLeafDocs error:", err));
  }

  _read(_id) {
    return this._readMetaDoc(_id)
      .then(meta => meta.revisions[0])
      .then(winningRev => this._readRevFromIndex(_id, winningRev))
      .then(doc => {
        const data = Object.assign({}, doc);
        [ data._id, data._rev ] = data._id_rev.split('::');
        delete data._id_rev;
        return data;
      })
      .catch(err => console.log("Read error:", err));
  }

  _generateNewVersion(_id, oldVersion, newDoc) {
    const oldRev = oldVersion._id_rev.split('::')[1];
    const oldRevNumber = parseInt(oldRev.split('-')[0], 10);

    delete oldVersion._id_rev;
    const updatedVersion = Object.assign({}, newDoc);
    const newRev = `${oldRevNumber + 1}-` + md5(JSON.stringify(updatedVersion));
    updatedVersion._id_rev = _id + "::" + newRev;
    return updatedVersion;
  }

  _generateSessionID() {
    return new Date().toISOString();
  }

  _getLastStoreKey(turtleHistoryDoc) {
    if (turtleHistoryDoc.history.length === 0) {
      return 0;
    } else {
      return turtleHistoryDoc.history[0].lastKey;
    }
  }

  _getHighestStoreKey() {
    return this.idb.command(this.idb._store, "GET_ALL_KEYS", {})
      .then(keys => keys[keys.length - 1])
  }

  _getTurtleHistoryDoc() {
    return this.idb.command(this.idb._sync, "READ_ALL", {})
    .then(syncRecords => syncRecords.filter(record => record._id.split("::")[0] === 'turtleDB')[0])
  }

  _getMetaDocsOfUpdatedDocs(lastKey, highestTurtleKey) {
    console.log(lastKey, highestTurtleKey);
    return this.idb.command(this.idb._store, "READ_BETWEEN", { x: lastKey + 1, y: highestTurtleKey })
    .then(docs => this._getUniqueIDs(docs))
    .then(ids => this._getMetaDocsByIDs(ids))
  }

  _getUniqueIDs(docs) {
    let ids = {};
    for (let i = 0; i < docs.length; i++) {
      const id = docs[i]._id_rev.split("::")[0];
      if (ids[id]) continue;
      ids[id] = true;
    }
    const uniqueIDs = Object.keys(ids);
    return uniqueIDs;
  }

  _getMetaDocsByIDs(ids) {
    let promises = [];
    ids.forEach(_id => {
      promises.push(this.idb.command(this.idb._meta, "READ", { _id }))
    });
    return Promise.all(promises);
  }

  _getChangesForTortoise(lastTortoiseKey, highestTurtleKey, turtleHistoryDoc) {
    return new Promise((resolve, reject) => {
      if (lastTortoiseKey === highestTurtleKey) {
        reject("No sync needed.")
      }
      resolve(this._getMetaDocsOfUpdatedDocs(lastTortoiseKey, highestTurtleKey));
    })
    .catch(err => console.log(err));
  }

  _getDocsForTortoise(tortoiseResponse) {
    const promises = tortoiseResponse.data.map(_id_rev => {
      return this.idb.command(this.idb._store, "INDEX_READ", {data: { indexName: '_id_rev', key: _id_rev }});
    });
    return Promise.all(promises);
  }

  _updateTurtleSyncHistory(highestTurtleKey, sessionID, turtleHistoryDoc) {
    let newHistory = { lastKey: highestTurtleKey, sessionID };
    let updatedHistoryDoc = Object.assign(
      turtleHistoryDoc, { history: [newHistory].concat(turtleHistoryDoc.history) }
    );
    return this.idb.command(this.idb._sync, "UPDATE", { data: updatedHistoryDoc });
  }

  // ----- Public API Methods ----- //

  create(data) {
    if (typeof data === 'object' && !Array.isArray(data)) {
      let newDoc = Object.assign({}, data);
      let _id;

      if (!newDoc._id && newDoc._id !== 0) {
        _id = uuidv4();
      } else {
        _id = newDoc._id;
        delete newDoc._id;
      }
      //revision + id
      const _rev = '1-' + md5(JSON.stringify(newDoc));
      newDoc._id_rev = _id + '::' + _rev;
      //insert into meta
      let metaDoc = { _id, revisions: [_rev] };
      return this.idb.command(this.idb._meta, "CREATE", { data: metaDoc })
        .then(() => this.idb.command(this.idb._store, "CREATE", { data: newDoc }))
        .catch(err => console.log("Create error:", err));
    } else {
      console.log('Please pass in a valid object.');
    }
  }

  read(_id) {
    return this._readMetaDoc(_id)
      .then(meta => meta.revisions[0])
      .then(winningRev => this._readRevFromIndex(_id, winningRev))
      .then(doc => {
        if (doc._deleted) throw new Error("This document has been deleted.");

        const data = Object.assign({}, doc);
        [ data._id, data._rev ] = data._id_rev.split('::');
        delete data._id_rev;
        return data;
      })
      .catch(err => console.log("Read error:", err));
  }

  //requires a full document. will not append updates.
  update(_id, newDoc) {
    let metaDoc;
    return this._readMetaDoc(_id)
      .then(meta => {
        metaDoc = meta;
        return metaDoc.revisions[0];
      })
      .then(winningRev => this._readRevFromIndex(_id, winningRev))
      .then(oldVersion => {
        if (oldVersion._deleted) throw new Error("This document has already been deleted.");
        const newVersion = this._generateNewVersion(_id, oldVersion, newDoc);
        this.idb.command(this.idb._store, "CREATE", { data: newVersion });
        return newVersion._id_rev.split('::')[1];
      })
      .then(newRev => {
        const updatedMetaDoc = Object.assign(metaDoc, {revisions: [newRev].concat(metaDoc.revisions)})
        return this.idb.command(this.idb._meta, "UPDATE", { data: metaDoc });
      })
      .catch(err => console.log("Update error:", err));
  }

  delete(_id) {
    return this.update(_id, { _deleted: true });
  }

  // BULK OPERATIONS

  readAllValues() {
    return this.idb.command(this.idb._meta, "READ_ALL", {})
     .then(metaDocs => {
       let promises = metaDocs.map(doc => this._readWithoutDeletedError(doc._id));
       return Promise.all(promises);
     })
     .then(docs => {
       return docs.filter(doc => doc);
     })
     .catch(err => console.log("readAllValues error:", err));
  }

  filterBy(selector) {
    return this.idb.filterBy(selector);
  }

  deleteAll() {
    return this.idb.command(this.idb._store, "DELETE_ALL", {});
  }

  dropDB() {
    return this.idb.dropDB();
  }

  //TASKS
  //compare_sync_history with tortoiseDB
  //remove underscores

  //handle case where tortoise was deleted since last sync

  replicate(target) {
    target = 'http://localhost:3000'; // for testing purposes only
    let sessionID = this._generateSessionID();
    let turtleHistoryDoc;
    let highestTurtleKey;
    let lastTurtleKey;
    let lastTortoiseKey;

    // turtle:
    // {
    //   _id: 'turtleDB:1231',
    //   lastKey: 5,
    //   // highestTurtleKey: 5,
    //   history: [ {lastKey: 5 ,sessionID: 123} ]
    // }
    //
    // tortoise:
    // {
    //   _id: 'turtleDB::1231'
    //   lastKey: 5,
    //   history: [ {lastKey: 5, sessionID: 123} ]
    // }


    this._getTurtleHistoryDoc()
    .then(history => turtleHistoryDoc = history)
    this._getHighestStoreKey()
    .then(key => {
      highestTurtleKey = key;
      //lastTurtleKey = this._getLastStoreKey(turtleHistoryDoc)
    })
    .then(() => axios.post(target + '/_compare_sync_history', turtleHistoryDoc))
    .then(key => lastTortoiseKey = key)

      //if turtle/tortoise histories[0] are different, send over everything in
      //turtle

      //if turtle/tortoise lastKey are the same
      // check turtleHighest === turtleLast && tortoiseLast,
      // throw err;
      // else send over turtleHighest - turtleLast
    .then(() => this._getChangesForTortoise(lastTortoiseKey, highestTurtleKey, turtleHistoryDoc))
    .then(res => console.log(res))
    // .then(metaDocs => axios.post(target + '/_rev_diffs', { sessionID, metaDocs }))
    // .then(tortoiseResponse => this._getDocsForTortoise(tortoiseResponse))
    // .then(docs => axios.post(target + '/_bulk_docs', { docs }))
    // .then(() => this._updateTurtleSyncHistory(highestTurtleKey, sessionID, turtleHistoryDoc))
    // .then(res => console.log(res))
    // .catch(err => console.log(err));
  }
}

// for development purposes, putting turtleDB on window
window.turtleDB = new TurtleDB('turtleDB');

export default turtleDB;
