import React from 'react';

class InsertDocs extends React.Component {
  handleInsertClick = (event) => {
    event.preventDefault();
    const num = Number(event.target.number.value);
    this.props.handleInsertClick(num);
  }

  generateCardSets = () => {
    return Object.keys(this.props.data).map((property, idx) =>
      <li className="checkbox" key={idx}>
        <label className="form-check-label">
          <input className="form-check-input" type="checkbox" value={property} />
        </label>
      </li>
    )
  }

  render() {
    return (
      <div className="col">
        <h4>Insert Documents</h4>
        <form className="form-inline" onSubmit={this.handleInsertClick}>
          <div className="form-group">
            <input className="form-control" type="text" name="number" placeholder="Number of docs" pattern="[0-9]*" />
            <input className="btn btn-primary" type="submit" value="Insert" />
          </div>
          <div className="form-group">
            <h4>Card Sets</h4>
            <ul>
              {this.generateCardSets()}
            </ul>
          </div>
        </form>
      </div>
    )
  }
}

export default InsertDocs;
