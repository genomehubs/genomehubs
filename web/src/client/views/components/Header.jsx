import React from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import styles from './Styles.scss';
import Preferences from './Preferences';

const Header = () => {
  return (
    <header>
      <Preferences/>
    </header>
  )
}

export default Header;
