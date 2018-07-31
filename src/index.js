import React from 'react';
import ReactDOM from 'react-dom';

import 'bootstrap/dist/css/bootstrap.css';
import './styles/index.css';
import registerServiceWorker from './registerServiceWorker';

if (process.env.NODE_ENV !== 'production') {
  localStorage.setItem('debug', 'turtleDB:*');
}

import App from './App';
ReactDOM.render(<App />, document.getElementById('root'));
// registerServiceWorker();
