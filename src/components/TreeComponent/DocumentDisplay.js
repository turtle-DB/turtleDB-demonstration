import React from 'react';
import JSONPretty from 'react-json-pretty';
import './../../styles/json.css';
import WinnerButton from './WinnerButton';

class DocumentDisplay extends React.Component {
  render() {
    return (
      <div>
        <h6>Revision:</h6>
        <div className="json-container">
          <JSONPretty
            id="json-pretty"
            json={this.props.selectedTreeDoc}
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