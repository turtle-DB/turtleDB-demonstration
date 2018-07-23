import React from 'react';

const DropButton = props => {
  return (
    <button
      className="btn btn-danger"
      onClick={props.handleDropDatabase}
    >
      Drop Database
    </button>
  )
}

export default DropButton
