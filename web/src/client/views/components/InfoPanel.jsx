import React from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import withPanes from '../hocs/withPanes';
import styles from './Styles.scss';
import SearchBox from './SearchBox';
import InfoPane from './InfoPane';

const InfoPanel = (props) => {
  let css = classnames(styles.flexRow, styles.infoPanel)
  let infoPanes = props.panes.map((pane, i) => {
    return (
      <InfoPane id={pane.id}
                key={pane.id}
                paneWidth={props.paneWidth}
                title={pane.title}
                image={pane.image}
                text={pane.text}
                fullText={pane.fullText} />
    )
  });
  return (
    <div className={css}>
      {infoPanes}
    </div>
  )
}

export default compose(
  withPanes
)(InfoPanel);
