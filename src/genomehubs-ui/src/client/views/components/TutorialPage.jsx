import {
  underscoreHigh as underscoreHighStyle,
  underscoreLow as underscoreLowStyle,
  underscoreMedium as underscoreMediumStyle,
  underscore as underscoreStyle,
} from "./Styles.scss";

import Page from "./Page";
import React from "react";
import TextPanel from "./TextPanel";
import classnames from "classnames";

const TutorialPage = ({}) => {
  let direct = classnames(underscoreStyle, underscoreHighStyle);
  let descendant = classnames(underscoreStyle, underscoreMediumStyle);
  let ancestor = classnames(underscoreStyle, underscoreLowStyle);
  let text = (
    <TextPanel view={"tutorials"}>
      <div>
        <p>
          We'll be adding more help and tutorials here soon. To get started, try
          following the example below.
        </p>

        <p>
          Task: To find the best genome size estimate for a new sample about to
          be sequenced. Let's say the sample to be sequenced is{" "}
          <em>
            <b>Heliconius egeria</b>
          </em>
          .
        </p>

        <ol>
          <li>
            On the <b>Home Page</b>, in the main central search box, type{" "}
            <code>Heliconius egeria</code> and press Enter. If there are
            multiple scientific name matches, or if the term is misspelt (e.g.,{" "}
            <code>haliconius egeria</code>), the tool will offer multiple
            suggestions. Click on{" "}
            <b>
              <em>Heliconius egeria</em> - species
            </b>
          </li>
          <li>
            You are now on the <b>Search</b> page which shows you information
            about each species-level descendant of your search for which any
            genome size or chromosome number metadata is available. In this case
            there are no descendants such as subspecies for{" "}
            <em>Heliconius egeria</em>, so only one record is shown.
          </li>
          <li>
            The little boxes show you summary info for each species, and the
            colours indicate whether the estimates are{" "}
            <span className={direct}>direct</span> measurements for that species
            (green), or inferred from{" "}
            <span className={descendant}>descendant</span> (orange) or{" "}
            <span className={ancestor}>ancestral</span> taxa (red), and the{" "}
            <em>n</em> value tells you how many values were used for the
            estimate. For some species, multiple genome assembly versions exist,
            or multiple C value estimates are stored, so <em>n</em> can be
            greater than 1.
          </li>
          <li>
            To see more than just a little boxed summary, click on{" "}
            <b>Records</b> in the top menu. The full raw data table for each
            species in our database will be shown.
          </li>
          <li>
            In the <b>Records</b> view, there is a single{" "}
            <span className={direct}>direct</span> value for chromosome_number -
            i.e. it was measured for that species. Clicking on the arrow next to{" "}
            <span className={direct}>direct</span> (with a green underline)
            takes you to the source of this value
          </li>
          <li>
            The remaining estimates for C value and genome size are indirect,
            and are estimated based on the{" "}
            <span className={ancestor}>ancestor</span> (underlined in red) of
            <em>Heliconius egeria</em>, i.e., the genus <em>Heliconius</em>,
            which has 2 <span className={direct}>direct</span> values for the
            genus as a whole.
          </li>
          <li>
            Therefore the best estimates for <em>Heliconius egeria</em> are:
            <ul>
              <li>
                chromosome number: <code>21</code>
              </li>
              <li>
                genome size: <code>347 Mb</code>
              </li>
              <li>
                C value: <code>0.355</code>
              </li>
            </ul>
          </li>
          <li>
            To double check that the estimates are not an outlier, you should
            click on <b>Explore</b> - which lets you see each estimate for each
            level of the taxonomy, e.g., genus, family, order, etc.
          </li>
        </ol>
      </div>
    </TextPanel>
  );
  return <Page searchBox text={text} />;
};

export default TutorialPage;
