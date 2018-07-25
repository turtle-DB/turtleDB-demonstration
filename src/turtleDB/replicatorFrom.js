import uuidv4 from 'uuid/v4';
import axios from 'axios';

class ReplicatorFrom {

  constructor(targetUrl) {
    this.targetUrl = targetUrl;
    this.sessionID = this.generateSessionID();
  }

  replicate() {
    this.getLastTargetKey()
    .then(() => this.requestMetaDocs('/_source_meta_docs'))
    .then((res) => this.revDiffs(res.data))
    .then(() => this.requestStoreDocs('/_source_store_docs'))
    .then((res) => this.updateStoreAndReplicationHistory(res.data));
  }

  getTurtleID() {
    return this.idb.command(this.idb._turtleDBMeta, "READ_ALL", {})
    .then(docs => this.turtleID = docs[0]._id);
  }

  generateSessionID() {
    return new Date().toISOString();
  }

  getLastTargetKey() {
    return this.idb.command(this.idb._replicationHistoryFrom, "READ_ALL", {})
    .then(docs => {
      const localReplicationFromRecord = docs[0];
      this.lastTargetKey = localReplicationFromRecord.history.length === 0 ?
        '0' : localReplicationFromRecord.history[0].lastKey;
    })
  }

  requestMetaDocs(path) {
    return axios.post(this.targetUrl + path, { turtleID: this.turtleID, lastTargetKey: this.lastTargetKey });
  }

  revDiffs(sourceMetaDocs) {
    const ids = sourceMetaDocs.map(doc => doc._id);
    return this.readMetaDocs(ids)
    .then(targetMetaDocs => {
      const missingRevs = this.findMissingRevs(sourceMetaDocs, targetMetaDocs);
      this.updateMetaDocs(missingRevs);
      return missingRevs;
    })
    .then(metaDocs => {
      this.revIds = metaDocs.map(doc => {
        return doc._id + "::" + doc.revisions[0];
      })
    })
    .catch(err => console.log(err));
  }

  updateMetaDocs(sourceMetaDocs) {
    let promises = [];
    sourceMetaDocs.forEach(doc => promises.push(this.idb.command(this.idb._meta, "UPDATE", { data: doc })))
    return Promise.all(promises);
  }

  readMetaDocs(ids) {
    let promises = [];
    ids.forEach(_id => promises.push(this.idb.command(this.idb._meta, "READ", { _id })))
    return Promise.all(promises).then(metadocs => metadocs.filter(doc => doc));
  }

  findMissingRevs(sourceMetaDocs, targetMetaDocs) {
    const latestTargetDocRev = {};
    targetMetaDocs.forEach(doc => {
      latestTargetDocRev[doc._id] = doc.revisions[0];
    })

    return sourceMetaDocs.filter(doc => {
      let targetRevId = latestTargetDocRev[doc._id];
      if (targetRevId) {
        if (targetRevId !== doc.revisions[0]) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    })
  }

  requestStoreDocs(path) {
    return axios.post(this.targetUrl + path, { revIds: this.revIds });
  }

  updateStoreAndReplicationHistory(obj) {
    const { docs, sourceSyncRecord } = obj;
    this.updateDB(docs)
    .then(() => this.updateSyncHistory(sourceSyncRecord));
  }

  updateDB(docs) {
    console.log('docs are', docs);
    let promises = [];
    docs.forEach(doc => promises.push(this.idb.command(this.idb._store, "CREATE", { data: doc })))
    return Promise.all(promises);
  }

  updateSyncHistory(sourceSyncRecord) {
    this.idb.command(this.idb._replicationHistoryFrom, "UPDATE", { data: sourceSyncRecord });
  }
}


export default ReplicatorFrom;


//replicate from tortoise

// Target - Turtle
// Source - Tortoise

//this.sourceHistoryDoc  - tortoise
//this.highestSourceKey  - tortoise
//this.getLastTargetKey  - turtle last sync
//this.metaDocs          - tortoise, requires highestSourceKey + lastTargetKey
//this.sourceSyncRecord

//turtleDB.replicateFrom()

    // turtle.getLastTargetKey
  // request 1 ('/_source_meta_docs') - turtle sends turtleID, lastTargetKey

    //tortoise.getSourceHistoryDoc
    //tortoise.getHighestStoreKey
    //tortoise.getChangedMetaDocsForTarget
  // response 1 - tortoise sends back metaDocs

    //turtle.revDiffs(metaDocs)
  // request 2 ('/_source_store_docs') - turtle sends array of _id_revs

    //tortoise.getChangedStoreDocsForTarget
    //tortoise.createNewSyncDocument
  // response 2 - tortoise sends back docs and new sync document

      //turtle.updateDB
      //turtle.updateSyncHistory
  // request 3 ('/_confirm_replication') - turtle sends confirmation

    //tortoise.updateSourceSyncHistory
  // response 3 - tortoise sends confirmation
