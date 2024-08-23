import "@fontsource/open-sans/index.css";
import "@fontsource/open-sans/700.css";
import "@fontsource/open-sans/400-italic.css";
import "@fontsource/open-sans/700-italic.css";
import "@fontsource/signika/index.css";
import "@fontsource/signika/700.css";
import "@fontsource/roboto-mono/index.css";
import "@fontsource/roboto-mono/700.css";
import "@fontsource/roboto-mono/400-italic.css";
import "@fontsource/roboto-mono/700-italic.css";
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
