import React from 'react';
import BenchmarkDisplay from './BenchmarkDisplay';

class BenchmarkBox extends React.Component {
  render() {
    return (
      <div>
        <h4 className="text-center">Benchmarks</h4>
        <BenchmarkDisplay benchmark={this.props.benchmark} />
      <img className="w-100" src={"./images/spinning-turtle.gif"} alt="Spinning Turtle" />
      </div>
    )
  }
}


export default BenchmarkBox;
