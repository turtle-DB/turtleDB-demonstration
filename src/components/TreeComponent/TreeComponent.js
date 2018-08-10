import React from 'react';
import TreeDisplay from './TreeDisplay';
import DocumentDisplay from './DocumentDisplay';

class TreeComponent extends React.Component {
  render() {
    return (
      <div>
        <h4>Revision Tree Visualizer</h4>
        <div className="d-flex">
          <TreeDisplay
            selectedTreeMetaDoc={this.props.selectedTreeMetaDoc}
            handleTreeDocClick={this.props.handleTreeDocClick}
          />
          <DocumentDisplay
            selectedTreeDoc={this.props.selectedTreeDoc}
            handlePickWinnerClick={this.props.handlePickWinnerClick}
          />
        </div>
      </div>
    );
  }
}

export default TreeComponent;
