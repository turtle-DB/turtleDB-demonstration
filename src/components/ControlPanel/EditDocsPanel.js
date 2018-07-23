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
            <ul className="list-unstyled">
              <li>
                <input type="radio" name="edit-number" value="1"/>1
              </li>
              <li>
                <input type="radio" name="edit-number" value="100"/>100
              </li>
              <li>
                <input type="radio" name="edit-number" value="1000"/>1000
              </li>
              <li>
                <input type="radio" name="edit-number" value="10000"/>10000
              </li>

              <li>
                <input className="btn btn-info" type="submit" value="Edit" />
              </li>
            </ul>
          </div>
        </form>
      </div>
    )
  }
}

export default EditDocsPanel;
