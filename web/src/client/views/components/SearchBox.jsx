import React from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import styles from './Styles.scss';

const SearchBox = () => {
  let css = classnames(styles.flexCenter, styles.fillParent);
  return (
    <input
      type='text'
      placeholder={'Search GenomeHub'}
      className={styles.searchBox}
    ></input>
  );
};

export default SearchBox;
