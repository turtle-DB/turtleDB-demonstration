import uuidv4 from 'uuid/v4';
import axios from 'axios';

class ReplicatorFrom {

  constructor(targetUrl) {
    this.targetUrl = targetUrl;
    this.sessionID = this.generateSessionID();
  }

  replicate() {
    this.getLastTargetKey()
    .then(() => console.log('last key', this.lastKey));
  }

  generateSessionID() {
    return new Date().toISOString();
  }

  getLastTargetKey() {
    return this.idb.command(this.idb._replicationHistoryFrom, "READ_ALL", {})
    .then(docs => {
      const localReplicationFromRecord = docs[0];
      this.lastKey = localReplicationFromRecord.history.length === 0 ?
        0 : localReplicationFromRecord.history[0].lastKey;
    })
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
