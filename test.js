const treeData = {
  name: 'Top Level',
  children: [
    {
      name: 'Level 2: A',
      circleProps: {
        className: 'leaf-rev'
      }
    },
    {
      name: 'Level 2: B',
      circleProps: {
        className: 'winning-rev'
      }
    },
  ],
};

const revTree = [
  "1-96879ba3b35f489cf9c36882b152b656",
  {},
  [
    [
      "2-76623f34d26f742c5027cf844469be89",
      {},
      [
        [
          "3-a7c56cd1a7c396fede8997188139bd39",
          {},
          []
        ]
      ]
    ],
    [
      "2-ffb288504c2d19334b3c0b36a69ddf0b",
      {},
      [
        [
          "3-c55cca3939180836992ac975c84bee19",
          {},
          [
            [
              "4-50df1df24248bd20a2de134f1da650c4",
              {
                "_deleted": true
              },
              []
            ]
          ]
        ]
      ]
    ]
  ]
];

function formatRevTree(revTree, winningRev = null) {
  const newTree = {};
  traverseRevTree(revTree, newTree, winningRev);
  return newTree;
}

function traverseRevTree(node, newNode, winningRev) {
  // Set up new node
  newNode.name = node[0].slice(0, 5) + '...';
  newNode.circleProps = { className: '' };
  newNode.children = [];

  const nodeChildren = node[2];

  if (nodeChildren.length === 0) {
    newNode.circleProps.className = 'leaf-rev';
  }

  if (node[0] === winningRev) {
    newNode.circleProps.className = 'winning-rev';
  }

  if (node[1]._deleted) {
    newNode.circleProps.className = 'deleted-rev';
  }

  for (let i = 0; i < nodeChildren.length; i++) {
    let childNode = traverseRevTree(nodeChildren[i], {}, winningRev);
    newNode.children.push(childNode);
  }

  return newNode;
}


function _insertNewRev(node, newRev, oldRev, _deleted) {
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



console.log(JSON.stringify(formatRevTree(revTree, "3-a7c56cd1a7c396fede8997188139bd39"), undefined, 2));