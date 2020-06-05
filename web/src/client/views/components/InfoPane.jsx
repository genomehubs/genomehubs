import React from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import styles from './Styles.scss';
import SearchBox from './SearchBox';

const InfoPane = ({paneWidth, title, image, text, fullText}) => {
  let css = classnames(styles.flexCenter, styles.infoPane, styles.infoPaneDefault)
  return (
    <div className={css} style={{width: `${paneWidth}px`}}>
      <h2>{title}</h2>
    </div>
  )
}

export default InfoPane;
