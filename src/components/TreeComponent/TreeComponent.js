import React from 'react';
import TreeDisplay from './TreeDisplay';
import DocumentDisplay from './DocumentDisplay';

class TreeComponent extends React.Component {
  render() {
    return (
      <div>
        <h4 className="text-center">Revision Tree</h4>
        <div className="d-flex justify-content-between">
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