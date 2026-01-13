import {
  getSearchIndex,
  getSearchIndexPlural,
  setSearchIndex,
} from "#reducers/search";

import { connect } from "react-redux";

const withSearchIndex = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    searchIndex: getSearchIndex(state),
    searchIndexPlural: getSearchIndexPlural(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    setSearchIndex: (index) => dispatch(setSearchIndex(index)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withSearchIndex;
