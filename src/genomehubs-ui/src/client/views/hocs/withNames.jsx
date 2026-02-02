import { getActiveNameClasses, getNamesMap } from "#selectors/types";

import { connect } from "react-redux";

const withNames = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    activeNameClasses: getActiveNameClasses(state),
    nameClasses: getNamesMap(state),
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withNames;
