import React from 'react';

const Sync = props => {
  return (
    <div className="row">
      <div className="col">
        <button
          className="btn btn-primary"
          onClick={props.handleSync}
        >
          Sync
        </button>
      </div>
    </div>
  )
}

export default Sync;
