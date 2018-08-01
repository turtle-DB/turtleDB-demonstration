import React from 'react';
import JSONPretty from 'react-json-pretty';
import './../../styles/json.css';
import WinnerButton from './WinnerButton';

class DocumentDisplay extends React.Component {
  render() {
    const doc = this.props.selectedTreeDoc ? this.props.selectedTreeDoc : {};

    return (
      <div>
        <h6 className="text-center">Document Revision:</h6>
        <div className="json-container">
          <JSONPretty
            id="json-pretty"
            json={doc}
          ></JSONPretty>
          <WinnerButton
            handlePickWinnerClick={this.props.handlePickWinnerClick}
          />
        </div>
      </div>
    );
  }
}

export default DocumentDisplay;