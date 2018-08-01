import React from 'react';

const Sync = props => {
  return (
    <div className="row">
      <div className="col">
        <button
          className="btn btn-primary"
          onClick={props.handleSyncClick}
        >
          Sync
        </button>
      </div>
    </div>
  )
}

export default Sync;
