import uuidv4 from 'uuid/v4';
import IDBShell from './IDBShell';
import md5 from 'md5';

class TurtleDB {
  constructor() {
    this.idb = new IDBShell('turtleDB');
  }

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
      return this.idb._crud(this.idb._meta, 'create', { data: metaDoc })
        .then(() => this.idb._crud(this.idb._store, 'create', { data: newDoc }))
        .catch(err => console.log("Create error:", err));
    } else {
      console.log('Please pass in a valid object.');
    }
  }

  _readMetaDoc(_id) {
    return this.idb._crud(this.idb._meta, 'read', { key: _id })
      .then(meta => meta);
  }

  _readWinningRev(_id, winningRev) {
    const _id_rev = _id + "::" + winningRev;
    return this.idb.readFromIndex(this.idb._store, '_id_rev', _id_rev);
  }

  read(_id) {
    return this._readMetaDoc(_id)
      .then(meta => meta.revisions[0])
      .then(winningRev => this._readWinningRev(_id, winningRev))
      .then(res => {
        const data = Object.assign({}, res);
        [ data._id, data._rev ] = data._id_rev.split('::');
        delete data._id_rev;
        return data;
      })
      .catch(err => console.log("Read error:", err));
  }

  _generateNewVersion(_id, oldVersion, updates) {
    const oldRev = oldVersion._id_rev.split('::')[1];
    const oldRevNumber = parseInt(oldRev.split('-')[0], 10);

    delete oldVersion._id_rev;
    const updatedVersion = Object.assign({}, oldVersion, updates);
    const newRev = `${oldRevNumber + 1}-` + md5(updatedVersion);
    updatedVersion._id_rev = _id + "::" + newRev;
    return updatedVersion;
  }

  update(_id, updates) {
    let metaDoc;
    return this._readMetaDoc(_id)
      .then(meta => {
        metaDoc = meta;
        return metaDoc.revisions[0];
      })
      .then(winningRev => this._readWinningRev(_id, winningRev))
      .then(oldVersion => {
        const newVersion = this._generateNewVersion(_id, oldVersion, updates);
        this.idb._crud(this.idb._store, 'create', { data: newVersion });
        return newVersion._id_rev.split('::')[1];
      })
      .then(newRev => {
        metaDoc.revisions.unshift(newRev);
        return this.idb._crud(this.idb._meta, 'update', { data: metaDoc });
    }).catch(err => console.log("Update error:", err));
  }

  delete(key) {
    return this.idb._crud('delete', { key });
  }

  // BULK OPERATIONS

  filterBy(selector) {
    return this.idb.filterBy(selector);
  }

  readAllValues() {
    return this.idb.readAllValues();
  }

  dropDB() {
    return this.idb.dropDB();
  }
}

// for development purposes, putting turtleDB on window
window.turtleDB = new TurtleDB('turtleDB');

export default turtleDB;
