import Page from "./Page";
import TextPanel from "./TextPanel";
import { pagesUrl } from "#selectors/pages";

const GenericPage = ({ pageId, ...props }) => {
  if (!pageId) {
    pageId = props.path.replace(pagesUrl, "").replace("*", props["*"]);
    pageId += ".md";
  }
  let text = <TextPanel pageId={pageId} />;
  return <Page searchBox text={text} />;
};

export default GenericPage;
