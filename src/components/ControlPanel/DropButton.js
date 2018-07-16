import React from 'react';

const DropButton = props => {
  return (
    <div className="col-2">
      <button
        className="btn btn-danger"
        onClick={props.handleDropDatabase}
      >
        Drop Database
      </button>
    </div>

  )
}

export default DropButton
