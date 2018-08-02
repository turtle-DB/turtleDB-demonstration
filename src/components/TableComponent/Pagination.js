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
      <nav>
        <div className="d-flex">
          <ul className="pagination">
            <li className={`page-item ${this.props.page <= 1 ? "disabled" : ""}`}>
              <a
                className="page-link"
                onClick={this.handleLeftClick}
              >Previous
                </a>
            </li>
            <li className={`page-item ${(this.props.page * this.props.tableMax) > this.props.dataLength ? "disabled" : ""}`}>
              <a
                className="page-link"
                onClick={this.handleRightClick}
              >Next
                </a>
            </li>
          </ul>
          <p className="display-pages">
            Displaying {this.getMinRange()} - {this.getMaxRange()} of {this.props.dataLength}
          </p>
        </div>
      </nav>

    )
  }
}

export default Pagination;
// {}
//
