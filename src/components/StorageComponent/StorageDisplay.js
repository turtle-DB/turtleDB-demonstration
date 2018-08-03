import React from 'react';

class StorageDisplay extends React.Component {
  render() {
    return (
      <div className="mt-3">
        <h4 className="text-center mb-3">IDB Storage Info</h4>
        <p>App usage: <span className="font-weight-bold">{this.props.storageInfo.appUsage}</span></p>
        <p>App quota: <span className="font-weight-bold">{this.props.storageInfo.appQuota}</span></p>
        <p>Total quota: <span className="font-weight-bold">{this.props.storageInfo.totalQuota}</span></p>
      </div>
    );
  }
}

export default StorageDisplay;