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

  command(storeName, action, { _id, data }) {
    return this.ready.then(() => {
      return new Promise((resolve, reject) => {
        let request = this.getStore(storeName, ["READ", "READ_ALL"].includes(action) ? 'readonly' : 'readwrite');
        if (request) {
          switch (action) {
            case "CREATE":
              request = request.add(data);
              break;
            case "READ":
              request = request.get(_id);
              break;
            case "READ_ALL":
              request = request.getAll();
              break;
            case "INDEX_READ":
              request = request.index(data.indexName).get(data.key);
            case "UPDATE":
              console.log(data);
              request = request.put(data);
              break;
            case "DELETE":
              request = request.delete(_id);
              break;
            case "GET_ALL_KEYS":
              request = request.getAllKeys();
              break;
            case "COUNT":
              request = request.count();
              break;
            default:
              break;
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

  readValuesBetweenKeys(x, y) { // improve with default lower/upperbound
    return this.ready.then(() => {
      return new Promise((resolve, reject) => {
        const request = this.getStore(this._store)
          .getAll(IDBKeyRange.bound(x, y));
        request.onsuccess = () => {
          resolve(request.result);
        }
      })
    })
  }

  filterBy(selector) { // selector format: {eyeColor: 'green', gender: 'male'}
    let fields = Object.keys(selector);
    return this.readAllValues()
      .then(vals => vals.filter((doc) => {
        return fields.every(field => doc[field] === selector[field])
      })
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

  deleteAll() {
    this.getStore(this._store, 'readwrite').clear().onsuccess = e => {
      console.log("Store cleared:", e.target.readyState);
    };
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
