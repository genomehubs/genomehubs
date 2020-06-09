import React from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import withLocation from '../hocs/withLocation';
import styles from './Styles.scss';

const siteName = SITENAME || '/'

const SiteName = (props) => {
  const handleClick = () => {
    props.chooseView('landing')
  }
  return (
    <span className={styles.siteName}
          onClick={handleClick}>
      {siteName}
    </span>
  )
}

export default compose(
  withLocation
)(SiteName);
