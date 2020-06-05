import React, { useState } from 'react'

const ToggleSwitch = ({id, styles, checked, text, onChange, disabled}) => {
  return (
      <div className={styles.toggleSwitch}>
        <input
          type="checkbox"
          className={styles.toggleSwitchCheckbox}
          name={id}
          id={id}
          checked={checked}
          onChange={()=>{}}
          disabled={disabled}
        />
        <label className={styles.toggleSwitchLabel}
             htmlFor="toggleSwitch"
             onClick={onChange}>
          <span className={styles.toggleSwitchInner +
                           (checked ? ' ' + styles.toggleSwitchInnerChecked : '')}
                data-yes={text[0]}
                data-no={text[1]}/>
              <span className={styles.toggleSwitchSwitch +
                               (checked ? ' ' + styles.toggleSwitchSwitchChecked : '')} />
        </label>
      </div>
    );
}

export default ToggleSwitch;
