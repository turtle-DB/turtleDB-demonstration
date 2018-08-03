import md5 from 'md5';
import uuidv4 from 'uuid/v4';
import SyncTo from './syncTo';
import SyncFrom from './syncFrom';
const debug = require('debug');

var logTo = debug('turtleDB:syncToSummary');
var logFrom = debug('turtleDB:syncFromSummary');

const developerAPI = {
  syncTo(remoteURL) {
    logTo('\n ------- NEW Turtle ==> Tortoise SYNC ------');
    return new Promise((resolve, reject) => {
      const syncTo = new SyncTo('http://localhost:3000');
      syncTo.idb = this.idb;
      resolve(syncTo.start().then(() => {
        logTo('\n ------- Turtle ==> Tortoise sync complete ------');
      }));
    })
  },

  syncFrom(remoteURL) {
    logFrom('\n\n\n ------- NEW Tortoise ==> Turtle SYNC ------');
    return new Promise((resolve, reject) => {
      const syncFrom = new SyncFrom('http://localhost:3000');
      syncFrom.idb = this.idb;
      resolve(syncFrom.start().then(() => {
        logFrom('\n ------- Tortoise ==> Turtle sync complete ------');
      }));
    })
  },

  sync() {
    if (!this.syncInProgress) {
      this.syncInProgress = true;
      return this.syncTo()
        .then(() => this.syncFrom())
        .then(() => this.syncInProgress = false)
        .catch((err) => console.log(err));
    } else {
      return Promise.reject('Sync already in progress');
    }
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
        [data._id, data._rev] = data._id_rev.split('::');
        delete data._id_rev;
        return data;
      })
      .catch(err => console.log("Read error:", err));
  },

  //requires a full document. will not append updates.
  update(_id, newProperties, revId = null) {
    let metaDoc;
    let newDoc;
    let rev;

    return this._readMetaDoc(_id)
      .then(doc => {
        // save metaDoc to be used later
        metaDoc = doc;

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

        // return this._readRevFromIndex(_id, rev);
        return rev;
      })
      .then(oldRev => {
        newDoc = this._generateNewDoc(_id, oldRev, newProperties);
        this.idb.command(this.idb._store, "CREATE", { data: newDoc });

        return {
          newRev: newDoc._id_rev.split('::')[1],
          oldRev: rev
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
        [data._id, data._rev] = data._id_rev.split('::');
        delete data._id_rev;
        return data;
      })
      .catch(err => console.log("Update error:", err));
  },

  delete(_id, revId = null) {
    return this.update(_id, { _deleted: true }, revId);
  },

  makeRevWinner(doc) {
    const { _id, _rev } = doc;

    return this._readMetaDoc(_id)
      .then(metaDoc => {
        const leafRevsToDelete = metaDoc._leafRevs.filter(rev => rev !== _rev);

        let result = Promise.resolve();
        leafRevsToDelete.forEach(rev => {
          result = result.then(() => this.delete(_id, rev));
        });

        return result;
      })
      .then(() => this.update(_id, doc, _rev))
      .catch(err => console.log("makeRevWinner error:", err));
  },

  editNDocumentsMTimes(docs, times) {
    let result = Promise.resolve();

    for (let i = 0; i < times; i += 1) {
      //create promise chain
      result = result.then(() => this.idb.editFirstNDocuments(docs));
    }

    result.then(() => console.log('finished editing'));
  },

  autoSyncOn() {
    this.intervalId = setInterval(this.sync.bind(this), 3000);
  },

  autoSyncOff() {
    clearInterval(this.intervalId);
  },

  compactStore() {
    // (could also generate list of NON-leaf rev ids via traversal of tree and use that list to either: w/ a cursor OR make individual delete calls.)

    // get all metadocs, generate master list of _id_revs from _leafRevs

    // iterate through all store docs using cursor, can check value using cursor.value._id_rev

    // if id_rev not in array of _id_rev values AND is not _deleted: true, can delete it using cursor.delete

    // const allLeafRevIds = [];

    // this.idb.command(this.idb._meta, "READ_ALL", {})
    //   .then((metaDocs) => {

    //   })


    // let startTime = Date.now();
    // Promise.all(insertPromises).then(() => {
    //   let timeSpent = Date.now() - startTime;
    //   this.setState({
    //     benchmark: {
    //       time: timeSpent,
    //       type: "INSERT",
    //       count: n
    //     }
    //   });



    // this.idb.getStore(this.idb._store, 'readonly').openCursor().onsuccess = e => {
    //   const cursor = e.target.result;
    //   if (!cursor) {
    //     console.log("cursor finished!");
    //     resolve(Promise.all(deletePromises));
    //   } else {
    //     if (!!e.target.result.value._winningRev && counter >= start && counter < end) {
    //       const _id = e.target.result.value._id;
    //       deletePromises.push(turtleDB.delete(_id));
    //       counter += 1;
    //     }
    //     cursor.continue()
    //   }
    // }

    // function deleteResult() {
    //   list.innerHTML = '';
    //   var transaction = db.transaction(['rushAlbumList'], 'readwrite');
    //   var objectStore = transaction.objectStore('rushAlbumList');

    //   objectStore.openCursor().onsuccess = function (event) {
    //     var cursor = event.target.result;
    //     if (cursor) {
    //       if (cursor.value.albumTitle === 'Grace under pressure') {
    //         var request = cursor.delete();
    //         request.onsuccess = function () {
    //           console.log('Deleted that mediocre album from 1984. Even Power windows is better.');
    //         };
    //       } else {
    //         var listItem = document.createElement('li');
    //         listItem.innerHTML = '<strong>' + cursor.value.albumTitle + '</strong>, ' + cursor.value.year;
    //         list.appendChild(listItem);
    //       }
    //       cursor.continue();
    //     } else {
    //       console.log('Entries displayed.');
    //     }
    //   };
    // };
  },

  getStorageInfo() {
    return navigator.storage.estimate()
      .then(({ quota, usage }) => {
        return {
          // Quota here is total/shared temporary storage space available for all Chrome apps
          // Technically, one app/origin (like localhost) only has access to 20% of this value
          totalQuota: this.sizeOf(quota),
          appQuota: this.sizeOf(quota * 0.2),
          appUsage: this.sizeOf(usage)
        };
      });
  },

  sizeOf(bytes) {
    if (bytes == 0) { return "0.00 B"; }
    var e = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, e)).toFixed(2) + ' ' + ' KMGTP'.charAt(e) + 'B';
  },

  // BULK OPERATIONS

  readAllMetaDocsAndDocs() {
    const result = {};

    return this.idb.command(this.idb._meta, "READ_ALL", {})
      .then(metaDocs => {
        result.metaDocs = metaDocs.filter(doc => doc._winningRev);
        let promises = metaDocs.map(metaDoc => this._readWithoutDeletedError(metaDoc._id));
        return Promise.all(promises);
      })
      .then(docs => {
        result.docs = docs.filter(doc => !!doc);
        return result;
      })
      .catch(err => console.log("readAllMetaDocsAndDocs error:", err));
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
