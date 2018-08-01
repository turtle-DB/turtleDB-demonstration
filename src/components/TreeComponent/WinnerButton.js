import React from 'react';

class WinnerButton extends React.Component {
  render() {
    return (
      <button
        className="btn btn-primary"
        onClick={this.props.handlePickWinnerClick}
      >
        Select Winning Rev
      </button>
    );
  }
}

export default WinnerButton;
