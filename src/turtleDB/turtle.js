import uuidv4 from 'uuid/v4';
import IDBShell from './IDBShell';
import axios from 'axios';
import md5 from 'md5';

// turtleDB specific
import developerAPI from './developerAPI';

class TurtleDB {
  constructor() {
    this.idb = new IDBShell('turtleDB');

    for (const prop in developerAPI) {
      if (typeof developerAPI[prop] === 'function') {
        this[prop] = developerAPI[prop];
      }
    }
  }

  _readMetaDoc(_id) {
    return this.idb.command(this.idb._meta, 'READ', { _id })
      .then(meta => meta);
  }

  _readRevFromIndex(_id, rev) {
    const _id_rev = _id + "::" + rev;
    return this.idb.command(this.idb._store, "INDEX_READ", {data: { indexName: '_id_rev', key: _id_rev }});
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

  _generateNewDoc(oldDoc, newProperties) {
    const [_id, oldRev] = oldDoc._id_rev.split('::');
    const oldRevNumber = parseInt(oldRev.split('-')[0], 10);

    const newDoc = Object.assign({}, newProperties);
    const newRev = `${oldRevNumber + 1}-` + md5(JSON.stringify(newDoc));
    newDoc._id_rev = _id + "::" + newRev;
    return newDoc;
  }

  _getLastStoreKey(turtleHistoryDoc) {
    if (turtleHistoryDoc.history.length === 0) {
      return 0;
    } else {
      return turtleHistoryDoc.history[0].lastKey;
    }
  }
}

// for development purposes, putting turtleDB on window
window.turtleDB = new TurtleDB('turtleDB');

export default turtleDB;
