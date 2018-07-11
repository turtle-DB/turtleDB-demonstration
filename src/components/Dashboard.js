import React from 'react';
import { getNumDocs } from './../data/newData';
import Table from './Table';
import InsertDocs from './InsertDocs';
import DropButton from './DropButton'
import PropertyFilter from './PropertyFilter'
import turtleDB from '../turtleDB/turtle';

class Dashboard extends React.Component {
  constructor() {
    super()
    this.state = {
      data: []
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

  handleDeleteClick = (key) => {
    turtleDB.delete(key).then(() => {
      this.syncStateWithTurtleDB();
    });
  }

  handleInsertClick = (num) => {
    const newDocs = getNumDocs(num);
    newDocs.forEach(doc => {
      turtleDB.create(doc);
    })
    this.syncStateWithTurtleDB();
  }

  handleUpdateClick = (newObj) => {
    turtleDB.update(newObj.id, newObj).then(() => {
      this.syncStateWithTurtleDB();
    })
  }

  handleDropDatabase = () => {
    turtleDB.dropDB().then(() => this.setState({ data: [] }));
  }

  render() {
    return (
      <div>
        <div className="shadow p-3 mb-5 bg-light rounded container">
          <div className="row">
            <InsertDocs
              handleInsertClick={this.handleInsertClick}
            />
            <PropertyFilter
              data={this.state.data}
            />
            <DropButton
              handleDropDatabase={this.handleDropDatabase}
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
