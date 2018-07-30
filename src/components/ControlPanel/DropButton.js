import React from 'react';

const DropButton = props => {
  return (
    <div className="row">
      <div className="col">
        <button
          className="btn btn-danger"
          onClick={props.handleDropDatabase}
        >
          Drop Database
        </button>
      </div>
    </div>
  )
}

export default DropButton
