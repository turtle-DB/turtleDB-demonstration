class IDBShell {
  constructor(name) {
    this._store = 'store';
    this._meta = 'metaStore';

    this.ready = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(name);

      request.onupgradeneeded = e => {
        console.log('on upgrade needed fired!')
        console.log(e.target)
        this.db = e.target.result;
        this.db.createObjectStore(this._store, { autoIncrement: true })
               .createIndex('_id_rev', '_id_rev', { unique: true });
        this.db.createObjectStore(this._meta, { keyPath: '_id' });
      };

      request.onsuccess = e => {
        console.log('on success fired!')
        console.log(e.target.result)
        this.db = e.target.result; // IDBDatabase object
        resolve();
      };

      request.onerror = e => {
        this.db = e.target.result;
        reject(e);
      };
    });
  }
  // ****************************************************
  // ****************************************************
  // Schema Operations
  // var myIDBIndex = objectStore.createIndex(indexName, keyPath);
  // var myIDBIndex = objectStore.createIndex(indexName, keyPath, objectParameters);
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

  // ****************************************************
  // ****************************************************
  // BASIC CRUD OPERATIONS
  _crud(storeName, op, { _id, data }) {
    return this.ready.then(() => {
      return new Promise((resolve, reject) => {
        let request = this.getStore(storeName, op === 'read' ? 'readonly' : 'readwrite');
        if (request) {
          switch (op) {
            case "create":
              request = request.add(data);
              break;
            case "read":
              request = request.get(_id);
              break;
            case "update":
              request = request.put(data);
              break;
            case "delete":
              request = request.delete(_id);
              break;
            default:
              break;
          }
        }
        request.onsuccess = e => {
          resolve(e.target.result);
        }
        request.onerror = e => {
          console.log(`${op} error:`, e);
          reject(e);
        }
      })
    })
  }

  readFromIndex(storeName, indexName, key) {
    return new Promise((resolve, reject) => {
      const request = this.getStore(storeName).index(indexName).get(key);
      request.onsuccess = e => {
        resolve(e.target.result);
      };
    });
  }

  // ****************************************************
  // ****************************************************
  // Bulk OPERATIONS

  // Read All
  readAllMetaDocs() {
    return this.ready.then(() => {
      return new Promise((resolve, reject) => {
        const requestMeta = this.getStore(this._meta).getAll();
        requestMeta.onsuccess = () => resolve(requestMeta.result);
        requestMeta.onerror = e => reject(e);
      })
    })
  }

  // Read Between Range
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

  // ****************************************************
  // ****************************************************
  // Store Operations
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

  // *** NEED THIS TO RETURN ARRAY ***
  getAllKeysFromStore(store) {
    return new Promise((resolve, reject) => {
      const request = this.getStore(store).getAllKeys();
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  getLengthOfStore(store) {
    return new Promise((resolve, reject) => {
      const request = this.getStore(store).count();
      request.onsuccess = () => {
        resolve(request.result);
      }
    })
  }

  getAllStoreNames() {
    return Array.prototype.slice.call(this.db.objectStoreNames);
  }

  hasStoreName(store) {
    return this.getAllStoreNames().includes(store);
  }

  //IDBCURSOR operations - advance(num), continue(), continuePrimaryKey(), delete(), update()
  //IDBCURSOR properties - source, direction, key, primaryKey
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

  //1 - you cannot change primary keys using cursor.update()
  //2 - you can't directly put cursor.value into an update call,
  //3 - hence the below example using an intermediary updateData variable
  //4 - .update() onsuccess is not necessary
  //5 - https://stackoverflow.com/questions/47934408/how-can-i-know-that-idbcursor-reached-its-last-value
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

  deleteAll() {
    this.getStore(this._store, 'readwrite').clear().onsuccess = e => {
      console.log("Store cleared:", e.target.readyState);
    };
  }
  //
  // db.find({
  //   selector: {name: 'Mario'},
  //   // fields: ['_id', 'name'],
  //   // sort: ['name']
  // }).then(function (result) {
  //   // handle result
  // }).catch(function (err) {
  //   console.log(err);
  // });

  // ****************************************************
  // ****************************************************
  // Filtering
  filterBy(selector) { // selector format: {eyeColor: 'green', gender: 'male'}
    let fields = Object.keys(selector);
    return this.readAllValues()
      .then(vals => vals.filter((doc) => {
        return fields.every(field => doc[field] === selector[field])
      })
    );
  }

  //
  // filterByKey(lower, upper) {
  //   var keyRangeValue = IDBKeyRange.bound(lower, upper);
  //
  //   this.getStore(this._store).openCursor(keyRangeValue).onsuccess = (e) => {
  //     let cursor = e.target.result;
  //     if (cursor) {
  //       let value = cursor.value;
  //       console.log(value);
  //       cursor.continue();
  //     } else {
  //       console.log('Cursor finished');
  //     }
  //   }
  // };

  // ****************************************************
  // ****************************************************
  // Database Operations

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

// const turtleDB = new TurtleDB('turtleDB');
// const turtleDBTest = new TurtleDB('turtleDBTest');

// export { turtleDB  };

export default IDBShell;
