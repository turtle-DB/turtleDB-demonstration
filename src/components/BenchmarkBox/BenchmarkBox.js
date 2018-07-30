import React from 'react';
import BenchmarkDisplay from './BenchmarkDisplay';

class BenchmarkBox extends React.Component {
  render() {
    return (
      <div>
        <h4>Benchmarks</h4>
        <BenchmarkDisplay benchmark={this.props.benchmark}/>
      <img className="w-75" src={"./images/spinning-turtle.gif"} alt="Spinning Turtle"/>
      </div>
    )
  }
}


export default BenchmarkBox;
