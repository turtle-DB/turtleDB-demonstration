//syncFromRoutes '/missing_rev_ids' endpoint
  //mergeMetaDocs(turtleMetaDocs)
  //.then(metaDocs => insertMetaDocs()
  //.then(metadocs => findMissingLeafNodes(metadocs))
  //.then(revIds => send(revIds))

// --> input: array of changed turtle metadocs

//mergeMetaDocs(turtleMetaDocs)
  //matchExistingMetaDocs(turtleMetaDocs)
    //get all turtle ids -> map(id => id)
    //getTortoiseMetaDocsById(ids) --> [this.matchingTortoiseMetaDocs]
    //const newTurtleMetaDocs = sortNewTurtleMetaDocs(this.matchingTortoiseMetaDocs, turtleMetaDocs)
      // --> [this.matchingTurtleMetaDocs]


      // this.missingLeafNodes = [];
      // turtleMetaDocs.forEach(turtleMetaDoc => {
          //turtleMetaDoc.id
          // if (id exists in mongoShell) {
            // newMetaDoc = mergeRevTrees(tortoiseMetaDoc1, turtleMetaDoc1)
            // update newMetaDoc to tortoise
          // } else {
            // add turtle's turtleMetaDoc into tortoise
          // }
          // this.missingLeafNodes.push(leafNode)

        // this.missingLeafNodes/missingRevIds = [id-3a, id2-1a, ]
        // findMissingLeafNodes(newMergedMetaDoc)
           // rev tree, recurse through it to find leaf nodes, check not deleted
           // leafNodes = [id-2d, id-6e];
           // go to tortoise store, check for already exisiting revids
           // this.missingLeafNodes.push()
          //  -> filter for non-existing leaf nodes

           // 1a - 2b
           //    - 2c
          //     - 2d - 3d


    // })


    //const updatedTortoiseMetaDocs = mergeExistingMetaDocs()
      //forEach...
      //mergeRevTrees(tortoiseMetaDoc1, turtleMetaDoc1)
        // altering tortoiseMetaDoc
          // update rev tree
          // update conflict status
          // if conflict: true, findWinningRev(revisionTree)
    //<-- {updated: updatedTortoiseMetaDocs + new: newTurtleMetaDocs}
    // mongoShell.read(id) // if comes back

//insertMetaDocs()
  //updateMetaDocs(updatedTortoiseMetaDocs)
  //insertNewMetaDocs(newTurtleMetaDocs)

//findMissingLeafNodes
    //const allUpdatedLeafNodes = findLeafNodes(updatedMetaDocs)
    //searchDBLeafNodes(allUpdatedLeafNodes) --> [missingLeafNodes]
    //findLeafNodes(newTurtleMetaDocs) --> concat onto [missingLeafNodes]
//<-- return: array of missing revIds
