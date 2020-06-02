import { createLogger } from 'redux-logger'
import { createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import rootReducer from './reducers/root'
import { enableBatching } from 'redux-batched-actions';

const loggerMiddleware = createLogger()

const store = createStore(
  enableBatching(rootReducer),
  applyMiddleware(
    thunkMiddleware,
    // loggerMiddleware
  )
)

export default store;
