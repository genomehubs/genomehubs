import React from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import styles from './Styles.scss';
import Landing from './Landing';

const Main = () => {
  let css = classnames(styles.flexCenter, styles.flexCenterHorizontal, styles.fillParent)
  return (
    <main className={css}>
      <Landing />
    </main>
  )
}

export default Main;
