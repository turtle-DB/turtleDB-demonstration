import React from 'react';

class PropertyFilter extends React.Component {
  handleFilterClick = (event) => {

  }

  generatePropertyList = () => {
    return Object.keys(this.props.data[0]).map((property, idx) =>
      <li className="checkbox" key={idx}>
        <label className="form-check-label">
          <input className="form-check-input" type="checkbox" value={property} />
          {property}
        </label>
      </li>
    )
  }

  render() {
    if (this.props.data.length > 0) {
      return (
        <div className="col">
          <h4>Filter Documents</h4>
          <ul>
            {this.generatePropertyList()}
          </ul>
        </div>
      )
    } else {
      return null;
    }
  }
}


export default PropertyFilter;
