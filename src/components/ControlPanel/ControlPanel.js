import React from 'react';
import DropButton from './DropButton';
import InsertDocsPanel from './InsertDocsPanel';
import EditDocsPanel from './EditDocsPanel';
import DeleteDocsPanel from './DeleteDocsPanel';
// import PropertyFilter from './PropertyFilter';
import SyncWithMongoButton from './SyncWithMongoButton';


class ControlPanel extends React.Component {
  render() {
    return (
      <div>
        <h4>Control Panel</h4>
        <InsertDocsPanel
          handleInsertClick={this.props.handleInsertClick}
        />
        <EditDocsPanel
          handleEditClick={this.props.handleEditClick}
        />
        <DeleteDocsPanel
          handleDeleteClick={this.props.handleDeleteClick}
        />
        <DropButton
          handleDropDatabase={this.props.handleDropDatabase}
        />
        <SyncWithMongoButton
          handleSyncWithMongoDB={this.props.handleSyncWithMongoDB}
        />
      </div>
    )
  }
}

export default ControlPanel;
