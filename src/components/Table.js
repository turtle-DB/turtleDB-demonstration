import React from 'react';
import Modal from 'react-responsive-modal';
import UpdateDoc from './UpdateDoc';

class Table extends React.Component {
  state = {
    showUpdateModal: false,
    docObj: null
  }

  handleOpenModal = (obj) => {
    this.setState({ showUpdateModal: true, docObj: obj });
  }

  handleCloseModal = () => {
    this.setState({ showUpdateModal: false, docObj: null });
  }

  generateHeaders = () => {
    // Only need one object to get property names for headers
    const properties = Object.keys(this.props.data[0]).reverse();

    const thElements = properties.map(property => {
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
    return this.props.data.map((obj) => {
      // handle the column data within each row
      let values = Object.values(obj).reverse();
      var cells = values.map((value, idx) => <td key={obj.id + idx}>{String(value)}</td>);
      return (
        <tr key={obj.id}>
          <td>
            <button
              className="btn btn-danger"
              onClick={() => this.props.handleDeleteClick(obj.id)}
            >Del</button>
          </td>
          <td>
            <button
              className="btn btn-warning"
              onClick={() => this.handleOpenModal(obj)}
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

