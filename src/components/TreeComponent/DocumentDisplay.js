import React from 'react';
import JSONPretty from 'react-json-pretty';
import './../../styles/json.css';

class DocumentDisplay extends React.Component {
  render() {
    const doc = {
      "name": "Alice Blevins",
      "age": 40,
      "gender": "female",
      "company": "NEWCUBE",
      "email": "aliceblevins@newcube.com",
      "phone": "+1 (947) 405-2912",
      _id: "a8fcdeaa-d8ef-4503-9762-d8499bbc571c",
      _rev: "1-712f142c26a9e7bc0c2c0439b7dc1131"
    };

    return (
      <div>
        <h6>Document</h6>
        <div className="json-container">
          <JSONPretty id="json-pretty" json={this.props.selectedTreeDoc}></JSONPretty>
        </div>
      </div>
    );
  }
}

export default DocumentDisplay;