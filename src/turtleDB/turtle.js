import uuidv4 from 'uuid/v4';
import IDBShell from './IDBShell';
import md5 from 'md5';

class TurtleDB {
  constructor() {
    this.idb = new IDBShell('turtleDB');
  }

  create(data) {
    if (typeof data === 'object' && !Array.isArray(data)) {
      data.id = uuidv4();
      //revision ids
      let newDoc = { key: data.id, data };
      const rev = '1-' + md5(JSON.stringify(newDoc));
      newDoc.data.rev = rev;
      return this.idb._crud('create', newDoc);
    } else {
      console.log('Please pass in a valid object.')
    }
  }

  read(key) {
    return this.idb._crud('read', { key });
  }

  update(key, data) {
    return this.read(key).then((doc) => {
      let updatedDoc = Object.assign({}, doc, data);
      const oldRev = parseInt(updatedDoc.rev.split('-')[0], 10);
      const newRev = `${oldRev + 1}-` + md5(updatedDoc);
      updatedDoc.rev = newRev;
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
