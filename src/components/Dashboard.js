import React from 'react';
import axios from 'axios';

// Components
import TableComponent from './TableComponent/TableComponent';
import ControlPanel from './ControlPanel/ControlPanel';
import BenchmarkBox from './BenchmarkBox/BenchmarkBox';
import TreeComponent from './TreeComponent/TreeComponent';
import StorageDisplay from './StorageComponent/StorageDisplay';

import TurtleDB from '../turtleDB/turtle';

// import data
import peopleData from './../data/PeopleData';

const dbName = "demo";
const turtleDB = new TurtleDB(dbName);
turtleDB.setRemote('http://138.68.229.63:3000');
window.turtleDB = turtleDB;

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
      selectedTreeDoc: null,
      autoSync: false,
      storage: {
        appUsage: "0 B",
        appQuota: "0 B",
        totalQuota: "0 B"
      }
    }
  }

  componentDidMount() {
    this.syncStateWithTurtleDB();
  }

  setDefaultState = () => {
    this.setState({
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
      selectedTreeDoc: null,
      autoSync: false,
      storage: {
        appUsage: "0 B",
        appQuota: "0 B",
        totalQuota: "0 B"
      }
    });
  }

  syncStateWithTurtleDB = () => {
    turtleDB.readAllMetaDocsAndDocs()
      .then(data => this.setState({ data: data }))
      .then(() => this.updateTreeDocs())
      .then(() => this.updateStorageInfo());
  }

  updateTreeDocs = () => {
    if (this.state.selectedTreeMetaDoc) {
      const updatedMetaDoc = this.state.data.metaDocs.find(metaDoc => metaDoc._id === this.state.selectedTreeMetaDoc._id);

      if (updatedMetaDoc) {
        this.setState({ selectedTreeMetaDoc: updatedMetaDoc });
      } else {
        this.setState({ selectedTreeMetaDoc: null });
      }
    }

    this.setState({ selectedTreeDoc: null });
  }

  updateStorageInfo = () => {
    turtleDB.getStorageInfo()
      .then(info => this.setState({ storage: info }));
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

  handleDeleteClick = n => {
    let startTime = Date.now();
    turtleDB.idb.deleteBetweenNumbers(0, n)
      .then(() => {
        let timeSpent = Date.now() - startTime;
        this.setState({
          benchmark: {
            time: timeSpent,
            type: "DELETE",
            count: n
          }
        })
      })
      .then(() => this.syncStateWithTurtleDB())
  }

  handleUpdateClick = (n) => {
    let startTime = Date.now();
    turtleDB.editFirstNDocuments(n)
      .then(() => {
        let timeSpent = Date.now() - startTime;
        this.setState({
          benchmark: {
            time: timeSpent,
            type: "EDIT",
            count: n
          }
        });
      })
      .then(() => this.syncStateWithTurtleDB())
  }

  handleDropDatabase = () => {
    turtleDB.dropDB(dbName)
      .then(() => this.setDefaultState());
  }

  handleSyncClick = () => {
    turtleDB.sync()
      .then(() => this.syncStateWithTurtleDB())
      .catch((err) => console.log('Sync click -', err));
  }

  handleAutoSyncClick = () => {
    if (this.state.autoSync) {
      // if auto-sync on
      turtleDB.autoSyncOff();
      clearInterval(this.intervalId);
    } else {
      turtleDB.autoSyncOn();
      this.intervalId = setInterval(this.syncStateWithTurtleDB.bind(this), 3000);
    }

    this.setState((prevState) => ({ autoSync: !prevState.autoSync }));
  }

  handleCompactClick = () => {
    turtleDB.compactStore()
      .then(() => this.syncStateWithTurtleDB());
  }

  // DOCUMENT HANDLERS

  handleViewTreeClick = (metaDoc) => {
    this.setState({ selectedTreeMetaDoc: metaDoc });
    this.setState({ selectedTreeDoc: null });
  }

  handleSingleUpdateClick = (obj) => {
    turtleDB.update(obj._id, obj)
      .then(() => this.syncStateWithTurtleDB())
  }

  handleSingleDeleteClick = (_id) => {
    turtleDB.delete(_id)
      .then(() => this.syncStateWithTurtleDB())
  }

  // TREE HANDLERS

  handleTreeDocClick = (_id, rev) => {
    turtleDB.read(_id, rev)
      .then(doc => {
        this.setState({ selectedTreeDoc: doc })
      });
  }

  handlePickWinnerClick = () => {
    // access to doc in 'this.state.selectedTreeDoc'
    console.log('Doc to select as winner:', this.state.selectedTreeDoc);
    // {what: "ever", _id: "a8fcdeaa-d8ef-4503-9762-d8499bbc571c", _rev: "3-ba09f2c2cf66edc8a5efee5e52a502a6"}
    const doc = this.state.selectedTreeDoc;
    turtleDB.makeRevWinner(doc)
      .then(() => {
        this.syncStateWithTurtleDB();
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
              handleSyncClick={this.handleSyncClick}
              handleAutoSyncClick={this.handleAutoSyncClick}
              autoSync={this.state.autoSync}
              handleCompactClick={this.handleCompactClick}
            />
          </div>
          <div className="col-10">
            <div className="row">
              <div className="col-9">
                <TreeComponent
                  selectedTreeMetaDoc={this.state.selectedTreeMetaDoc}
                  selectedTreeDoc={this.state.selectedTreeDoc}
                  handleTreeDocClick={this.handleTreeDocClick}
                  handlePickWinnerClick={this.handlePickWinnerClick}
                />
              </div>
              <div className="col-3">
                <BenchmarkBox benchmark={this.state.benchmark} />
                <StorageDisplay storageInfo={this.state.storage} />
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
