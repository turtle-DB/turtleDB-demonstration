import React from 'react';
import Modal from 'react-responsive-modal';
import UpdateDoc from './UpdateDoc';

const HEADERS = ['name', 'cardSet', 'type', 'text', 'playerClass', 'attack', 'health', 'cost', 'rev', 'id'];

class Table extends React.Component {
  state = {
    showUpdateModal: false,
    docObj: null
  }

  // componentDidMount = () => {
  //   let results = {};
  //   this.props.data.forEach( doc => {
  //     results[doc.id] ? results[doc.id] += 1 : results[doc.id] = 1;
  //   })
  //
  //   console.log(Object.values(results).sort((a, b) => { a - b }));
  // }


  handleOpenModal = (obj) => {
    this.setState({ showUpdateModal: true, docObj: obj });
  }

  handleCloseModal = () => {
    this.setState({ showUpdateModal: false, docObj: null });
  }

  generateHeaders = () => {
    const thElements = HEADERS.map(property => {
      return <th key={property}>{property}</th>;
    });

    return (
      <tr>
        <th></th>
        <th></th>
        {thElements}
      </tr>
    );
  }

  generateRows = () => {
    // map over every object
    return this.props.data.map((doc, i) => {
      const cells = HEADERS.map((value, j) => <td key={doc.id + j}>{String(doc[value])}</td>)
      return (
        <tr key={doc.id}>
          <td>
            <button
              className="btn btn-danger"
              onClick={() => this.props.handleDeleteClick(doc.id)}
            >Del</button>
          </td>
          <td>
            <button
              className="btn btn-warning"
              onClick={() => this.handleOpenModal(doc)}
            >Update</button>
          </td>
          {cells}
        </tr>
      );
    });
  }

  render() {
    let headerComponents;
    let rowComponents;

    if (this.props.data.length > 0) {
      headerComponents = this.generateHeaders();
      rowComponents = this.generateRows()
    }


    return (
      <div>
        <div className="shadow p-3 mb-5 bg-light rounded">
          <span>{`${this.props.data.length} Documents`}</span>
          <table className='table table-striped table-bordered table-condensed'>
            <thead>{headerComponents}</thead>
            <tbody>{rowComponents}</tbody>
          </table>
        </div>
        {this.state.showUpdateModal && <Modal
          open={this.state.showUpdateModal}
          onClose={this.handleCloseModal}
          showCloseIcon={false}
          center={true}
        >
          <UpdateDoc
            handleUpdateClick={this.props.handleUpdateClick}
            docObj={this.state.docObj}
            closeModal={this.handleCloseModal}
          />
        </Modal>}
      </div>
    );
  }
}

export default Table;
