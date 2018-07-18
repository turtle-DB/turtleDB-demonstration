import React from 'react';

class EditDocsPanel extends React.Component {
  handleEditClick = (event) => {
    event.preventDefault();
    this.props.handleEditClick(
      document.querySelector('input[name="edit-number"]:checked').value
    );
  }

  render() {
    return (
      <div className="col">
        <form className="form-inline" onSubmit={this.handleEditClick}>
          <div className="form-group">
            <ul>
              <input type="radio" name="edit-number" value="1"/>1
              <input type="radio" name="edit-number" value="100"/>100
              <input type="radio" name="edit-number" value="1000"/>1000
              <input type="radio" name="edit-number" value="10000"/>10000
            </ul>
            <input className="btn btn-primary" type="submit" value="Edit" />
          </div>
        </form>
      </div>
    )
  }
}

export default EditDocsPanel;
