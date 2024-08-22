// import "@fontsource/open-sans";
// import "@fontsource/signika";
import "unfetch/polyfill";
import "core-js/stable";

import App from "./components/App";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import React from "react";
import { createRoot } from "react-dom/client";
import store from "./store";

const rootElement = createRoot(document.getElementById("app"));

const pagesVersion = "latest";

rootElement.render(
  <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>
);
