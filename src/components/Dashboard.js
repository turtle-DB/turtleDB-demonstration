import React from 'react';

// Components
import Table from './Table';
import InsertDocs from './InsertDocs';
import DropButton from './DropButton';
import PropertyFilter from './PropertyFilter';
import turtleDB from '../turtleDB/turtle';
import SyncWithMongoDB from './SyncWithMongoDB';
// import InsertSeedData from './InsertSeedData';

// Data
//import { getNumDocs } from './../data/newData';
import hearthstoneData from './../data/HearthstoneData';

// Dashboard
class Dashboard extends React.Component {
  constructor() {
    super()
    this.state = {
      data: [],
      hearthstone: hearthstoneData,
    }
  }

  componentDidMount() {
    this.syncStateWithTurtleDB();
    console.log(this.state.hearthstone);
  }

  syncStateWithTurtleDB = () => {
    turtleDB.readAllValues().then(docs =>
      this.setState({ data: docs })
    );
  }

  handleDeleteClick = (key) => {
    turtleDB.delete(key).then(() => {
      this.syncStateWithTurtleDB();
    });
  }
  //
  // handleInsertClick = setName => {
  //   const setName = setName;
  //   console.log(this.state.hearthstone[setName]);
  //   this.syncStateWithTurtleDB();
  // }

  handleUpdateClick = (newObj) => {
    turtleDB.update(newObj.id, newObj).then(() => {
      this.syncStateWithTurtleDB();
    })
  }

  handleDropDatabase = () => {
    turtleDB.dropDB().then(() => this.setState({ data: [] }));
  }

  handleSyncWithMongoDB = () => {
    // axios.get("https://api.github.com/users/rockdinosaur")
    //   .then(res => {
    //     console.log(res);
    //   })
    axios.post("mongodb://localhost:27017/Hearthstone", this.state.hearthstone)
      .then(res => console.log(res))
      .catch(err => console.log("Error:", err))
  }

  render() {
    return (
      <div>
        <div className="shadow p-3 mb-5 bg-light rounded container">
          <div className="row">
            <InsertDocs
              handleInsertClick={this.handleInsertClick}
              data={this.state.hearthstone}
            />
            <PropertyFilter
              data={this.state.data}
            />
            <DropButton
              handleDropDatabase={this.handleDropDatabase}
            />
            <SyncWithMongoDB
              handleSyncWithMongoDB={this.handleSyncWithMongoDB}
            />
          </div>
        </div>
        <Table
          data={this.state.data}
          handleDeleteClick={this.handleDeleteClick}
          handleUpdateClick={this.handleUpdateClick}
        />
      </div>
    )
  }
}


export default Dashboard;
