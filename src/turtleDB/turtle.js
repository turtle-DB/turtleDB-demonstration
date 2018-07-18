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
        .then(() => {
          return this.idb._crud(this.idb._store, 'create', { data: newDoc });
        })
        .catch(err => {
          console.log("Create error:", err);
        })
    } else {
      console.log('Please pass in a valid object.')
    }
  }

  read(key) {
    return this.idb._crud('read', { key });
  }

  // get document
    //getDoc(ID)
      //first go to meta store, get winningRevID
      //concat ID - winningRevID
      //go to _store index
      //takes us to store data

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
