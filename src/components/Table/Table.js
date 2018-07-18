import React from 'react';
import Modal from 'react-responsive-modal';

//components
import UpdateDoc from './UpdateDoc';
import Pagination from './Pagination';

const HEADERS = ['name', 'cardSet', 'type', 'text', 'playerClass', 'attack', 'health', 'cost', 'rev', 'id'];

class Table extends React.Component {
  state = {
    showUpdateModal: false,
    docObj: null,
    page: 1,
    tableMax: 40,
  }

  componentWillReceiveProps = () => {
    console.log(this.props.dataLength);
    this.setState({ maxPages: Math.ceil(this.props.data.length / this.state.tableMax)})
  }

  handleOpenModal = (obj) => {
    this.setState({ showUpdateModal: true, docObj: obj });
  }

  handleCloseModal = () => {
    this.setState({ showUpdateModal: false, docObj: null });
  }

  handlePaginationClick = direction => {
    if (direction === 'LEFT' && this.state.page > 1) {
      this.setState(prevState => {
        return { page: prevState.page - 1 }
      });
    } else if (direction === 'RIGHT' && this.state.page < Math.ceil(this.props.data.length / this.state.tableMax)) {
      this.setState(prevState => {
        return { page: prevState.page + 1 }
      });
    }
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
    return this.props.data.slice((this.state.page - 1) * this.state.tableMax, this.state.page * this.state.tableMax).map((doc, i) => {
      const cells = HEADERS.map((value, j) => <td key={doc.id + j}>{String(doc[value])}</td>)
      return (
        <tr key={doc.id}>
          <td>
            <button
              className="btn btn-danger"
              onClick={() => this.props.handleSingleDeleteClick(doc.id)}
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
        <Pagination
          handlePaginationClick={this.handlePaginationClick}
          dataLength={this.props.data.length}
          page={this.state.page}
          maxPages={Math.ceil(this.props.data.length / this.state.tableMax)}
          tableMax={this.state.tableMax}
        />
        <div className="shadow p-3 mb-5 bg-light rounded">
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
