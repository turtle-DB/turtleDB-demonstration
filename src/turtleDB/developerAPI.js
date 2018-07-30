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

      let metaDoc = {
        _id,
        _winningRev: _rev,
        _revisions: [_rev, {}, []],
        _leafRevs: [_rev]
      };

      return this.idb.command(this.idb._meta, "CREATE", { data: metaDoc })
        .then(() => this.idb.command(this.idb._store, "CREATE", { data: newDoc }))
        .catch(err => console.log("Create error:", err));
    } else {
      console.log('Please pass in a valid object.');
    }
  },

  read(_id, revId = null) {
    return this._readMetaDoc(_id)
      .then(metaDoc => {
        let rev;

        if (!metaDoc._winningRev) {
          throw new Error("This document has been deleted.");
        } else if (!revId) {
          rev = metaDoc._winningRev;
        } else {
          if (metaDoc._leafRevs.includes(revId)) {
            rev = revId;
          } else {
            throw new Error("Invalid Revision Id");
          }
        }

        return this._readRevFromIndex(_id, rev);
      })
      .then(doc => {
        const data = Object.assign({}, doc);
        [ data._id, data._rev ] = data._id_rev.split('::');
        delete data._id_rev;
        return data;
      })
      .catch(err => console.log("Read error:", err));
  },

  //requires a full document. will not append updates.
  update(_id, newProperties, revId = null) {
    let metaDoc;
    let newDoc;

    return this._readMetaDoc(_id)
      .then(doc => {
        // save metaDoc to be used later
        metaDoc = doc;
        let rev;

        if (!metaDoc._winningRev) {
          throw new Error("This document has been deleted.");
        } else if (!revId) {
          rev = metaDoc._winningRev;
        } else {
          if (metaDoc._leafRevs.includes(revId)) {
            rev = revId;
          } else {
            throw new Error("Invalid Revision Id");
          }
        }

        return this._readRevFromIndex(_id, rev);
      })
      .then(oldDoc => {
        newDoc = this._generateNewDoc(oldDoc, newProperties, metaDoc);
        this.idb.command(this.idb._store, "CREATE", { data: newDoc });

        return {
          newRev: newDoc._id_rev.split('::')[1],
          oldRev: oldDoc._id_rev.split("::")[1]
        };
      })
      .then(({ newRev, oldRev }) => {
        // updating the meta doc:
        this._updateMetaDocRevisionTree(metaDoc._revisions, newRev, oldRev, newProperties._deleted);

        if (newProperties._deleted) {
          metaDoc._leafRevs.splice(metaDoc._leafRevs.indexOf(oldRev), 1);
        } else {
          metaDoc._leafRevs[metaDoc._leafRevs.indexOf(oldRev)] = newRev;
        }

        metaDoc._winningRev = this._getWinningRev(metaDoc._leafRevs) || null;

        return this.idb.command(this.idb._meta, "UPDATE", { data: metaDoc });
      })
      .then(() => {
        const data = Object.assign({}, newDoc);
        [ data._id, data._rev ] = data._id_rev.split('::');
        delete data._id_rev;
        return data;
      })
      .catch(err => console.log("Update error:", err));
  },

  delete(_id, revId = null) {
    return this.update(_id, { _deleted: true }, revId);
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
