import React from 'react';

class Pagination extends React.Component {
  handleLeftClick = () => {
    this.props.handlePaginationClick('LEFT');
  }

  handleRightClick = () => {
    this.props.handlePaginationClick("RIGHT");
  }

  getMaxRange = () => {
    const maxMultiple = this.props.page * this.props.tableMax;
    return maxMultiple <= this.props.dataLength ?
           maxMultiple : this.props.dataLength;
  }

  getMinRange = () => {
    return this.props.dataLength === 0 ? 0 : (this.props.page - 1) * this.props.tableMax + 1;
  }

  render() {
    return (
      <div className="pagination">
        <p>
          {`${this.props.dataLength} Documents`}
        </p>
        <button
          onClick={this.handleLeftClick}
          disabled={this.props.page <= 1}
          >Left
        </button>
        <button
          onClick={this.handleRightClick}
          disabled={this.props.page >= this.props.maxPages}
          >Right
        </button>
        <span>{this.getMinRange()} of {this.getMaxRange()}</span>
      </div>
  )}
}

export default Pagination;
