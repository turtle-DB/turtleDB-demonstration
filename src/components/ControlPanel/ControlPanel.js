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
        <h4>turtleDB Functionalities</h4>
        <div className="container">
          <div className="row">
            <div className="col">
              <InsertDocsPanel
                handleInsertClick={this.props.handleInsertClick}
              />
            </div>
            <div className="col">
              <DeleteDocsPanel
                handleDeleteClick={this.props.handleDeleteClick}
              />
            </div>
            <div className="col">
              <EditDocsPanel
                handleEditClick={this.props.handleEditClick}
              />
            </div>
            <div className="col">
              <div className="btn-group-vertical">
                <DropButton
                  handleDropDatabase={this.props.handleDropDatabase}
                />
                <SyncWithMongoButton
                  handleSyncWithMongoDB={this.props.handleSyncWithMongoDB}
                />
              </div>
            </div>
          </div>
        </div>



      </div>
    )
  }
}

export default ControlPanel;
