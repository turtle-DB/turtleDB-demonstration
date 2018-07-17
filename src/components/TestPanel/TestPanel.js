import React from 'react';

// Components
import TestButton from './TestButton';

class TestPanel extends React.Component {
  handleTestClick = () => {
    console.log('Running Tests!');
    this.testCreateDocument();
  }

  testCreateDocument = () => {
    const name = 'samwise gamgee';
    const race = 'hobbit';
    let newDoc = { name, race };

    return turtleDB.create(newDoc)
     .then(() => turtleDB.filterBy({ name }))
     .then(res => console.log(res[0].race === race));
  }

  render() {
    return (
      <div>
        <h4>Test Panel</h4>
        <TestButton
          handleTestClick={this.handleTestClick}
        />
      </div>
    )
  }
}

export default TestPanel;
