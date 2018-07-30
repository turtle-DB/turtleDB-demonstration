import React from 'react';
import axios from 'axios';

// Components
import Table from './Table/Table';
import ControlPanel from './ControlPanel/ControlPanel';
import TestPanel from './TestPanel/TestPanel';
import BenchmarkBox from './BenchmarkBox/BenchmarkBox';
import turtleDB from '../turtleDB/turtle';

// import peopleData from './../data/peopleData';
// import peopleData from './../data/HearthstoneBasicData';
import peopleData from './../data/PeopleData';

// Dashboard
class Dashboard extends React.Component {
  constructor() {
    super()
    this.state = {
      data: [],
      benchmark: {
        time: null,
        type: null,
        count: null,
      }
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
    let startTime = Date.now();
    turtleDB.idb.deleteBetweenNumbers(0, n).then(() => {
      let timeSpent = Date.now() - startTime;
      this.setState({
        benchmark: {
          time: timeSpent,
          type: "DELETE",
          count: n
        }
      });
      this.syncStateWithTurtleDB();
    });
  }

  handleInsertClick = n => { // need to change so it inserts N random cards instead
    let insertPromises = [];
    let dataLength = peopleData.length;
    for (let i = 0; i < n; i++) {
      const doc = Object.assign({}, peopleData[Math.floor(Math.random() * dataLength)]);
      insertPromises.push(turtleDB.create(doc));
    }
    let startTime = Date.now();
    Promise.all(insertPromises).then(() => {
      let timeSpent = Date.now() - startTime;
      this.setState({
        benchmark: {
          time: timeSpent,
          type: "INSERT",
          count: n
        }
      });
      this.syncStateWithTurtleDB();
    });
  }

  ////////Example of generic wrapper for profiling
  // profileAsyncFunction = (func, funcName) => {
  //   let self = this;
  //   return function () {
  //     let startTime = Date.now();
  //     let returnVal = func.apply(turtleDB.idb, arguments).then(() => {
  //       let timeSpent = Date.now() - startTime;
  //       console.log(`${funcName} took ${timeSpent} ms to execute`);
  //       return returnVal;
  //     });
  //   };
  // }

  handleEditClick = n => {
    // let profiledEditCall = this.profileAsyncFunction(turtleDB.idb.editFirstNDocuments, 'editFirstNDocuments');
    // profiledEditCall.call(n);
    let startTime = Date.now();
    turtleDB.idb.editFirstNDocuments(n).then(() => {
      let timeSpent = Date.now() - startTime;
      this.setState({
        benchmark: {
          time: timeSpent,
          type: "EDIT",
          count: n
        }
      });
      this.syncStateWithTurtleDB();
    });
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
        <div className="">
          <div className="row">
            <div className="col">
              <ControlPanel
                handleInsertClick={this.handleInsertClick}
                handleEditClick={this.handleEditClick}
                handleDropDatabase={this.handleDropDatabase}
                handleSyncWithMongoDB={this.handleSyncWithMongoDB}
                handleDeleteClick={this.handleDeleteClick}
                handleTestClick={this.handleTestClick}
              />
            </div>
            <div className="col">
              <BenchmarkBox benchmark={this.state.benchmark} />
            </div>
          </div>
          <div className="row">
            <TestPanel
              handleTestClick={this.handleTestClick}
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
