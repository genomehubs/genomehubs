import React from 'react';
import { connect } from 'react-redux';
import { getTheme, setTheme } from '../reducers/color';

const withTheme = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    theme: getTheme(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    setTheme: (theme) => dispatch(setTheme(theme)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withTheme;
