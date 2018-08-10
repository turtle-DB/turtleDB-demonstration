import React from 'react';

class UpdateDoc extends React.Component {
  handleSingleUpdateClick = event => {
    event.preventDefault();
    const updatedObj = Object.assign(this.props.selectedDoc,
      {
        name: event.target.name.value,
        age: parseInt(event.target.age.value, 10),
        gender: event.target.gender.value,
        company: event.target.company.value,
        email: event.target.email.value,
        phone: event.target.phone.value,
      })
    this.props.handleSingleUpdateClick(updatedObj);
    this.props.closeModal();
  }

  render() {
    return (
      <div className="modal-content">
        <div className="modal-header text-center">
          <h5 className="modal-title">Update Doc</h5>
        </div>

        <form onSubmit={this.handleSingleUpdateClick}>
          <div className="form-row">
            <div className="form-group col">
              <label htmlFor="name">Name</label>
              <input type="text" className="form-control" name="name" defaultValue={this.props.selectedDoc.name} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group col-md-6">
              <label htmlFor="age">Age</label>
              <input type="number" className="form-control" name="age" defaultValue={this.props.selectedDoc.age} />
            </div>

            <div className="form-group col-md-6">
              <label htmlFor="gender">Gender</label>
              <select id="gender" className="form-control" defaultValue={this.props.selectedDoc.gender}>
                <option>male</option>
                <option>female</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group col">
              <label htmlFor="email">Email</label>
              <input type="email" className="form-control" name="email" defaultValue={this.props.selectedDoc.email} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group col">
              <label htmlFor="phone">Phone</label>
              <input type="phone" className="form-control" name="phone" defaultValue={this.props.selectedDoc.phone} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group col">
              <label htmlFor="company">Company</label>
              <input type="text" className="form-control" name="company" defaultValue={this.props.selectedDoc.company} />
            </div>
          </div>

          <input className="btn btn-primary" type="submit" value="Update" />
          <button className="btn btn-danger" value="cancel" onClick={this.props.closeModal}>Cancel</button>
        </form>
      </div>
    )
  }
}

export default UpdateDoc;
