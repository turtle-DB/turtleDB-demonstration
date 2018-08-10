import React from 'react';

class Table extends React.Component {
  render() {
    return (
      <table className='table table-striped table-bordered table-condensed'>
        <thead>{this.props.headers}</thead>
        <tbody>{this.props.rows}</tbody>
      </table>
    )
  }
}

export default Table;
