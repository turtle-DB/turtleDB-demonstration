import React from 'react';
import 'react-tree-graph/dist/style.css'
import './../styles/tree.css';
import Tree from 'react-tree-graph';

class TreeDisplay extends React.Component {
  // recieve the whole metadoc as a prop - need access to winning rev and rev tree
  generateTree = () => {
    const newTree = {};
    const revTree = this.props.metaDoc._revisions;
    const winningRev = this.props.metaDoc._winningRev;

    if (!this.props.metaDoc) { return newTree; }
    this.traverseRevTree(revTree, newTree, winningRev);
    return newTree;
  }

  traverseRevTree = (node, newNode, winningRev) => {
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

  render() {
    const treeData = this.generateTree();

    return (
      <div className="row">
        <div className="col-3">
        </div>
        <div className="col-9 tree-container">
          <Tree
            data={treeData}
            height={300}
            width={400}
            svgProps={{ className: 'custom' }}
            nodeOffset={-10}
            nodeRadius={10}
            margins={{ bottom: 0, left: 0, right: 100, top: 20 }}
          />
        </div>
      </div>
    );
  }
}

export default TreeDisplay;