import React from 'react';

class UpdateDoc extends React.Component {
  handleUpdateClick = event => {
    event.preventDefault();
    const updatedObj = Object.assign(this.props.selectedDoc,
      {
        name: event.target.name.value,
        age: parseInt(event.target.age.value, 10),
        gender: event.target.gender.value,
        company: event.target.company.value,
        email: event.target.email.value,
        phone: event.target.phone.value,
        address: event.target.address.value,
      })
    this.props.handleUpdateClick(updatedObj);
    this.props.closeModal();
  }

  generateInputs = () => {
    const obj = this.props.selectedDoc;
    const objArr = Object.keys(obj).map(k => [k, obj[k]]);
    return objArr.map(((arr, idx) => {
      // do not generate input for id field
      if (arr[0] !== "_id" && arr[0] !== "_rev") {
        return (
          <div className="form-group row" key={idx + 'update'}>
            <label htmlFor={arr[0]}>{arr[0]}</label>
            <input className="form-control" type="text" name={arr[0]} defaultValue={arr[1]} />
          </div>
        );
      }
    }));
  }

  render() {
    const inputFields = this.generateInputs();

    return (
          <div className="modal-content">
            <div className="modal-header text-center">
              <h5 className="modal-title">Update Doc</h5>
            </div>
            <form onSubmit={this.handleUpdateClick}>

              <div className="form-row">
                <div className="form-group col">
                  <label htmlFor="name">Name</label>
                <input type="text" className="form-control" name="name"/>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col-md-6">
                  <label htmlFor="age">Age</label>
                  <input type="number" className="form-control" name="age"/>
                </div>

                <div className="form-group col-md-6">
                  <label htmlFor="gender">Gender</label>
                  <select id="gender" class="form-control">
                    <option selected>Choose...</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col">
                  <label htmlFor="email">Email</label>
                  <input type="email" className="form-control" name="email"/>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col">
                  <label htmlFor="phone">Phone</label>
                  <input type="phone" className="form-control" name="phone"/>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col">
                  <label htmlFor="company">Company</label>
                <input type="text" className="form-control" name="phone"/>
                </div>
              </div>

              <input className="btn btn-primary" type="submit" value="Update" />
            </form>
          </div>
    )
  }
}

export default UpdateDoc;
