import React from 'react';
import { connect } from 'react-redux';
import { choosePanes } from '../reducers/panes';

const withPanes = WrappedComponent => props => {

  const mapStateToProps = state => (
    { panes: choosePanes(state, props.count, props.offset) }
  )

  const Connected = connect(
    mapStateToProps
  )(WrappedComponent)
  return <Connected {...props}/>

}

export default withPanes
