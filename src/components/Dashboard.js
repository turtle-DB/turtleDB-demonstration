import React from 'react';

// Components
import Table from './Table';
import ControlPanel from './ControlPanel/ControlPanel';
import turtleDB from '../turtleDB/turtle';

// Data
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

  handleInsertClick = n => {
    let insertPromises = [];
    for (let i = 0; i < n; i++) {
      insertPromises.push(turtleDB.create(this.state.hearthstone[i]));
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
            <ControlPanel
              handleInsertClick={this.handleInsertClick}
              handleDropDatabase={this.handleDropDatabase}
              handleSyncWithMongoDB={this.handleSyncWithMongoDB}
              data={this.state.hearthstone}
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
