import React from 'react';
// import Modal from 'react-responsive-modal';

//components
import UpdateDoc from './UpdateDoc';
import Pagination from './Pagination';
import Table from './Table';
import UpdateModal from './UpdateModal';

const HEADERS = ['name', 'age', 'gender', 'company', 'email', 'phone'];

class TableComponent extends React.Component {
  state = {
    showUpdateModal: false,
    docObj: null,
    page: 1,
    tableMax: 8,
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
    const h = HEADERS.map((header, idx) => <th key={header+idx}>{header}</th>)

    return (
      <tr>
        <th></th>
        <th></th>
        {h}
      </tr>
    );
  }

  generateRows = () => {
    return this.props.data.slice((this.state.page - 1) * this.state.tableMax, this.state.page * this.state.tableMax).map((doc, i) => {
      const cells = HEADERS.map((header, j) => <td key={doc._id + j}>{doc[header]}</td>);

      return (
        <tr key={doc._id}>
          <td>
            <button
              className="btn btn-danger"
              onClick={() => this.props.handleSingleDeleteClick(doc._id)}
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
          tableMax={this.state.tableMax}
        />
        <Table
          headers={headerComponents}
          rows={rowComponents}
        />
        <UpdateModal />
      </div>
    );
  }
}

export default TableComponent;

// {this.state.showUpdateModal && <Modal
//   open={this.state.showUpdateModal}
//   onClose={this.handleCloseModal}
//   showCloseIcon={false}
//   center={true}
// >
//   <UpdateDoc
//     handleUpdateClick={this.props.handleUpdateClick}
//     docObj={this.state.docObj}
//     closeModal={this.handleCloseModal}
//   />
// </Modal>}
