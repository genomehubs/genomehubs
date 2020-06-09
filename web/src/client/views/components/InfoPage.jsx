import React from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import withLocation from '../hocs/withLocation';
import styles from './Styles.scss';
import SearchBox from './SearchBox';

const InfoPage = (props) => {
  // {paneWidth, title, image, text, fullText}

  const handleClick = () => {
    props.chooseView(props.view)
  }
  let highlight = props.views.primary == props.view
  let css = classnames(styles.flexCenter,
                       styles.infoPane,
                       styles.infoPaneDefault,
                       {[styles.infoPaneHighlight]: highlight})
  return (
    <div className={css}
         style={{width: `${props.paneWidth}px`}}
         onClick={handleClick}>
      <h2>{props.title}</h2>
    </div>
  )
}

export default compose(
  withLocation
)(InfoPage);
