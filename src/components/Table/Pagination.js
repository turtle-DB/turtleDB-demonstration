import React from 'react';

const TABLE_MAX = 50;

class Pagination extends React.Component {
  render() {
    return (
      <div className="pagination">
        <button onClick={this.handleLeftClick}>Left</button>
        <button onClick={this.handleRightClick}>Right</button>
      </div>
  )}
}

export default Pagination;
