import React from 'react';

// Components
import TestButton from './TestButton';

class TestPanel extends React.Component {
  // handleTestClick = () => {
  //   console.log('Running Tests!');
  //   this.testCreateDocument();
  // }
  //
  // testCreateDocument = () => {
  //   let newDoc = { id: 'ab123', name: 'samwise gamgee' };
  //   turtleDB.create(newDoc).then(res => {
  //     console.log(res);
  //   });
  // }

  render() {
    return (
      <div>
        <h4>Test Panel</h4>
        <TestButton
          handleInsertClick={this.props.handleInsertClick}
        />
      </div>
    )
  }
}

export default TestPanel;
