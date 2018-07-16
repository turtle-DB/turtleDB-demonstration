import React from 'react';
import DropButton from './DropButton';
import InsertDocsPanel from './InsertDocsPanel';
// import PropertyFilter from './PropertyFilter';
import SyncWithMongoButton from './SyncWithMongoButton';


class ControlPanel extends React.Component {
  render() {
    return (
      <div>
        <InsertDocsPanel
          handleInsertClick={this.props.handleInsertClick}
          data={this.props.data}
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

export default ControlPanel
{/* <PropertyFilter
  data={this.props.data}
/> */}
