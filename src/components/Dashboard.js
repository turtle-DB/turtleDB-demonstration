import React from 'react';
import axios from 'axios';

// Components
import TableComponent from './TableComponent/TableComponent';
import ControlPanel from './ControlPanel/ControlPanel';
import BenchmarkBox from './BenchmarkBox/BenchmarkBox';
import TreeComponent from './TreeComponent/TreeComponent';

import turtleDB from '../turtleDB/turtle';

// import data
import peopleData from './../data/PeopleData';

class Dashboard extends React.Component {
  constructor() {
    super()
    this.state = {
      data: {
        docs: [],
        metaDocs: []
      },
      benchmark: {
        time: null,
        type: null,
        count: null,
      },
      selectedTreeMetaDoc: null,
      selectedTreeDoc: null
    }
  }

  componentDidMount() {
    this.syncStateWithTurtleDB();
  }

  syncStateWithTurtleDB = () => {
    turtleDB.readAllMetaDocsAndDocs()
      .then(data => this.setState({ data: data }));
  }

  // DASHBOARD HANDLERS

  handleInsertClick = (n) => {
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

  handleDeleteClick = (n) => {
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

  handleUpdateClick = (n) => {
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

  handleDropDatabase = () => {
    turtleDB.dropDB().then(() => this.setState({ data: { docs: [], metaDocs: [] } }));
  }

  handleSync = () => {
    // axios.post("mongodb://localhost:27017/Hearthstone", this.state.hearthstone)
    //   .then(res => console.log(res))
    //   .catch(err => console.log("Error:", err))
  }

  // DOCUMENT HANDLERS

  handleViewTreeClick = (metaDoc) => {
    // turtleDB._readMetaDoc(_id).then(metaDoc => {
    //   this.setState({ metaDoc: metaDoc });
    // });

    this.setState({ selectedTreeMetaDoc: metaDoc });
  }

  handleSingleUpdateClick = (obj) => {
    turtleDB.update(obj._id, obj).then(() => {
      this.syncStateWithTurtleDB();
    })
  }

  handleSingleDeleteClick = (_id) => {
    turtleDB.delete(_id).then(() => {
      this.syncStateWithTurtleDB();
    });
  }

  // TREE HANDLERS

  handleTreeDocClick = (_id, rev) => {
    turtleDB.read(_id, rev)
      .then(doc => {
        this.setState({ selectedTreeDoc: doc })
      });
  }

  render() {
    return (
      <div>
        <div className="row">
          <div className="col-2">
            <ControlPanel
              handleInsertClick={this.handleInsertClick}
              handleUpdateClick={this.handleUpdateClick}
              handleDeleteClick={this.handleDeleteClick}
              handleDropDatabase={this.handleDropDatabase}
              handleSync={this.handleSync}
            />
          </div>
          <div className="col-10">
            <div className="row">
              <div className="col-3">
                <BenchmarkBox benchmark={this.state.benchmark} />
              </div>
              <div className="col-9">
                <TreeComponent
                  selectedTreeMetaDoc={this.state.selectedTreeMetaDoc}
                  selectedTreeDoc={this.state.selectedTreeDoc}
                  handleTreeDocClick={this.handleTreeDocClick}
                />
              </div>
            </div>

            <div className="row">
              <TableComponent
                data={this.state.data}
                handleSingleDeleteClick={this.handleSingleDeleteClick}
                handleSingleUpdateClick={this.handleSingleUpdateClick}
                handleViewTreeClick={this.handleViewTreeClick}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Dashboard;
