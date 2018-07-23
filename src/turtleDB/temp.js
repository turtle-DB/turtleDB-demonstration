
//STEPS

//separate replicator file
//have a source(turtle) and target(tortoise)

//replicate method on turtleDB
  //turtle
  //send all latest revisions (all data) from turtle to tortoise

//target needs to receive docs
  //check for revisions it does not have locally
  //insert data
  //send confirmation response


//next steps:
  //source first sends over just revision IDs
    //target responds with list of what data it needs
    // source send over docs with data that were requested



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
