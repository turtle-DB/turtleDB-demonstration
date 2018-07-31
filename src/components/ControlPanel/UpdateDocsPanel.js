import React from 'react';

class UpdateDocsPanel extends React.Component {
  handleUpdateClick = (event) => {
    event.preventDefault();
    this.props.handleUpdateClick(
      document.querySelector('input[name="update-number"]:checked').value
    );
  }

  render() {
    return (
      <div className='row'>
        <div className="col">
          <form className="form-inline" onSubmit={this.handleUpdateClick}>
            <div className="form-group">
              <ul className="list-unstyled">
                <li>
                  <input type="radio" name="update-number" value="1" />1
                </li>
                <li>
                  <input type="radio" name="update-number" value="100" />100
                </li>
                <li>
                  <input type="radio" name="update-number" value="1000" />1000
                </li>
                <li>
                  <input type="radio" name="update-number" value="10000" />10000
                </li>

                <li>
                  <input className="btn btn-info" type="submit" value="Update" />
                </li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    )
  }
}

export default UpdateDocsPanel;
