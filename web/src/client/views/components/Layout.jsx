import React from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import styles from './Styles.scss';
import Main from './Main';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  return (
    <div className={styles.fillParent}>
      <Main/>
      <Header/>
      <Footer/>
    </div>
  )
}

export default Layout;
