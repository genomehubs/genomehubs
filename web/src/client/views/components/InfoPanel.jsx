import React from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import styles from './Styles.scss';
import SearchBox from './SearchBox';
import InfoPane from './InfoPane';

const InfoPanel = (props) => {
  let css = classnames(
    styles.flexRow,
    styles.infoPanel,
    styles[`infoPanel${props.cols}Column`]
  );
  let infoPanes = props.panes.map((pane, i) => {
    return <InfoPane id={pane.id} key={pane.id} {...pane} />;
  });
  return <div className={css}>{infoPanes}</div>;
};

export default InfoPanel;
