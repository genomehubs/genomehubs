import {
  header as headerStyle,
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  resultPanel as resultPanelStyle,
  title as titleStyle,
} from "./Styles.scss";

import AttributeTable from "./AttributeTable";
import classnames from "classnames";

const AttributePanel = ({
  attributes,
  result,
  taxonId,
  title = "Attributes",
}) => {
  let css = classnames(infoPanelStyle, infoPanel1ColumnStyle, resultPanelStyle);

  return (
    <div className={css}>
      <div className={headerStyle}>
        <span className={titleStyle}>{title}</span>
      </div>
      <div>
        <AttributeTable
          attributes={attributes}
          result={result}
          taxonId={taxonId}
        />
      </div>
    </div>
  );
};

export default AttributePanel;
