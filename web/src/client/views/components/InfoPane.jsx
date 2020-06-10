import React, { useState } from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import withLocation from '../hocs/withLocation';
import styles from './Styles.scss';
import SearchBox from './SearchBox';

const importAll = (r) => {
  let images = {};
  r.keys().map((item, index) => {
    images[item.replace('./', '')] = r(item).default;
  });
  return images;
};

const images = importAll(require.context('./img', false, /\.(png|jpe?g|svg)$/));

const InfoPane = (props) => {
  const [hover, setHover] = useState(false);
  // {paneWidth, title, image, text, fullText}
  const handleClick = () => {
    props.chooseView(props.view);
  };
  let highlight = props.views.primary == props.view;
  let css = classnames(
    styles.flexCenter,
    styles.flexCenterHorizontal,
    styles.infoPane,
    styles.infoPaneDefault,
    { [styles.infoPaneHighlight]: highlight }
  );
  let placeholder;
  if (props.image) {
    placeholder = props.image;
  } else {
    placeholder = 'placeholder.png';
  }
  let desc_css = classnames(styles.fillParent, styles.infoPaneDescription, {
    [styles.infoPaneHoverReveal]: hover,
  });
  return (
    <div
      className={css}
      onClick={handleClick}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <div className={styles.infoPaneHeader}>{props.title}</div>
      <div
        className={styles.infoPaneContent}
        style={{ backgroundImage: `url(${images[placeholder]})` }}
      >
        <div className={desc_css}>{props.text || ''}</div>
      </div>
    </div>
  );
};

export default compose(React.memo, withLocation)(InfoPane);
