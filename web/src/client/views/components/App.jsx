import React from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import styles from './Styles.scss';
import { CookiesProvider } from 'react-cookie';
import { withCookies } from 'react-cookie';
import withFadeInOut from '../hocs/withFadeInOut';
import withTheme from '../hocs/withTheme';
import Layout from './Layout';

const App = ({theme, cookies}) => {
  return (
    <div className={classnames(`theme${theme}`, styles.app)}>
      <CookiesProvider>
        <Layout cookies={cookies}/>
      </CookiesProvider>
    </div>
  );
};

export default compose(
  withCookies,
  withTheme,
  withFadeInOut,
)(App);
