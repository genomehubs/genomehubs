import BadgeInfo, { BadgeInfoCell } from "./BadgeInfo";
import React, { useEffect, useRef, useState } from "react";

import BadgeStats from "./BadgeStats";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import PhyloPics from "./PhyloPics";
import classNames from "classnames";
import classnames from "classnames";
import { compose } from "recompose";
import styles from "./Styles.scss";
import { useNavigate } from "@reach/router";
import withBrowse from "../hocs/withBrowse";
import withDescendantsById from "../hocs/withDescendantsById";
import withRecordById from "../hocs/withRecordById";
import withSiteName from "../hocs/withSiteName";
import withTaxonomy from "../hocs/withTaxonomy";

const setScrollPosition = (scrollY, status) => {
  setTimeout(() => {
    if (status.isMounted) {
      window.scrollTo({ top: scrollY });
      if (window.scrollY < scrollY) {
        setScrollPosition(scrollY, status);
      }
    }
  }, 250);
};

const updateScrollPosition = (browse, status) => {
  if (
    browse.scrollY &&
    window.scrollY == 0 &&
    window.scrollY != browse.scrollY
  ) {
    setScrollPosition(browse.scrollY, status);
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
  parentFieldName,
  setParentFieldName,
  updateBrowseStatus,
  depth,
  nestingLevel = 0,
  rank: targetRank,
  size,
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
  const [fieldName, setFieldName] = useState(parentFieldName);
  const setCurrentFieldName = setParentFieldName
    ? (f) => {
        setParentFieldName(f);
        setFieldName(f);
      }
    : setFieldName;

  const fetchMoreDescendants = ({ size, offset, depth }) => {
    fetchDescendants({
      taxonId: currentRecordId,
      taxonomy: taxonomy || "ncbi",
      depth,
      rank: targetRank,
      size,
      offset,
    });
  };

  const expandBrowseDiv = () => {
    setBadgeCss(classnames(styles.badge, styles.badgeExpanded));
    if (descendantsById && descendantsById.results) {
      let badges = descendantsById.results.map(({ result: descendant }, i) => (
        <WrappedBadge
          key={descendant.taxon_id}
          currentRecordId={descendant.taxon_id}
          maskParentElement={i == descendantsById.count - 1}
          {...{
            parents: {
              ...parents,
              ...(descendantsById && {
                [currentRecordId]: { browse: true },
              }),
            },
            parentFieldName: fieldName,
            setParentFieldName: setCurrentFieldName,
            nestingLevel: nestingLevel + 1,
            result,
            taxonomy,
          }}
        />
      ));
      let links = [];

      if (descendantsById.count > descendantsById.results.length) {
        let difference = descendantsById.count - descendantsById.results.length;
        if (difference > 10) {
          links.push(
            <a
              onClick={() => {
                let { scrollY } = window;
                fetchMoreDescendants({
                  offset: descendantsById.results.length,
                  size: 10,
                  depth: descendantsById.depth,
                });

                setBrowse({ ...parents, scrollY });
              }}
            >
              +10
            </a>
          );
          if (difference > 100) {
            links.push(
              <a
                onClick={() => {
                  let { scrollY } = window;
                  fetchMoreDescendants({
                    offset: descendantsById.results.length,
                    size: 100,
                    depth: descendantsById.depth,
                  });

                  setBrowse({ ...parents, scrollY });
                }}
              >
                +100
              </a>
            );
          }
        }
        links.push(<a>show all</a>);

        badges.push(
          <div style={{ position: "relative" }} key={"showMore"}>
            <div className={badgeCss} ref={badgeRef}>
              <div
                className={styles.bg}
                onClick={() => {
                  if (links.length == 0) {
                    return;
                  }
                  let { scrollY } = window;
                  fetchMoreDescendants({
                    offset: descendantsById.results.length,
                    size: difference,
                    depth: descendantsById.depth,
                  });

                  setBrowse({ ...parents, scrollY });
                }}
              >
                <div ref={imgRef} className={styles.img}>
                  <MoreHorizIcon
                    preserveAspectRatio="xMidYMin"
                    style={{ fontSize: "3em" }}
                  />
                </div>
                <div className={styles.rank}></div>
                <div className={styles.id}></div>
                <div className={styles.name}>{`${difference} tax${
                  difference > 0 ? "a" : "on"
                } not shown`}</div>
                <div className={styles.links}>{links}</div>
              </div>
              <div className={styles.maskParent}></div>
            </div>
          </div>
        );
      }
      setBrowseDiv(<>{badges}</>);
    } else {
      setShowBrowse(false);
    }
  };

  const updateBrowse = (parents) => {
    setTimeout(() => {
      setRecordId(currentRecordId);
      window.scrollTo({ top: 0 });
    }, 50);
  };

  useEffect(() => {
    let status = { isMounted: true };
    updateScrollPosition(browse, status);
    if (currentRecordId && recordById) {
      imgRef.current && setHeight(imgRef.current.clientHeight * 0.875);
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
    return () => {
      if (topLevel) {
        status.isMounted = false;
        let { scrollY } = window;
        setBrowse({ ...parents, scrollY });
      }
    };
  }, [descendantsById, fieldName]);
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
            size,
          });
        }
      }, 50);
    }
    return () => {
      isMounted = false;
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

  const toggleStats = (e) => {
    e.stopPropagation();
    if (!parents[currentRecordId]) {
      parents[currentRecordId] = {};
    }
    setShowInfo(false);
    parents[currentRecordId].info = false;
    parents[currentRecordId].stats = !parents[currentRecordId].stats;
    setShowStats(!showStats);
    updateBrowseStatus(currentRecordId, parents[currentRecordId]);
  };

  const toggleInfo = (e) => {
    e.stopPropagation();
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
      fieldName={fieldName}
      setFieldName={setCurrentFieldName}
      taxonomy={taxonomy}
      result={result}
      rank={rank}
    />
  );

  let badgeInfoDiv;
  if (recordById && fieldName && recordById.record.attributes[fieldName]) {
    let field = recordById.record.attributes[fieldName];
    badgeInfoDiv = (
      <div
        className={styles.mainInfo}
        // style={{
        //   left: `calc(100% + ${Math.max(10.35 - nestingLevel, 0.35)}em)`,
        // }}
      >
        <div className={styles.badgeInfo}>
          <BadgeInfoCell
            {...{
              field,
              fieldName,
              result,
              tipTitle: `Click to search ${fieldName} values for ${scientificName}`,
              handleClick: () => {
                navigate(
                  `${basename}/search?query=tax_tree%28${scientificName}%5B${currentRecordId}%5D%29%20AND%20${fieldName}&fields=${fieldName}&includeEstimates=true&taxonomy=${taxonomy}&result=${result}`
                );
                setBrowse();
              },
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <div className={badgeCss} ref={badgeRef}>
        {badgeInfoDiv}

        <div
          className={
            currentRecordId == recordId
              ? classNames(styles.bg, styles.current)
              : styles.bg
          }
          onClick={() => toggleBrowse(currentRecordId)}
        >
          <div ref={imgRef} className={styles.img}>
            {recordById && (
              <PhyloPics
                currentRecord={recordById}
                maxHeight={height}
                hoverHeight={height * 2}
                fixedRatio={1}
                showAncestral={false}
                sourceColors={false}
              />
            )}
          </div>
          <div className={styles.rank}>{rank}</div>
          <div className={styles.id}>{currentRecordId}</div>
          <div className={styles.name}>{scientificName}</div>
          <div className={styles.links}>
            {descendantsById &&
            descendantsById.results &&
            descendantsById.count > 0 ? (
              <a
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBrowse(currentRecordId);
                }}
                className={(showBrowse && styles.active) || ""}
              >
                expand
              </a>
            ) : (
              <a className={styles.disabled}>expand</a>
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
              values
            </a>
            <a
              onClick={(e) => {
                e.stopPropagation();
                navigate(
                  `${basename}/search?query=tax_tree%28${scientificName}%5B${currentRecordId}%5D%29&includeEstimates=true&taxonomy=${taxonomy}&result=${result}`
                );
                updateBrowse({
                  ...parents,
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
