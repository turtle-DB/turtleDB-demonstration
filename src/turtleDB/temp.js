
//STEPS

//update document
// update(id, { prop1: new, prop2: new2 })
  //getDoc(ID)
  //get revID from returned doc
  //increment revID (1-duf.. -> 2-adssa)
  //Object assign to create new object
  //revID on new object
  //insert object into store


// store:
// 1 - abc123::1-asdf, data
// 2 - abc123::2-gfhd, data
// 3 - abc123::3-asdf, data
// 4 - abc123::4-sfdg, data
//
// storeIndex
// abc123::1-asdf -> 1
// abc123::4-sfdg -> 4
//
// metaStore:
// 'abc123' - { latestRev: '4-sfdg...', storeKey: 4 }





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
