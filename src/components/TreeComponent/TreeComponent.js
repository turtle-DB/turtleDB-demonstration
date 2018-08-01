import React from 'react';
import TreeDisplay from './TreeDisplay';
import DocumentDisplay from './DocumentDisplay';

class TreeComponent extends React.Component {
  render() {
    return (
      <div>
        <h4>Revision Tree Visualizer</h4>
        <div className="row d-flex justify-content-between">
          <div className="col-8">
            <TreeDisplay
              selectedTreeMetaDoc={this.props.selectedTreeMetaDoc}
              handleTreeDocClick={this.props.handleTreeDocClick}
            />
          </div>
          <div className="col-4">
            <DocumentDisplay
              selectedTreeDoc={this.props.selectedTreeDoc}
              handlePickWinnerClick={this.props.handlePickWinnerClick}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default TreeComponent;
