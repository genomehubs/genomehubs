import Logo from "./LogoMolluscDB";
import React from "react";

export const LogoPage = () => {
  return (
    <div
      style={{
        height: "calc( 100vh - 8em )",
        width: "100vw",
        maxWidth: "100%",
        maxHeight: "100%",
        backgroundColor: "rgb(49, 50, 63)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          height: "calc( 90vh - 8em )",
          width: "calc( 90vh - 8em )",
          maxWidth: "90%",
          maxHeight: "90%",
          backgroundColor: "rgb(49, 50, 63)",
          border: "1em solid rgba(255,255,255, 0.2)",
          boxSizing: "border-box",
        }}
      >
        <Logo animate={true} delay={2} />
      </div>
    </div>
  );
};

export default LogoPage;
