import React from 'react';
import BenchmarkDisplay from './BenchmarkDisplay';

class BenchmarkBox extends React.Component {
  render() {
    return (
      <div>
        <h4>Benchmarks</h4>
        <BenchmarkDisplay benchmark={this.props.benchmark}/>
      </div>
    )
  }
}


export default BenchmarkBox;
