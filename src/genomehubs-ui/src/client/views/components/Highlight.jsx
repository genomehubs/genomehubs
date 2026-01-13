import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { github } from "react-syntax-highlighter/dist/esm/styles/hljs";
import markdown from "react-syntax-highlighter/dist/esm/languages/hljs/markdown";

SyntaxHighlighter.registerLanguage("markdown", markdown);

const Highlight = ({ children }) => {
  if (Array.isArray(children)) {
    children = children[0];
  }
  return (
    <SyntaxHighlighter language="markdown" style={github} wrapLongLines={true}>
      {children.props.children[0].replace(/\s+$/, "")}
    </SyntaxHighlighter>
  );
};

export default Highlight;
