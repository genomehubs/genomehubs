import { apiUrl } from "#reducers/api";
import { setMessage } from "#reducers/message";
import store from "#store";

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

  let json = {};
  const currentProgress = () => json.progress || {};

  const fetchProgress = async () => {
    if (iteration > 0 && !isFetching) {
      try {
        isFetching = true;
        const response = await fetch(url, {
          signal: window.controller.signal,
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
        }),
      );

      isFetching = false;
    }
    iteration++;
  };

  let interval = setInterval(fetchProgress, delay);
  return { interval, currentProgress };
}
