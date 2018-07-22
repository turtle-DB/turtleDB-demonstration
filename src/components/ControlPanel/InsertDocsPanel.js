import React from 'react';

class InsertDocsPanel extends React.Component {
  handleInsertClick = (event) => {
    event.preventDefault();
    this.props.handleInsertClick(
      document.querySelector('input[name="insert-number"]:checked').value
    );
  }

  render() {
    return (
      <div className="col">
        <form className="form-inline" onSubmit={this.handleInsertClick}>
          <div className="form-group">
            <ul className="list-unstyled">
              <li>
                <input type="radio" name="insert-number" value="1"/>1
              </li>
              <li>
                <input type="radio" name="insert-number" value="100"/>100
              </li>
              <li>
                <input type="radio" name="insert-number" value="1000"/>1000
              </li>
              <li>
                <input type="radio" name="insert-number" value="10000"/>10000
              </li>

              <li>
                <input className="btn btn-success" type="submit" value="Insert" />
              </li>
            </ul>

          </div>
        </form>
      </div>
    )
  }
}

export default InsertDocsPanel;
