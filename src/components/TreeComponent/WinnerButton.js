import React from 'react';

class WinnerButton extends React.Component {
  render() {
    return (
      <div className="d-flex justify-content-center">
        <button
          className="btn btn-primary"
          onClick={this.props.handlePickWinnerClick}
        >
          Pick Document Version As Winner
        </button>
      </div>
    );
  }
}

export default WinnerButton;