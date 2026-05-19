import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap/dist/js/bootstrap.js";
import './static/css/index.css';
import reportWebVitals from './reportWebVitals';
import App from './App';
import Icons from './components/Icons';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import store from "./redux/store";
import { Provider } from "react-redux";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Icons />
    </Provider>
  </React.StrictMode>
);

reportWebVitals();

