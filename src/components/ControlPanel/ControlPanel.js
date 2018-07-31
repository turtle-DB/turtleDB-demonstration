import React from 'react';
import DropButton from './DropButton';
import InsertDocsPanel from './InsertDocsPanel';
import EditDocsPanel from './EditDocsPanel';
import DeleteDocsPanel from './DeleteDocsPanel';
import SyncWithMongoButton from './SyncWithMongoButton';

class ControlPanel extends React.Component {
  render() {
    return (
      <div>
        <h4>turtleDB Functions</h4>
        <InsertDocsPanel handleInsertClick={this.props.handleInsertClick} />
        <DeleteDocsPanel handleDeleteClick={this.props.handleDeleteClick} />
        <EditDocsPanel handleEditClick={this.props.handleEditClick} />
        <DropButton handleDropDatabase={this.props.handleDropDatabase} />
        <SyncWithMongoButton handleSyncWithMongoDB={this.props.handleSyncWithMongoDB} />
      </div>
    )
  }
}

export default ControlPanel;
