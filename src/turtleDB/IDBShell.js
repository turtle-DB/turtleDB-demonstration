import uuidv4 from 'uuid/v4';

class IDBShell {
  constructor(name) {
    this._store = 'store';
    this._meta = 'metaStore';
    this._sync = 'syncHistoryStore';

    this.ready = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(name);

      request.onupgradeneeded = e => {
        console.log('on upgrade needed fired!')
        console.log(e.target)
        this.db = e.target.result;
        this.db.createObjectStore(this._store, { autoIncrement: true })
               .createIndex('_id_rev', '_id_rev', { unique: true });
        this.db.createObjectStore(this._meta, { keyPath: '_id' });
        this.db.createObjectStore(this._sync, { keyPath: '_id' });
      };

      request.onsuccess = e => {
        console.log('on success fired!')
        console.log(e.target.result)
        this.db = e.target.result;
        this._hasSyncHistory();
        resolve();
      };

      request.onerror = e => {
        this.db = e.target.result;
        reject(e);
      };
    });
  }

  _hasSyncHistory() {
    return this.command(this._sync, 'GET_ALL_KEYS', {})
      .then(keys => {
        if (keys.length === 0) this._createLocalSyncHistory()
      })
      .catch(err => console.log(err));
  }

  _createLocalSyncHistory() {
    const turtleID = "turtleDB::" + uuidv4();
    const syncHistory = { history: [], _id: turtleID };
    this.command(this._sync, "CREATE", { data: syncHistory })
    .then((res) => console.log(res))
    .catch(err => console.log(err));
  }

  command(storeName, action, { _id, data, x, y }) {
    return this.ready.then(() => {
      return new Promise((resolve, reject) => {
        let request = this.getStore(storeName, ["READ", "READ_ALL"].includes(action) ? 'readonly' : 'readwrite');
        if (request) {
          if (action === "CREATE") {
            request = request.add(data);
          } else if (action === "READ") {
            request = request.get(_id);
          } else if (action === "READ_ALL") {
            request = request.getAll();
          } else if (action === "READ_BETWEEN") {
            request = request.getAll(IDBKeyRange.bound(x, y));
          } else if (action === "UPDATE") {
            request = request.put(data);
          } else if (action === "INDEX_READ") {
            request = request.index(data.indexName).get(data.key);
          } else if (action === "DELETE") {
            request = request.delete(_id);
          } else if (action === "DELETE_ALL") {
            request = request.clear();
          } else if (action === "GET_ALL_KEYS") {
            request = request.getAllKeys();
          } else if (action === "COUNT") {
            request = request.count();
          }
        }
        request.onsuccess = e => {
          resolve(e.target.result);
        }
        request.onerror = e => {
          console.log(`${action} error:`, e);
          reject(e);
        }
      })
    })
  }

  // currently won't work for _id in store
  // need to filter by winning & non-deleted docs
  filterBy(selector) { // selector format: {eyeColor: 'green', gender: 'male'}
    let fields = Object.keys(selector);
    return this.command(this._store, "READ_ALL", {})
      .then(docs => docs.filter(doc => fields.every(field => {
        return doc[field] === selector[field]
      }))
    );
  }

  deleteBetweenNumbers(start, end) {
    return new Promise((resolve, reject) => {
      let counter = 0;
        this.getStore(this._store, 'readwrite').openCursor().onsuccess = (e) => {
          let cursor = e.target.result;
          if (cursor) {
            counter += 1;
            if (counter >= start && counter <= end) {
              cursor.delete();
            }
            cursor.continue();
          }
        }
        resolve();
    })
  }

// STORE OPERATIONS

  getStore(store, op) {
    if (this.hasStoreName(store)) {
      return this.db
        .transaction([store], op)
        .objectStore(store)
    } else {
      console.log(`Store <${store}> does not exist!`);
      return null;
    }
  }

  getAllStoreNames() {
    return Array.prototype.slice.call(this.db.objectStoreNames);
  }

  hasStoreName(store) {
    return this.getAllStoreNames().includes(store);
  }

// need to clean up:
  editFirstNDocuments(amount) {
    return new Promise((resolve, reject) => {
      let counter = 0;
        this.getStore(this._store, 'readwrite').openCursor().onsuccess = (e) => {
          let cursor = e.target.result;
          if (!cursor) {
            console.log('Cursor finished!');
            resolve();
          }
          if (cursor) {
            counter += 1;
            if (counter <= amount) {
              let updateData = cursor.value;
              updateData.eyeColor = 'green';
              let request = cursor.update(updateData);
              // request.onsuccess = function() {
              //   console.log(counter);
              // };
            }
            cursor.continue();
          }
        }
    })
  }

  // DATABASE OPERATIONS

  addIndex(field) {
    this.ready = new Promise((resolve, reject) => {
      this.db.close();
      const request = window.indexedDB.open("turtleDB", this.db.version + 1);
      request.onupgradeneeded = e => {
        this.db = e.target.result;
        // Version change transaction:
        const transaction = e.target.transaction;
        try {
          transaction.objectStore('store').createIndex(field, field);
          resolve(`Index: ${field} created successfully.`);
        } catch (err) {
          reject(err);
        }
      };
    });
    return this.ready;
  }

  dropDB() {
    return new Promise((resolve, reject) => {
      const deleteRequest = window.indexedDB.deleteDatabase('turtleDB');
      deleteRequest.onsuccess = e => {
        console.log('turtleDB was deleted successfully.');
        resolve();
      }
      deleteRequest.onerror = e => {
        console.log('Error deleting database...');
        reject(e)
      }
      deleteRequest.onblocked = e => {
        console.log('blocked:', e);
        this.db.close();
      }
    })
  }
}


export default IDBShell;
