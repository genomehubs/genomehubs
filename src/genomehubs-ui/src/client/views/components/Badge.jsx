import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "@reach/router";

import BadgeInfo from "./BadgeInfo";
import BadgeStats from "./BadgeStats";
import Count from "./Count";
import PhyloPics from "./PhyloPics";
import classNames from "classnames";
import classnames from "classnames";
import { compose } from "recompose";
import styles from "./Styles.scss";
// import useScrollPosition from "../hooks/useScrollPosition";
import withBrowse from "../hocs/withBrowse";
import withDescendantsById from "../hocs/withDescendantsById";
import withRecordById from "../hocs/withRecordById";
import withSiteName from "../hocs/withSiteName";
import withTaxonomy from "../hocs/withTaxonomy";

const setScrollPosition = (scrollY) => {
  setTimeout(() => {
    window.scrollTo({ top: scrollY });
    if (window.scrollY < scrollY) {
      setScrollPosition(scrollY);
    }
  }, 250);
};

const updateScrollPosition = (browse) => {
  if (
    browse.scrollY &&
    window.scrollY == 0 &&
    window.scrollY != browse.scrollY
  ) {
    setScrollPosition(browse.scrollY);
  }
};

export const Badge = ({
  recordId,
  currentRecordId,
  setRecordId,
  fetchRecord,
  recordIsFetching,
  recordById,
  maskParentElement,
  descendantsById,
  fetchDescendants,
  browse,
  parents,
  setBrowse,
  updateBrowseStatus,
  depth,
  rank: targetRank,
  result,
  taxonomy,
  basename,
}) => {
  let scientificName, lineage, rank;
  let topLevel = !parents;
  parents = parents || browse;
  const navigate = useNavigate();

  const imgRef = useRef(null);
  const badgeRef = useRef(null);
  const [height, setHeight] = useState(0);
  const [badgeCss, setBadgeCss] = useState(styles.badge);
  const [showStats, setShowStats] = useState(
    browse[currentRecordId] && browse[currentRecordId].stats
  );
  const [showInfo, setShowInfo] = useState(
    browse[currentRecordId] && browse[currentRecordId].info
  );
  const [showBrowse, setShowBrowse] = useState(
    browse[currentRecordId] && browse[currentRecordId].browse
  );
  const [browseDiv, setBrowseDiv] = useState(null);
  // const scrollPosition = useScrollPosition();

  const expandBrowseDiv = () => {
    setBadgeCss(classnames(styles.badge, styles.badgeExpanded));
    if (descendantsById) {
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
                parents: {
                  ...parents,
                  ...(descendantsById && {
                    [currentRecordId]: { browse: true },
                  }),
                },
                result,
                taxonomy,
              }}
            />
          ))}
        </>
      );
    } else {
      setShowBrowse(false);
    }
  };

  const updateBrowse = (parents) => {
    setRecordId(currentRecordId);
    // setBrowse({ ...parents, scrollY: window.scrollY });
  };

  useEffect(() => {
    if (currentRecordId && recordById) {
      imgRef.current && setHeight(imgRef.current.clientHeight * 0.875);
      updateScrollPosition(browse);
      if (browse[currentRecordId]) {
        if (browse[currentRecordId].browse) {
          expandBrowseDiv();
        } else if (browse[currentRecordId].stats) {
          setShowStats(true);
        } else if (browse[currentRecordId].info) {
          setShowInfo(true);
        }
      }
    }
  }, [descendantsById]);
  useEffect(() => {
    let isMounted = true;
    if (currentRecordId && !recordById && !recordIsFetching) {
      setTimeout(() => {
        if (isMounted) {
          fetchRecord(currentRecordId, result, taxonomy || "ncbi");
          fetchDescendants({
            taxonId: currentRecordId,
            taxonomy: taxonomy || "ncbi",
            depth,
            rank: targetRank,
          });
        }
      }, 50);
    }
    return () => {
      isMounted = false;
      if (topLevel) {
        let { scrollY } = window;
        // window.scrollTo({ top: 0 });
        setBrowse({ ...parents, scrollY });
      }
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
    if (recordById) {
      return null;
    }
    <div className={badgeCss} ref={badgeRef}>
      <div className={styles.bg}></div>
    </div>;
  }

  if (currentRecordId && targetRank && !parents[currentRecordId]) {
    parents[currentRecordId] = { browse: true };
  }

  // if (targetRank && currentRecordId && recordById) {

  // }

  const toggleStats = () => {
    if (!parents[currentRecordId]) {
      parents[currentRecordId] = {};
    }
    setShowInfo(false);
    parents[currentRecordId].info = false;
    parents[currentRecordId].stats = !parents[currentRecordId].stats;
    setShowStats(!showStats);
    updateBrowseStatus(currentRecordId, parents[currentRecordId]);
  };

  const toggleInfo = () => {
    if (!parents[currentRecordId]) {
      parents[currentRecordId] = {};
    }
    setShowStats(false);
    parents[currentRecordId].stats = false;
    parents[currentRecordId].info = !parents[currentRecordId].info;
    setShowInfo(!showInfo);
    updateBrowseStatus(currentRecordId, parents[currentRecordId]);
  };

  const toggleBrowse = (recordId) => {
    if (!parents[recordId]) {
      parents[recordId] = {};
    }
    if (!showBrowse) {
      expandBrowseDiv();
    } else {
      setBadgeCss(styles.badge);
    }
    parents[recordId].browse = !parents[recordId].browse;
    setShowBrowse(!showBrowse);
    updateBrowseStatus(currentRecordId, parents[currentRecordId]);
  };

  let statsDiv = showStats && (
    <BadgeStats
      currentRecordId={currentRecordId}
      currentRecord={recordById}
      scientificName={scientificName}
      setBrowse={() =>
        updateBrowse({
          ...parents,
          [currentRecordId]: {
            ...(parents[currentRecordId] || {}),
            stats: true,
          },
        })
      }
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
      setBrowse={() =>
        updateBrowse({
          ...parents,
          [currentRecordId]: {
            ...(parents[currentRecordId] || {}),
            info: true,
          },
        })
      }
      taxonomy={taxonomy}
      result={result}
      rank={rank}
    />
  );

  return (
    <div style={{ position: "relative" }}>
      <div className={badgeCss} ref={badgeRef}>
        <div
          className={
            currentRecordId == recordId
              ? classNames(styles.bg, styles.current)
              : styles.bg
          }
        >
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
                onClick={() => toggleBrowse(currentRecordId)}
                className={(showBrowse && styles.active) || ""}
              >
                browse
              </a>
            ) : (
              <a className={styles.disabled}>browse</a>
            )}
            <a
              onClick={toggleStats}
              className={
                showStats
                  ? styles.expanded
                  : scientificName
                  ? ""
                  : styles.disabled
              }
            >
              stats
            </a>
            <a
              onClick={toggleInfo}
              className={
                showInfo
                  ? styles.expanded
                  : scientificName
                  ? ""
                  : styles.disabled
              }
            >
              info
            </a>
            <a
              onClick={() => {
                navigate(
                  `${basename}/search?query=tax_tree%28${scientificName}%5B${currentRecordId}%5D%29&includeEstimates=false&taxonomy=${taxonomy}&result=${result}`
                );
                updateBrowse({
                  ...parents,
                  // [currentRecordId]: {
                  //   ...(parents[currentRecordId] || {}),
                  //   browse: true,
                  // },
                });
              }}
              className={scientificName ? "" : styles.disabled}
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
    </div>
  );
};

const WrappedBadge = compose(
  withSiteName,
  withTaxonomy,
  withRecordById,
  withDescendantsById,
  withBrowse
)(Badge);

export default WrappedBadge;
