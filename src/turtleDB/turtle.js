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

  // figuring out replication work - will have to be cleaned up:

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
        //metaDoc = Object.assign({}, {revisions: [newRev].concat(metaDoc.revisions))
        metaDoc.revisions.unshift(newRev); // mutating
        return this.idb.command(this.idb._meta, "UPDATE", { data: metaDoc });
    }).catch(err => console.log("Update error:", err));
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
    this.idb.deleteAll();
  }

  dropDB() {
    return this.idb.dropDB();
  }


  // SYNCING
  //replicate documentation:
    //turtle post '/_rev_diffs'
      //turtle sends batch of metaDocs from change feed to tortoise
      //tortoise checks what revisions it doesn't have: tortoiseDB.revDiffs()
        //tortoise.revDiffs() gets local metadocs for the same IDs: mongoShell.READ_ALLMetaDocs()
        //tortoise.revDiffs() gets back metadocs and then compares the revision IDs: tortoiseDB.findMissingRevs()
          //tDB.findMissingRevs() returns a filtered set of turtle's metadocs to tortoiseDB.revDiffs()
        //tortoise.revDiffs() passes these metadoc to tortoise.updateMetaDocs()
      //tortoise updates the metadocs that are not up to date
      //tortoise sends back a list of revIDs it needs data for from turtle
      //


  //generate a session ID for every replicate w/ DateISOString
  //get the last sync from history
    //get the last_seq
    //get highest key from store
    //if they are the same, stop
    //otherwise, get all unique _ids for records in (last_seq + 1 - highest key)
    //get all metadocs for those _ids
    //generate new session id
    //send those metadocs and session id with /_rev_diffs

  //after _bulk_docs returns a successful response, update sync history
    //insert into history -> { last_seq: max key, session_id }


  generateSessionID() {
    return new Date().toISOString();
  }

  getHighestStoreKey() {
    return this.idb.command(this.idb._store, "GET_ALL_KEYS", {})
      .then(keys => keys[keys.length - 1])

  }

  _getUniqueIDs(docs) {
    let ids = {};
    for (let i = 0; i < docs.length; i++) {
      const id = docs[i]._id_rev.split("::")[0];
      if (ids[id]) continue;
      ids[id] = true;
    }
    const uniqueIDs = Object.keys(ids);
    console.log(uniqueIDs);
    return uniqueIDs
  }

  readMetaDocsByIDs(ids) {
    let promises = [];
    ids.forEach(_id => {
      promises.push(this.idb.command(this.idb._meta, "READ", { _id }))
    });
    return Promise.all(promises);
  }

  replicate(target) {
    // temporary fix
    target = 'http://localhost:3000';

    let lastKey;
    let highestKey;
    let sessionID = this.generateSessionID();
    let turtleHistoryDoc;
    const syncHistory = this.idb.command(this.idb._sync, "READ_ALL", {})
    .then(syncRecords => syncRecords.filter(record => record._id.split("::")[0] === 'turtleDB')[0])
    .then(res => {
      turtleHistoryDoc = res;
      if (turtleHistoryDoc.history.length === 0) {
        lastKey = 0;
      } else {
        lastKey = turtleHistoryDoc.history[0].lastKey;
      }
    })
    .then(() => this.getHighestStoreKey().then(key => highestKey = key))
    .then(() => {
      if (lastKey === highestKey) {
        return Promise.reject("No sync needed.")
      }
      return this.idb.readValuesBetweenKeys({ x: lastKey + 1, y: highestKey });
    })
    .then(docs => this._getUniqueIDs(docs))
    .then(ids => this.readMetaDocsByIDs(ids))
    .then(metaDocs => axios.post(target + '/_rev_diffs', { sessionID, metaDocs }))

    // Handle response from Tortoise
    .then(_id_revs => {
      const promises = _id_revs.data.map(_id_rev => {
        return this.idb.command(this.idb._store, "INDEX_READ", {data: { indexName: '_id_rev', key: _id_rev }});
        //return this.idb.readFromIndex(this.idb._store, '_id_rev', _id_rev);
      });
      return Promise.all(promises);
    })

    .then(docs => axios.post(target + '/_bulk_docs', { docs }))
    .then(res => {
      let newHistory = { lastKey: highestKey, sessionID };
      let updatedHistoryDoc = Object.assign(
        turtleHistoryDoc, { history: [newHistory].concat(turtleHistoryDoc.history) }
      );
      return this.idb.command(this.idb._sync, "UPDATE", { data: updatedHistoryDoc });
    })
    .then(res => console.log(res))
    .catch(err => console.log(err));
  }
}

// for development purposes, putting turtleDB on window
window.turtleDB = new TurtleDB('turtleDB');

export default turtleDB;
