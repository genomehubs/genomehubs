import BoatLogo from "./LogoBoat";
import BtkLogo from "./LogoBtk";
import GoatLogo from "./LogoGoat";
import Grid from "@mui/material/Grid2";
import MdbLogo from "./LogoMolluscDB";
import React from "react";
import { compose } from "recompose";
import { fixedArSixteenNine as fixedArSixteenNineStyle } from "./Styles.scss";
import withColors from "../hocs/withColors";
import withTheme from "../hocs/withTheme";

const MemoizedGoatLogo = React.memo(GoatLogo);
const MemoizedBoatLogo = React.memo(BoatLogo);
const MemoizedBtkLogo = React.memo(BtkLogo);
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
    MemoizedGoatLogo,
    MemoizedBoatLogo,
    MemoizedBtkLogo,
    MemoizedMdbLogo,
    MemoizedGoatLogo,
    MemoizedBoatLogo,
  ];

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Grid
        container
        spacing={1}
        style={{
          maxHeight: "50vw",
          maxWidth: "66.67vh",
          minHeight: "30em",
          minWidth: "45em",
          overflow: "auto",
        }}
        className={fixedArSixteenNineStyle}
      >
        {logos.map((Logo, index) => (
          <Grid
            size={4}
            key={index}
            style={{
              cursor: "pointer",
              border: "0.5em solid rgba(255,255,255, 0.2)",
              // minWidth: "10em",
              // minHeight: "10em",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: "3em",
              overflow: "hidden",
            }}
            onMouseOver={() => handleMouseOver(index)}
            onMouseOut={() => handleMouseOut(index)}
          >
            <Logo
              animate={animate[index]}
              delay={0}
              lineColor={animate[index] ? highlightColor : lightColor}
              backgroundColor={darkColor}
            />
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default compose(withColors, withTheme)(LogoPage);
