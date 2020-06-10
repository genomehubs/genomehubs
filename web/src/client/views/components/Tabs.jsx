import React from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import withFadeInOut from '../hocs/withFadeInOut';
import withLocation from '../hocs/withLocation';
import withPanes from '../hocs/withPanes';
import styles from './Styles.scss';
import Tab from './Tab';

const Tabs = (props) => {
  // if (props.views.primary == 'landing') {
  //   return null;
  // }

  let css = classnames(styles.tabHolder);
  let tabs = props.panes.map((pane) => <Tab key={pane.short} {...pane} />);

  return <div className={css}>{tabs}</div>;
};

export default compose(
  withLocation,
  withPanes
  // withFadeInOut,
)(Tabs);
