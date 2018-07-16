import React from 'react';

const SyncWithMongoButton = props => {
  return (
    <div className="col-2">
      <button
        className="btn btn-primary"
        onClick={props.handleSyncWithMongoDB}
      >
        Sync with MongoDB
      </button>
    </div>

  )
}

export default SyncWithMongoButton
