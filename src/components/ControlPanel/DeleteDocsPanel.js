import React from 'react';

class DeleteDocsPanel extends React.Component {
  handleDeleteClick = (event) => {
    event.preventDefault();
    this.props.handleDeleteClick(
      document.querySelector('input[name="delete-number"]:checked').value
    );
  }

  render() {
    return (
      <div className="col">
        <form className="form-inline" onSubmit={this.handleDeleteClick}>
          <div className="form-group">
            <ul>
              <input type="radio" name="delete-number" value="1"/>1
              <input type="radio" name="delete-number" value="100"/>100
              <input type="radio" name="delete-number" value="1000"/>1000
              <input type="radio" name="delete-number" value="10000"/>10000
            </ul>
            <input className="btn btn-primary" type="submit" value="Delete" />
          </div>
        </form>
      </div>
    )
  }
}

export default DeleteDocsPanel;
