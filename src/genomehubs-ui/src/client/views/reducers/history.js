import { createBrowserHistory } from "history";
const basename = BASENAME || "";
export const history = createBrowserHistory({
  basename,
});

export default history;
