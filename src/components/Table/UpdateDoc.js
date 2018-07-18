import React from 'react';

class UpdateDoc extends React.Component {
  handleUpdateClick = (event) => {
    event.preventDefault();

    const newObj = {};
    const properties = Object.keys(this.props.docObj);
    properties.forEach(key => {
      if (key !== 'id') {
        newObj[key] = event.target[key].value
      }
    });
    newObj.id = this.props.docObj.id;

    this.props.handleUpdateClick(newObj);
    this.props.closeModal();
  }

  generateInputs = () => {
    const obj = this.props.docObj;
    const objArr = Object.keys(obj).map(k => [k, obj[k]]);
    return objArr.map(((arr, idx) => {
      // do not generate input for id field
      if (arr[0] !== "id") {
        return (
          <div className="form-group" key={idx + 'update'}>
            <label htmlFor={arr[0]} className="col-md-2 control-label">{arr[0]}</label>
            <input className="col-md-5" type="text" name={arr[0]} defaultValue={arr[1]} />
          </div>
        );
      }
    }));
  }

  render() {
    const inputFields = this.generateInputs();

    return (
      <div>
        <div className="container">
          <h2>Update Document</h2>
          <form className="form-horizontal" onSubmit={this.handleUpdateClick}>
            {inputFields}
            <input className="btn btn-primary" type="submit" value="Update" />
          </form>
        </div>
      </div>
    )
  }
}

export default UpdateDoc;
