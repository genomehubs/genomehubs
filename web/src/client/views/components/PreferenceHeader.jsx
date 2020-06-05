import React from 'react'
import classnames from 'classnames'
import styles from './Preferences.scss';


const PreferenceHeader = ({onClick}) => {
  return (
    <div className={styles.preferenceHeader}
         onClick={onClick}>
      Options
    </div>
  )
}

export default PreferenceHeader;
