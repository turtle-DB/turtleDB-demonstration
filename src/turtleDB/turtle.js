import uuidv4 from 'uuid/v4';
import IDBShell from './IDBShell';
import md5 from 'md5';
import axios from 'axios';

import Replicator from './replicator';

class TurtleDB {
  constructor() {
    this.idb = new IDBShell('turtleDB');
  }

  replicate(target) {
    const replicator = new Replicator('http://localhost:3000');
    replicator.idb = this.idb;
    return replicator.replicate();
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

  _getLastStoreKey(turtleHistoryDoc) {
    if (turtleHistoryDoc.history.length === 0) {
      return 0;
    } else {
      return turtleHistoryDoc.history[0].lastKey;
    }
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
}

// for development purposes, putting turtleDB on window
window.turtleDB = new TurtleDB('turtleDB');

export default turtleDB;
