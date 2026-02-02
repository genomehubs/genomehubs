// CRITICAL: Set webpack public path BEFORE any imports
// This must be the VERY FIRST code to execute in the bundle
const rawBasename =
  (typeof window !== "undefined" &&
    window.process &&
    window.process.ENV &&
    window.process.ENV.GH_BASENAME) ||
  "";
const cleanBasename = String(rawBasename).replace(/^\/+|\/+$/g, "");
const runtimePublicPath = cleanBasename ? "/" + cleanBasename + "/" : "/";
__webpack_public_path__ = runtimePublicPath;

// Load only essential font weights (saves ~800 KB)
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/700.css";
import "@fontsource/signika/index.css";
import "@fontsource/roboto-mono/400.css";
import "unfetch/polyfill";
import "core-js/stable";

import App from "./components/App";
import { BrowserRouter } from "react-router-dom";
import { CookiesProvider } from "react-cookie";
import { Provider } from "react-redux";
import { createRoot } from "react-dom/client";
import store from "./store";

const rootElement = createRoot(document.getElementById("app"));

const pagesVersion = "latest";

rootElement.render(
  <CookiesProvider>
    <BrowserRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </BrowserRouter>
  </CookiesProvider>,
);
