import React from 'react';
import BenchmarkingDisplay from './BenchmarkingDisplay';

const BenchmarkingBox = props => {
  return (
    <h4>Benchmark</h4>
    <div className="benchmark">
      <BenchmarkingDisplay benchmark={props.benchmark}/>
    </div>
  )
}


export default BenchmarkingBox;
