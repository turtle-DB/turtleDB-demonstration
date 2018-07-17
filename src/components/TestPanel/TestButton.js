import React from 'react';

const TestButton = props => {
  return (
    <div className="col-2">
      <button
        className="btn btn-danger"
        onClick={props.handleTestClick}
      >
        Run Tests
      </button>
    </div>

  )
}

export default TestButton;
