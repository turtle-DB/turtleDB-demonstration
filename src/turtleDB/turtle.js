import IDBShell from './IDBShell';
import md5 from 'md5';
import SyncTo from './syncTo';
import SyncFrom from './syncFrom';

const debug = require('debug');
var logTo = debug('turtleDB:syncToSummary');
var logFrom = debug('turtleDB:syncFromSummary');

// turtleDB specific
import developerAPI from './developerAPI';

class TurtleDB {
  constructor() {
    this.idb = new IDBShell('turtleDB');
    this.syncInProgress = false;

    for (const prop in developerAPI) {
      if (typeof developerAPI[prop] === 'function') {
        this[prop] = developerAPI[prop];
      }
    }
  }

  _printRevTree(_id) {
    this._readMetaDoc(_id).then(metaDoc => {
      console.log('-----');
      console.log(`Revision Tree for ${_id}:`, JSON.stringify(metaDoc._revisions, undefined, 2));
      console.log('-----');
    });
  }

  _readMetaDoc(_id) {
    return this.idb.command(this.idb._meta, 'READ', { _id })
      .then(meta => meta);
  }

  _readRevFromIndex(_id, rev) {
    const _id_rev = _id + "::" + rev;
    return this.idb.command(this.idb._store, "INDEX_READ", { data: { indexName: '_id_rev', key: _id_rev } });
  }

  _readWithoutDeletedError(_id) {
    return this._readMetaDoc(_id)
      .then(metaDoc => {
        if (!metaDoc._winningRev) { return Promise.resolve(false); }
        return this._readRevFromIndex(_id, metaDoc._winningRev);
      })
      .then(doc => {
        if (!doc) { return false; }
        const data = Object.assign({}, doc);
        [data._id, data._rev] = data._id_rev.split('::');
        delete data._id_rev;
        return data;
      })
      .catch(err => console.log("Read error:", err));
  }

  _generateNewDoc(_id, oldRev, newProperties) {
    // const [_id, oldRev] = oldDoc._id_rev.split('::');
    const oldRevNumber = parseInt(oldRev.split('-')[0], 10);
    const newDoc = Object.assign({}, newProperties);

    delete newDoc._rev;
    delete newDoc._id;

    const newRev = `${oldRevNumber + 1}-` + md5(oldRev + JSON.stringify(newDoc));
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

  _getWinningRev(leafRevs) {
    return leafRevs.sort((a, b) => {
      let [revNumA, revHashA] = a.split('-');
      let [revNumB, revHashB] = b.split('-');
      revNumA = parseInt(revNumA, 10);
      revNumB = parseInt(revNumB, 10);

      if (revNumA > revNumB) {
        return -1;
      } else if (revNumA < revNumB) {
        return 1;
      } else {
        if (revHashA > revHashB) {
          return -1;
        } else {
          return 1;
        }
      }
    })[0];
  }

  _updateMetaDocRevisionTree(tree, newRev, oldRev, _deleted) {
    this._insertNewRev(tree, newRev, oldRev, _deleted);
  }

  _insertNewRev(node, newRev, oldRev, _deleted) {
    if (node[0] === oldRev) {
      if (_deleted) {
        return node[2].push([newRev, { _deleted: true }, []]);
      } else {
        return node[2].push([newRev, {}, []]);
      }
    }

    for (let i = 0; i < node[2].length; i++) {
      this._insertNewRev(node[2][i], newRev, oldRev, _deleted);
    }
  }

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
  }

  sizeOf(bytes) {
    if (bytes == 0) { return "0.00 B"; }
    var e = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, e)).toFixed(2) + ' ' + ' KMGTP'.charAt(e) + 'B';
  }

  // Sync

  syncTo(remoteURL) {
    logTo('\n ------- NEW Turtle ==> Tortoise SYNC ------');
    return new Promise((resolve, reject) => {
      resolve(this.syncToUntilFinished()
        .then(() => {
        logTo('\n ------- Turtle ==> Tortoise sync complete ------');
      }));
    })
  }

  syncFrom(remoteURL) {
    logFrom('\n\n\n ------- NEW Tortoise ==> Turtle SYNC ------');
    return new Promise((resolve, reject) => {
      resolve(this.syncFromUntilFinished()
        .then(() => {
        logFrom('\n ------- Tortoise ==> Turtle sync complete ------');
      }));
    })
  }

  syncToUntilFinished() {
    const syncTo = new SyncTo('http://localhost:3000');
    syncTo.idb = this.idb;
    return syncTo.start()
    .then(() => this.syncToUntilFinished())
    .catch(() => console.log('Turtle->Tortoise finished'));
  }

  syncFromUntilFinished() {
    const syncFrom = new SyncFrom('http://localhost:3000');
    syncFrom.idb = this.idb;
    return syncFrom.start()
    .then(() => this.syncFromUntilFinished())
    .catch(() => console.log('finished'));
  }

  // For Testing Purposes
  editNDocumentsMTimes(docs, times) {
    let result = Promise.resolve();
    for (let i = 0; i < times; i += 1) {
      //create promise chain
      result = result.then(() => this.idb.editFirstNDocuments(docs));
    }

    result.then(() => console.log('finished editing'));
  }

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
  }
}

// for development purposes, putting turtleDB on window
window.turtleDB = new TurtleDB('turtleDB');

export default turtleDB;
