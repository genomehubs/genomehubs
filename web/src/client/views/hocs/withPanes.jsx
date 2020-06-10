import React from 'react';
import { connect } from 'react-redux';
import { getPanes } from '../reducers/panes';

const withPanes = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    panes: getPanes(state),
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withPanes;
