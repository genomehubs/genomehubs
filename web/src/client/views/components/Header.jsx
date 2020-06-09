import React from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import styles from './Styles.scss';
import SiteName from './SiteName';
import Preferences from './Preferences';
import Tabs from './Tabs';

const Header = () => {
  return (
    <header>
      <SiteName/>
      <Preferences/>
      <Tabs/>
    </header>
  )
}

export default Header;
