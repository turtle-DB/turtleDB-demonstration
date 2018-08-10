import React from 'react';

class CompactButton extends React.Component {
  render() {
    return (
      <div className="row">
        <div className="col">
          <button
            className="btn btn-secondary"
            onClick={this.props.handleCompactClick}
          >
            Compact
          </button>
        </div>
      </div>
    );
  }
}

export default CompactButton;