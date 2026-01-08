import { Box, IconButton, Slide } from "@mui/material";
import React, { forwardRef, useRef, useState } from "react";

import FullscreenIcon from "@mui/icons-material/Fullscreen";
import Grid from "@mui/material/Grid";

const FullScreenGridCell = forwardRef(({ children, ...props }, ref) => {
  const [showTopBar, setShowTopBar] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const hoverTimeout = useRef(null);
  const gridRef = useRef(null); // Reference to the Grid element

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => {
      setShowTopBar(true);
    }, 1000); // Show the top bar after 1000ms
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout.current);
    setShowTopBar(false); // Hide the top bar immediately
  };

  const handleFullScreenToggle = () => {
    if (!isFullScreen) {
      // Request full-screen mode
      if (gridRef.current.requestFullscreen) {
        gridRef.current.requestFullscreen();
      } else if (gridRef.current.webkitRequestFullscreen) {
        // Safari
        gridRef.current.webkitRequestFullscreen();
      } else if (gridRef.current.msRequestFullscreen) {
        // IE11
        gridRef.current.msRequestFullscreen();
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      // Safari
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      // IE11
      document.msExitFullscreen();
    }
    setIsFullScreen((prev) => !prev);
  };

  return (
    <Grid
      {...props}
      //   ref={(node) => {
      //     gridRef.current = node; // Attach to internal ref
      //     if (typeof ref === "function") {
      //       ref(node); // Support callback refs
      //     } else if (ref) {
      //       ref.current = node; // Support object refs
      //     }
      //   }}
      ref={gridRef} // Attach to internal ref
      sx={{
        position: "relative",
        // overflow: "hidden",
        //     height: isFullScreen ? "100vh" : "100%",
        //     width: isFullScreen ? "100vw" : "auto",
        zIndex: isFullScreen ? 1300 : "auto", // Ensure full-screen content is on top
        backgroundColor: "background.paper",
        padding: isFullScreen ? "2em 2em 5em 1em" : "0",
        ...props.sx,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Top Bar */}
      <Slide
        direction="down"
        in={showTopBar}
        mountOnEnter
        unmountOnExit
        timeout={300} // Slide animation duration
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "40px",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 8px",
            zIndex: 1400,
          }}
        >
          <IconButton
            onClick={handleFullScreenToggle}
            sx={{ color: "white" }}
            aria-label="Toggle Fullscreen"
          >
            <FullscreenIcon />
          </IconButton>
        </Box>
      </Slide>

      {/* Main Content */}
      <Box
        ref={ref}
        {...props}
        sx={{
          height: "100%",
          width: "100%",
          position: "relative",
        }}
      >
        {children}
      </Box>
    </Grid>
  );
});

export default FullScreenGridCell;
