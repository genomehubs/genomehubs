import React from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import withLocation from '../hocs/withLocation';
import styles from './Styles.scss';
import Landing from './Landing';
import InfoPage from './InfoPage';

const Main = (props) => {
  let content;
  if (props.views.primary == 'landing') {
    content = <Landing />;
  } else {
    content = <InfoPage />;
  }
  let css = classnames(
    styles.flexCenter,
    styles.flexCenterHorizontal,
    styles.fillParent
  );
  return <main className={css}>{content}</main>;
};

export default compose(withLocation)(Main);
