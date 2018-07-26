import md5 from 'md5';
import uuidv4 from 'uuid/v4';
import SyncTo from './syncTo';
import SyncFrom from './syncFrom';

const developerAPI = {
  syncTo(remoteURL) {
    return new Promise((resolve, reject) => {
      const syncTo = new SyncTo('http://localhost:3000');
      syncTo.idb = this.idb;
      return syncTo.start();
    })
  },

  syncFrom(remoteURL) {
    return new Promise((resolve, reject) => {
      const syncFrom = new SyncFrom('http://localhost:3000');
      syncFrom.idb = this.idb;
      return syncFrom.getTurtleID()
      .then(() => syncFrom.start());
    })
  },

  sync() {
    this.syncTo()
      .then(() => this.syncFrom())
      .catch((err) => console.log(err));
  },

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
      const _rev = '1-' + md5(JSON.stringify(newDoc));
      newDoc._id_rev = _id + '::' + _rev;

      let metaDoc = { _id, _winningRev: _rev, revisions: [_rev, {}, []] };
      return this.idb.command(this.idb._meta, "CREATE", { data: metaDoc })
        .then(() => this.idb.command(this.idb._store, "CREATE", { data: newDoc }))
        .catch(err => console.log("Create error:", err));
    } else {
      console.log('Please pass in a valid object.');
    }
  },

  read(_id) {
    return this._readMetaDoc(_id)
      .then(meta => this._readRevFromIndex(_id, meta._winningRev))
      .then(doc => {
        if (doc._deleted) throw new Error("This document has been deleted.");

        const data = Object.assign({}, doc);
        [ data._id, data._rev ] = data._id_rev.split('::');
        delete data._id_rev;
        return data;
      })
      .catch(err => console.log("Read error:", err));
  },

  //requires a full document. will not append updates.
  update(_id, newProperties) {
    // opts = { rev: '4-fjiojfoigjojg' }
    let metaDoc;
    return this._readMetaDoc(_id)
      .then(meta => {
        metaDoc = meta;
        return metaDoc._winningRev;
      })
      .then(winningRev => this._readRevFromIndex(_id, winningRev))
      .then(oldDoc => {
        if (oldDoc._deleted) throw new Error("This document has already been deleted.");

        const newDoc = this._generateNewDoc(oldDoc, newProperties);
        this.idb.command(this.idb._store, "CREATE", { data: newDoc });
        return newDoc._id_rev.split('::')[1];
      })
      .then(newRev => {
        // mutates metaDoc:
        this._updateMetaDocRevisionTree(metaDoc, newRev, newProperties._deleted);
        metaDoc._winningRev = newRev;
        return this.idb.command(this.idb._meta, "UPDATE", { data: metaDoc });
      })
      .catch(err => console.log("Update error:", err));
  },

  _updateMetaDocRevisionTree(metaDoc, newRev, _deleted) {
    let rootNode = metaDoc.revisions;
    this._insertNewRev(rootNode, metaDoc._winningRev, newRev, _deleted);
  },

// for reference  [1-a, {}, [children]]
  _insertNewRev(node, winningRev, newRev, _deleted) {
    if (node[0] === winningRev) {
      if (_deleted) {
        return node[2].push([newRev, { _deleted: true }, []]);
      } else {
        return node[2].push([newRev, {}, []]);
      }
    }

    for (let i = 0; i < node[2].length; i++) {
      this._insertNewRev(node[2][i], winningRev, newRev, _deleted);
    }
  },

  delete(_id) {
    return this.update(_id, { _deleted: true });
  },

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
  },

  filterBy(selector) {
    return this.idb.filterBy(selector);
  },

  deleteAll() {
    return this.idb.command(this.idb._store, "DELETE_ALL", {});
  },

  dropDB() {
    return this.idb.dropDB();
  },
}

export default developerAPI;
