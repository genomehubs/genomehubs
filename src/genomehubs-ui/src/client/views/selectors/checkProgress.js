import { getController, setMessage } from "../reducers/message";

import { apiUrl } from "../reducers/api";
import store from "../store";

export function checkProgress({
  queryId,
  delay = 5000,
  dispatch,
  iteration = 0,
  message,
}) {
  let state = store.getState();
  let url = `${apiUrl}/progress?queryId=${queryId}`;
  let isFetching = false;

  const fetchProgress = async () => {
    if (iteration > 0 && !isFetching) {
      let json;
      try {
        isFetching = true;
        const response = await fetch(url, {
          signal: getController(state).signal,
        });
        json = await response.json();
      } catch (error) {
        isFetching = false;
        console.log(error);
        return;
      }
      dispatch(
        setMessage({
          message,
          duration: null,
          severity: "info",
          ...(json.progress && { ...json.progress }),
        })
      );

      isFetching = false;
    }
    iteration++;
  };

  let interval = setInterval(fetchProgress, delay);
  return interval;
}
