import BoatLogo from "./LogoBoat";
import BtkLogo from "./LogoBtk";
import GoatLogo from "./LogoGoat";
import Grid from "@mui/material/Grid";
import IsodbLogo from "./LogoIsopoDB";
import LepbaseLogo from "./LogoLepbase";
import MdbLogo from "./LogoMolluscDB";
import React from "react";
import Tooltip from "./Tooltip";
import { compose } from "redux";
import { fixedArSixteenNine as fixedArSixteenNineStyle } from "./Styles.scss";
import withColors from "#hocs/withColors";
import withTheme from "../hocs/withTheme";

const MemoizedGoatLogo = React.memo(GoatLogo);
const MemoizedBoatLogo = React.memo(BoatLogo);
const MemoizedBtkLogo = React.memo(BtkLogo);
const MemoizedIsodbLogo = React.memo(IsodbLogo);
const MemoizedLepbaseLogo = React.memo(LepbaseLogo);
const MemoizedMdbLogo = React.memo(MdbLogo);

export const LogoPage = ({ colorScheme, theme }) => {
  const [animate, setAnimate] = React.useState(Array(6).fill(false));

  let {
    headerBackground: darkColor,
    highlightColor,
    headerText: lightColor,
  } = colorScheme[theme];

  const handleMouseOver = (index) => {
    setAnimate((prevAnimate) => {
      const newAnimate = [...prevAnimate];
      newAnimate[index] = true;
      return newAnimate;
    });
  };

  const handleMouseOut = (index) => {
    setAnimate((prevAnimate) => {
      const newAnimate = [...prevAnimate];
      newAnimate[index] = false;
      return newAnimate;
    });
  };

  const logos = [
    {
      logo: MemoizedGoatLogo,
      title: "GoaT",
      description: "Explore Genomes on a Tree with GoaT",
      url: "https://goat.genomehubs.org",
    },
    {
      logo: MemoizedBoatLogo,
      title: "BoaT",
      description: "Explore BUSCOs on a Tree with BoaT",
      url: "https://boat.genomehubs.org",
    },
    {
      logo: MemoizedBtkLogo,
      title: "BlobToolKit",
      description: "View assemblies in the BlobToolKit viewer",
      url: "https://blobtoolkit.genomehubs.org/view",
    },
    {
      logo: MemoizedMdbLogo,
      title: "MolluscDB",
      description: "Browse and compare Mollusc genome features",
      url: "https://molluscdb.genomehubs.org",
    },
    {
      logo: MemoizedLepbaseLogo,
      title: "LepBase",
      description: "Updated site coming soon",
    },
    {
      logo: MemoizedIsodbLogo,
      title: "IsopoDB",
      description: "Coming soon",
    },
  ];

  return (
    <div
      style={{
        height: "100%",
        minHeight: "calc(100vh - 7em)",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Grid container direction={"column"} spacing={0}>
        <Grid style={{ textAlign: "center" }}>
          <h2>Take a look at our other GenomeHubs sites:</h2>
        </Grid>
        <Grid
          container
          spacing={2}
          style={{
            maxHeight: "50vw",
            maxWidth: "66.67vh",
            minHeight: "30em",
            minWidth: "45em",
            overflow: "auto",
          }}
          className={fixedArSixteenNineStyle}
        >
          {logos.map(({ logo: Logo, title, description, url }, index) => (
            <Grid
              size={4}
              key={index}
              style={{
                cursor: url ? "pointer" : "auto",
                // border: "0.5em solid rgba(255,255,255, 0.2)",
                // minWidth: "10em",
                // minHeight: "10em",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "3em",
                overflow: "hidden",
                position: "relative",
                backgroundColor: darkColor,
                opacity: url ? 1 : 0.75,
              }}
              onMouseOver={() => handleMouseOver(index)}
              onMouseOut={() => handleMouseOut(index)}
              onClick={() => {
                if (url) {
                  window.open(url, "_blank", "noopener,noreferrer");
                }
              }}
            >
              <Logo
                animate={animate[index]}
                delay={0}
                lineColor={animate[index] ? highlightColor : lightColor}
                backgroundColor={darkColor}
                strokeColor={lightColor}
              />
              <div
                style={{
                  position: "absolute",
                  textAlign: "center",
                  height: "1.5em",
                  width: "100%",
                  bottom: 0,
                  left: 0,
                  color: animate[index] ? highlightColor : lightColor,
                  fontSize: "1.5em",
                  fontWeight: "bold",
                  textShadow: `2px 2px 4px ${darkColor}`,
                  backgroundColor: `${darkColor}99`,
                }}
              >
                {title}
              </div>
            </Grid>
          ))}
        </Grid>
        <Grid style={{ textAlign: "center" }}>
          <i style={{ display: "block", padding: "1em 0" }}>
            An updated LepBase and initial IsopoDB release will be coming
            soon...
          </i>
        </Grid>
      </Grid>
    </div>
  );
};

export default compose(withColors, withTheme)(LogoPage);
