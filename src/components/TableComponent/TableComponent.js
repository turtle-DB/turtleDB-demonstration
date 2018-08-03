import React from 'react';
import Modal from 'react-responsive-modal';

//components
import UpdateDoc from './UpdateDoc';
import Pagination from './Pagination';
import Table from './Table';

const HEADERS = ['Name', 'Age', 'Gender', 'Company', 'Email', 'Phone'];

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
    } else if (direction === 'RIGHT' && this.state.page < Math.ceil(this.props.data.docs.length / this.state.tableMax)) {
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
    return this.props.data.docs.slice((this.state.page - 1) * this.state.tableMax, this.state.page * this.state.tableMax).map(doc => {
      const cells = HEADERS.map((header, j) => <td key={doc._id + j}>{doc[header.toLowerCase()]}</td>);

      const metaDoc = this.props.data.metaDocs.find(metaDoc => metaDoc._id === doc._id);
      const conflictBoolean = metaDoc._leafRevs.length > 1;
      const treeBtnColor = conflictBoolean ? 'warning' : 'success';

      return (
        <tr key={doc._id}>
          <td className="row-buttons-container">
            <span>{conflictBoolean ? '⚠️' : '✅'}</span>
            <button
              className={`btn btn-${treeBtnColor} btn-sm mx-2`}
              onClick={() => this.props.handleViewTreeClick(metaDoc)}
            >View Tree</button>
            <button
              className="btn btn-dark btn-sm mx-2"
              onClick={() => this.props.handleSingleDeleteClick(doc._id)}
            >Del</button>
            <button
              className="btn btn-info btn-sm mx-2"
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

    if (this.props.data.docs.length > 0) {
      headerComponents = this.generateHeaders();
      rowComponents = this.generateRows()
    }

    return (
      <div>
        <Pagination
          handlePaginationClick={this.handlePaginationClick}
          dataLength={this.props.data.docs.length}
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
