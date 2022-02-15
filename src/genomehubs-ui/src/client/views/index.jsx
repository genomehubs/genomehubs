// import "@fontsource/open-sans";
// import "@fontsource/signika";
import "unfetch/polyfill";
import "core-js/stable";

import { hydrate, render } from "react-dom";

import App from "./components/App";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import React from "react";
import store from "./store";

const rootElement = document.getElementById("app");

if (rootElement.hasChildNodes()) {
  hydrate(
    <BrowserRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </BrowserRouter>,
    rootElement
  );
} else {
  render(
    <BrowserRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </BrowserRouter>,
    rootElement
  );
}
