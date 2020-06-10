import React from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import styles from './Styles.scss';

const Footer = () => {
  return (
    <footer>
      Powered by{' '}
      <a className={styles.link} href='https://genomehubs.org/' target='_blank'>
        GenomeHubs
      </a>{' '}
      &copy; 2020
    </footer>
  );
};

export default Footer;
