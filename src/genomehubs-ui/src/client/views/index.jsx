// Load only essential font weights (saves ~800 KB)
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/700.css";
import "@fontsource/signika/700.css";
import "@fontsource/roboto-mono/400.css";
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
  </BrowserRouter>,
);
