import React, { useRef } from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import useResize from '../hooks/useResize';
import withLocation from '../hocs/withLocation';
import withPanes from '../hocs/withPanes';
import styles from './Styles.scss';
import SearchBox from './SearchBox';
import InfoPanel from './InfoPanel';

const Landing = (props) => {
  let css = classnames(styles.landing, styles.flexCenter, styles.flexCenterHorizontal)
  const componentRef = useRef()
  const { width, height } = useResize(componentRef)
  let firstPanel
  let morePanels;
  if (props.panes.length > 0){
    let count = Math.min(Math.floor(width / 350),3);
    if (count > 1){
      morePanels = []
      let paneWidth = width / (count+1)
      firstPanel = <InfoPanel panes={props.panes.slice(0,count)} paneWidth={paneWidth}/>
      for (let i = count; i < props.panes.length; i+=count){
        morePanels.push(<InfoPanel key={i} panes={props.panes.slice(i,i+count)} paneWidth={paneWidth}/>)
      }
    }
  }

  return (
    <div ref={componentRef} className={css}>
      {firstPanel}
      <SearchBox/>
      {morePanels}
    </div>
  )
}

export default compose (
  withLocation,
  withPanes
)(Landing);
