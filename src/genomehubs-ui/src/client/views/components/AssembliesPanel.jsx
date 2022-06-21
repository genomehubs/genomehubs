import React, { useEffect } from "react";

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import classnames from "classnames";
import { compose } from "recompose";
import qs from "qs";
import styles from "./Styles.scss";

const AssembliesPanel = ({ recordId, result, taxonomy }) => {
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel
  );

  // TODO: Add lookup to link assemblies to samples
  let content = (
    <>
      This feature is under development. <br /> A list of assemblies for this
      sample will be shown here.
    </>
  );

  return (
    <div className={css}>
      <div className={styles.header}>
        <span className={styles.title}>Assemblies</span>
      </div>
      <div>{content}</div>
    </div>
  );
};

export default compose()(AssembliesPanel);
