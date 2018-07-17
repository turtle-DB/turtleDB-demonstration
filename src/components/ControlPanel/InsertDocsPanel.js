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
            <ul>
              <input type="radio" name="insert-number" value="1"/>1
              <input type="radio" name="insert-number" value="100"/>100
              <input type="radio" name="insert-number" value="1000"/>1000
              <input type="radio" name="insert-number" value="10000"/>10000
            </ul>
            <input className="btn btn-primary" type="submit" value="Insert" />
          </div>
        </form>
      </div>
    )
  }
}

export default InsertDocsPanel;
