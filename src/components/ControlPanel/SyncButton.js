import React from 'react';

const Sync = props => {
  return (
    <div className="row">
      <div className="col">
        <button
          className="btn btn-primary"
          onClick={props.handleSyncWithMongoDB}
        >
          Sync with MongoDB
        </button>
      </div>
    </div>
  )
}

export default Sync;
