import { getActiveRanks, taxonomyRanks } from "#selectors/types";

import { connect } from "react-redux";

const withRanks = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    activeRanks: getActiveRanks(state),
    taxonomyRanks,
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withRanks;
