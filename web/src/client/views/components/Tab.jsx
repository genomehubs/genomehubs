import React from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import withLocation from '../hocs/withLocation';
import styles from './Styles.scss';
import SearchBox from './SearchBox';

const Tab = (props) => {
  // {paneWidth, title, image, text, fullText}
  const handleClick = () => {
    props.chooseView(props.view);
  };

  let highlight = props.views.primary == props.view;
  let css = classnames(styles.tab, { [styles.tabHighlight]: highlight });
  return (
    <div className={css} onClick={handleClick}>
      {props.short}
    </div>
  );
};

export default compose(withLocation)(Tab);
