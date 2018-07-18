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

  read(_id) {
    return this.idb._crud(this.idb._meta, 'read', { key: _id })
      .then(meta => {
        return meta.revisions[0];
      })
      .then(winningRev => {
        const _id_rev = _id + "::" + winningRev;
        return this.idb.readFromIndex(this.idb._store, '_id_rev', _id_rev);
      })
      .then(res => {
        const data = Object.assign({}, res);
        [ data._id, data._rev ] = data._id_rev.split('::');
        delete data._id_rev;
        return data;
      })
      .catch(err => console.log("Read error:", err));
  }

  update(key, data) {
    return this.read(key).then((doc) => {
      let updatedDoc = Object.assign({}, doc, data);
      const oldRev = parseInt(updatedDoc._rev.split('-')[0], 10);
      const newRev = `${oldRev + 1}-` + md5(updatedDoc);
      updatedDoc._rev = newRev;
      return this.idb._crud('create', { key, updatedDoc });
    })
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
