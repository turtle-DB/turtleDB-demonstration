import React from 'react';

class SyncButton extends React.Component {
  render() {
    return (
      <div className="row">
        <div className="col">
          <button
            className="btn btn-primary"
            onClick={this.props.handleSyncClick}
            disabled={this.props.autoSync}
          >
            Sync
          </button>
          <div className="form-group form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="auto-sync-checkbox"
              checked={this.props.autoSync}
              onChange={this.props.handleAutoSyncClick}
            ></input>
            <label
              className="form-check-label"
              htmlFor="auto-sync-checkbox"
            >Auto-Sync</label>
          </div>
        </div>
      </div>
    );
  }
}

export default SyncButton;
