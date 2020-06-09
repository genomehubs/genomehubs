import React from 'react';
import { connect } from 'react-redux';
import { getViews,
         chooseView,
         getParsedQueryString,
         getHashString } from '../reducers/location';

const withLocation = WrappedComponent => props => {

  const mapStateToProps = state => (
    { views: getViews(state),
      qs: getParsedQueryString(state),
      hash: getHashString(state)
    }
  )

  const mapDispatchToProps = dispatch => (
    { chooseView: (view) => dispatch(chooseView(view)) }
  )

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent)
  return <Connected {...props}/>

}

export default withLocation
