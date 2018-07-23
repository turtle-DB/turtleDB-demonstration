import React from 'react';

const SyncWithMongoButton = props => {
  return (
      <button
        className="btn btn-primary"
        onClick={props.handleSyncWithMongoDB}
      >
        Sync with MongoDB
      </button>
  )
}

export default SyncWithMongoButton
