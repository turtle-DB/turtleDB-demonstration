import md5 from 'md5';
import uuidv4 from 'uuid/v4';

const developerAPI = {
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
  },

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
  },

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
