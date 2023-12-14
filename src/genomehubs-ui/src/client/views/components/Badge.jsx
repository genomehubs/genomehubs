import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "@reach/router";

import BadgeInfo from "./BadgeInfo";
import BadgeStats from "./BadgeStats";
import Count from "./Count";
import PhyloPics from "./PhyloPics";
import classnames from "classnames";
import { compose } from "recompose";
import fetchDescendantTaxIds from "../functions/fetchDescendantTaxIds";
import styles from "./Styles.scss";
import withDescendantsById from "../hocs/withDescendantsById";
import withRecordById from "../hocs/withRecordById";
import withSiteName from "../hocs/withSiteName";
import withTaxonomy from "../hocs/withTaxonomy";

// import withSearch from "../hocs/withSearch";

export const Badge = ({
  currentRecordId,
  fetchRecord,
  recordById,
  maskParentElement,
  descendantsById,
  fetchDescendants,
  result,
  taxonomy,
  basename,
}) => {
  let scientificName, lineage, rank;
  const navigate = useNavigate();

  const imgRef = useRef(null);
  const badgeRef = useRef(null);
  const [height, setHeight] = useState(0);
  const [badgeCss, setBadgeCss] = useState(styles.badge);
  const [showStats, setShowStats] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [browseDiv, setBrowseDiv] = useState(null);

  useEffect(() => {
    imgRef.current && setHeight(imgRef.current.clientHeight * 0.875);
  });
  useEffect(() => {
    if (currentRecordId && !recordById) {
      fetchRecord(currentRecordId, result, taxonomy || "ncbi");
      fetchDescendants({
        taxonId: currentRecordId,
        taxonomy: taxonomy || "ncbi",
      });
    }
  }, [currentRecordId]);

  useEffect(() => {
    let isApiSubscribed = true;

    // if (!descendantsById && !descendantsIsFetching) {
    //   fetchDescendants({
    //     taxonId: currentRecordId,
    //     taxonomy: taxonomy || "ncbi",
    //   });
    // }

    // fetchDescendantTaxIds({ recordId: currentRecordId }).then((response) => {
    //   if (isApiSubscribed) {
    //     setBrowseDiv(
    //       <>
    //         {response.map((taxonId) => (
    //           <Badge
    //             key={taxonId}
    //             currentRecordId={taxonId}
    //             {...{
    //               records,
    //               recordIsFetching,
    //               fetchRecord,
    //               result,
    //               taxonomy,
    //             }}
    //           />
    //         ))}
    //       </>
    //     );
    //   }
    // });
    return () => {
      // cancel the subscription
      isApiSubscribed = false;
    };
  }, [currentRecordId]);

  if (recordById) {
    ({
      scientific_name: scientificName,
      lineage,
      taxon_rank: rank,
    } = recordById.record);
  }

  if (!scientificName) {
    <div className={badgeCss} ref={badgeRef}>
      <div className={styles.bg}></div>
    </div>;
  }

  const toggleStats = () => {
    setShowStats(!showStats);
    setShowInfo(false);
  };

  const toggleInfo = () => {
    setShowStats(false);
    setShowInfo(!showInfo);
  };

  const toggleBrowse = () => {
    if (!showBrowse) {
      // console.log(badgeRef.current.parentNode.style);
      // if (setParentCss) {
      //   setParentCss(
      //     classnames(styles.badge, styles.badgeExpanded, styles.badgeLast)
      //   );
      // }
      setBadgeCss(classnames(styles.badge, styles.badgeExpanded));
      setBrowseDiv(
        <>
          {descendantsById.map(({ result: descendant }, i) => (
            <WrappedBadge
              key={descendant.taxon_id}
              currentRecordId={descendant.taxon_id}
              maskParentElement={i == descendantsById.length - 1}
              {...{
                // records,
                // recordIsFetching,
                // fetchDescendants,
                // fetchRecord,
                result,
                taxonomy,
              }}
            />
          ))}
        </>
      );
    } else {
      setBadgeCss(styles.badge);
      // if (setParentCss) {
      //   setParentCss(classnames(styles.badge, styles.badgeExpanded));
      // }
    }
    setShowBrowse(!showBrowse);
  };

  let statsDiv = showStats && (
    <BadgeStats
      currentRecordId={currentRecordId}
      currentRecord={recordById}
      scientificName={scientificName}
      taxonomy={taxonomy}
      result={result}
      rank={rank}
    />
  );

  let infoDiv = showInfo && (
    <BadgeInfo
      currentRecordId={currentRecordId}
      currentRecord={recordById}
      scientificName={scientificName}
      taxonId={currentRecordId}
      taxonomy={taxonomy}
      result={result}
      rank={rank}
    />
  );

  return (
    <div className={badgeCss} ref={badgeRef}>
      <div className={styles.bg}>
        <div ref={imgRef} className={styles.img}>
          {recordById && (
            <PhyloPics
              currentRecord={recordById}
              maxHeight={height}
              fixedRatio={1}
            />
          )}
        </div>
        <div className={styles.rank}>{rank}</div>
        <div className={styles.id}>{currentRecordId}</div>
        <div className={styles.name}>{scientificName}</div>
        <div className={styles.links}>
          {descendantsById && descendantsById.length > 0 ? (
            <a
              onClick={toggleBrowse}
              className={(showBrowse && styles.active) || ""}
            >
              browse
            </a>
          ) : (
            <a className={styles.disabled}>browse</a>
          )}
          <a
            onClick={toggleStats}
            className={(showStats && styles.expanded) || ""}
          >
            stats
          </a>
          <a
            onClick={toggleInfo}
            className={(showInfo && styles.expanded) || ""}
          >
            info
          </a>
          <a
            onClick={() =>
              navigate(
                `${basename}/search?query=tax_tree%28${scientificName}%5B${currentRecordId}%5D%29&includeEstimates=false&taxonomy=${taxonomy}&result=${result}`
              )
            }
          >
            search
          </a>
        </div>
      </div>
      {maskParentElement && <div className={styles.maskParent}></div>}
      {statsDiv && <div className={styles.nested}>{statsDiv}</div>}
      {infoDiv && <div className={styles.nested}>{infoDiv}</div>}
      {showBrowse && <div className={styles.nestedBadge}>{browseDiv}</div>}
    </div>
  );
};

const WrappedBadge = compose(
  withSiteName,
  withTaxonomy,
  withRecordById,
  withDescendantsById
)(Badge);

export default WrappedBadge;
