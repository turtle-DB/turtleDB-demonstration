import React from 'react';

const SyncWithMongoButton = props => {
  return (
    <div className="row">
      <div className="col">
        <button
          className="btn btn-primary"
          onClick={props.handleSyncWithMongoDB}
        >
          Sync with Mongo
        </button>
      </div>
    </div>
  )
}

export default SyncWithMongoButton
