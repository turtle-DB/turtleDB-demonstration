import React from 'react';
import axios from 'axios';

// Components
import TableComponent from './TableComponent/TableComponent';
import ControlPanel from './ControlPanel/ControlPanel';
import BenchmarkBox from './BenchmarkBox/BenchmarkBox';
import TreeDisplay from './TreeDisplay';

import turtleDB from '../turtleDB/turtle';

// import data
import peopleData from './../data/PeopleData';

class Dashboard extends React.Component {
  constructor() {
    super()
    this.state = {
      data: [],
      benchmark: {
        time: null,
        type: null,
        count: null,
      },
      metaDoc: null
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

  handleSingleDeleteClick = _id => {
    turtleDB.delete(_id).then(() => {
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

  handleEditClick = n => {
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

  handleUpdateClick = obj => {
    turtleDB.update(obj._id, obj).then(() => {
      this.syncStateWithTurtleDB();
    })
  }

  handleDropDatabase = () => {
    turtleDB.dropDB().then(() => this.setState({ data: [] }));
  }

  handleSyncWithMongoDB = () => {
    // axios.post("mongodb://localhost:27017/Hearthstone", this.state.hearthstone)
    //   .then(res => console.log(res))
    //   .catch(err => console.log("Error:", err))
  }

  handleViewTreeClick = (_id) => {
    turtleDB._readMetaDoc(_id).then(metaDoc => {
      this.setState({ metaDoc: metaDoc });
    });
  }

  render() {
    return (
      <div>
        <div className="row">
          <div className="col-2">
            <ControlPanel
              handleInsertClick={this.handleInsertClick}
              handleEditClick={this.handleEditClick}
              handleDeleteClick={this.handleDeleteClick}
              handleDropDatabase={this.handleDropDatabase}
              handleSyncWithMongoDB={this.handleSyncWithMongoDB}
            />
          </div>
          <div className="col-10">
            <div className="d-flex">
              <BenchmarkBox benchmark={this.state.benchmark} />
              <TreeDisplay metaDoc={this.state.metaDoc} />
            </div>
            <TableComponent
              data={this.state.data}
              handleSingleDeleteClick={this.handleSingleDeleteClick}
              handleUpdateClick={this.handleUpdateClick}
              handleViewTreeClick={this.handleViewTreeClick}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default Dashboard;
