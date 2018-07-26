
//replicate from tortoise

Target - Turtle
Source - Tortoise

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



















{
  "id":"idName",
  "rev":"2-13304d2274b32c3999ac7bf56b74225a",
  "deleted":true,
  "rev_tree":[
    {
      "pos":1,
      "ids":
        [
          "b4adf6a1fe69eec84304cb74353473a3",
          {"status":"available"},
          [





{
  "id":"idName",
  "rev":"2-13304d2274b32c3999ac7bf56b74225a",
  "deleted":true,
  "rev_tree":[
    {
      "pos":1,
      "ids":
        [
          "b4adf6a1fe69eec84304cb74353473a3",
          {"status":"available"},
          [
            [
              "13304d2274b32c3999ac7bf56b74225a",
              {"status":"available","deleted":true},
              []
            ]
          ]
        ]
    }
  ],
  "winningRev":"2-13304d2274b32c3999ac7bf56b74225a",
  "seq":2
}
            [
              "13304d2274b32c3999ac7bf56b74225a",
              {"status":"available","deleted":true},
              []
            ]
          ]
        ]
    }
  ],
  "winningRev":"2-13304d2274b32c3999ac7bf56b74225a",
  "seq":2
}

// SYNCING
//replicate documentation:
  //turtle post '/_rev_diffs'
    //turtle sends batch of metaDocs from change feed to tortoise
    //tortoise checks what revisions it doesn't have: tortoiseDB.revDiffs()
      //tortoise.revDiffs() gets local metadocs for the same IDs: mongoShell.readAllMetaDocs()
      //tortoise.revDiffs() gets back metadocs and then compares the revision IDs: tortoiseDB.findMissingRevs()
        //tDB.findMissingRevs() returns a filtered set of turtle's metadocs to tortoiseDB.revDiffs()
      //tortoise.revDiffs() passes these metadoc to tortoise.updateMetaDocs()
    //tortoise updates the metadocs that are not up to date
    //tortoise sends back a list of revIDs it needs data for from turtle
    //turtle sends back the data for those revIDs
