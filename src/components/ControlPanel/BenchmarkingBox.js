import React from 'react';

const BenchmarkingBox = props => {
  return (
    <div className="benchmark">
      <p>{props.benchmark}ms</p>
    </div>
  )
}

export default BenchmarkingBox;
