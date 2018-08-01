import React from 'react';
import DropButton from './DropButton';
import InsertDocsPanel from './InsertDocsPanel';
import UpdateDocsPanel from './UpdateDocsPanel';
import DeleteDocsPanel from './DeleteDocsPanel';
import SyncButton from './SyncButton';

class ControlPanel extends React.Component {
  render() {
    return (
      <div>
        <h4>turtleDB Functions</h4>
        <InsertDocsPanel handleInsertClick={this.props.handleInsertClick} />
        <DeleteDocsPanel handleDeleteClick={this.props.handleDeleteClick} />
        <UpdateDocsPanel handleUpdateClick={this.props.handleUpdateClick} />
        <DropButton handleDropDatabase={this.props.handleDropDatabase} />
        <SyncButton handleSyncClick={this.props.handleSyncClick} />
      </div>
    )
  }
}

export default ControlPanel;
