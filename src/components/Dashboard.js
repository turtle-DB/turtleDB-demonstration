import React from 'react';
import axios from 'axios';

// Components
import Table from './Table';
import ControlPanel from './ControlPanel/ControlPanel';
import turtleDB from '../turtleDB/turtle';

// Data
// import hearthstoneData from './../data/HearthstoneData';
import hearthstoneData from './../data/HearthstoneBasicData';

// Dashboard
class Dashboard extends React.Component {
  constructor() {
    super()
    this.state = {
      data: [],
    }
  }

  componentDidMount() {
    this.syncStateWithTurtleDB();
  }

  syncStateWithTurtleDB = () => {
    turtleDB.readAllValues().then(docs =>
      this.setState({ data: docs })
    );
  }

  handleSingleDeleteClick = (key) => {
    turtleDB.delete(key).then(() => {
      this.syncStateWithTurtleDB();
    });
  }

  handleDeleteClick = n => {
    turtleDB.idb.deleteBetweenNumbers(0, n).then(() => {
      this.syncStateWithTurtleDB();
    })
  }

  handleInsertClick = n => { // need to change so it inserts N random cards instead
    let insertPromises = [];
    let dataLength = hearthstoneData.length;
    for (let i = 0; i < n; i++) {
      const doc = Object.assign({}, hearthstoneData[Math.floor(Math.random() * dataLength)]);
      insertPromises.push(turtleDB.create(doc));
    }
    Promise.all(insertPromises).then(() => this.syncStateWithTurtleDB());
  }

  handleUpdateClick = (newObj) => {
    turtleDB.update(newObj.id, newObj).then(() => {
      this.syncStateWithTurtleDB();
    })
  }

  handleDropDatabase = () => {
    turtleDB.dropDB().then(() => this.setState({ data: [] }));
  }

  handleSyncWithMongoDB = () => {
    axios.post("mongodb://localhost:27017/Hearthstone", this.state.hearthstone)
      .then(res => console.log(res))
      .catch(err => console.log("Error:", err))
  }

  render() {
    return (
      <div>
        <div className="shadow p-3 mb-5 bg-light rounded container">
          <div className="row">
            <ControlPanel
              handleInsertClick={this.handleInsertClick}
              handleDropDatabase={this.handleDropDatabase}
              handleSyncWithMongoDB={this.handleSyncWithMongoDB}
              handleDeleteClick={this.handleDeleteClick}
            />
          </div>
        </div>
        <Table
          data={this.state.data}
          handleSingleDeleteClick={this.handleSingleDeleteClick}
          handleUpdateClick={this.handleUpdateClick}
        />
      </div>
    )
  }
}

export default Dashboard;
