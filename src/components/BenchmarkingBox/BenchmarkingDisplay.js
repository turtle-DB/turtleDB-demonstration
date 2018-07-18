import React from 'react';

const BenchmarkingDisplay = props => {
  if (props.benchmark.time !== null) {
    return <p>It took {props.benchmark.time}ms to {props.benchmark.type} {props.benchmark.count} documents.</p>
  }
  return <p>No benchmarks have been run.</p>
}

export default BenchmarkingDisplay;
