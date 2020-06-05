import React, { useRef } from 'react';
import { compose } from 'recompose';
import classnames from 'classnames';
import useResize from '../hooks/useResize';
import styles from './Styles.scss';
import SearchBox from './SearchBox';
import InfoPanel from './InfoPanel';

const Landing = () => {
  let css = classnames(styles.landing, styles.flexCenter, styles.flexCenterHorizontal)
  const componentRef = useRef()
  const { width, height } = useResize(componentRef)
  let count = Math.min(Math.floor(width / 350),3);
  let firstPanel
  let morePanels = [];
  if (count > 1){
    let paneWidth = width / (count+1)
    firstPanel = <InfoPanel count={count} offset={0} paneWidth={paneWidth}/>
    for (let i = count; i < 6; i+=count){
      morePanels.push(<InfoPanel key={i} count={count} offset={i} paneWidth={paneWidth}/>)
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

export default Landing;
