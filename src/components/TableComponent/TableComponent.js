import React from 'react';
import Modal from 'react-responsive-modal';

//components
import UpdateDoc from './UpdateDoc';
import Pagination from './Pagination';
import Table from './Table';

const HEADERS = ['name', 'age', 'gender', 'company', 'email', 'phone'];

class TableComponent extends React.Component {
  state = {
    showUpdateModal: false,
    selectedDoc: null,
    page: 1,
    tableMax: 8,
  }

  handleOpenModal = (obj) => {
    this.setState({ showUpdateModal: true, selectedDoc: obj });
  }

  handleCloseModal = () => {
    this.setState({ showUpdateModal: false, selectedDoc: null });
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
    const h = HEADERS.map((header, idx) => <th key={header + idx}>{header}</th>)

    return (
      <tr>
        <th className="row-butttons-header"></th>
        {h}
      </tr>
    );
  }

  generateRows = () => {
    return this.props.data.slice((this.state.page - 1) * this.state.tableMax, this.state.page * this.state.tableMax).map((doc, i) => {
      const cells = HEADERS.map((header, j) => <td key={doc._id + j}>{doc[header]}</td>);

      return (
        <tr key={doc._id}>
          <td className="row-buttons-container">
            <button
              className="btn btn-dark btn-sm mx-2"
              onClick={() => this.props.handleViewTreeClick(doc._id)}
            >View Tree</button>
            <button
              className="btn btn-danger btn-sm mx-2"
              onClick={() => this.props.handleSingleDeleteClick(doc._id)}
            >Del</button>
            <button
              className="btn btn-warning btn-sm mx-2"
              onClick={() => this.handleOpenModal(doc)}
            >Edit</button>
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
          tableMax={this.state.tableMax}
        />
        <Table
          headers={headerComponents}
          rows={rowComponents}
        />
        {this.state.showUpdateModal && <Modal
          open={this.state.showUpdateModal}
          onClose={this.handleCloseModal}
          showCloseIcon={false}
          center={true}
        >
          <UpdateDoc
            handleSingleUpdateClick={this.props.handleSingleUpdateClick}
            selectedDoc={this.state.selectedDoc}
            closeModal={this.handleCloseModal}
          />
        </Modal>}
      </div>
    );
  }
}

export default TableComponent;
