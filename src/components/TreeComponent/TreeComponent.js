import React from 'react';
import TreeDisplay from './TreeDisplay';
import DocumentDisplay from './DocumentDisplay';

class TreeComponent extends React.Component {
  render() {
    return (
      <div>
        <h4>Revision Tree</h4>
        <div className="d-flex justify-content-between">
          <TreeDisplay
            metaDoc={this.props.selectedTreeMetaDoc}
            handleTreeDocClick={this.props.handleTreeDocClick}
          />
          <DocumentDisplay
            selectedTreeDoc={this.props.selectedTreeDoc}
          />
        </div>
      </div>
    );
  }
}

export default TreeComponent;