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
          <div className="form-check">
            <ul className="list-unstyled">
              <li>
                <input id="defaultUnchecked" type="radio" name="delete-number" value="1"/>1
              </li>
              <li>
                <input id="defaultUnchecked" type="radio" name="delete-number" value="100"/>100
              </li>
              <li>
                <input id="defaultUnchecked" type="radio" name="delete-number" value="1000"/>1000
              </li>
              <li>
                <input id="defaultUnchecked" type="radio" name="delete-number" value="10000"/>10000
              </li>

              <li>
                <input className="btn btn-warning" type="submit" value="Delete" />
              </li>
            </ul>
        </div>
        </form>
      </div>
    )
  }
}

export default DeleteDocsPanel;
