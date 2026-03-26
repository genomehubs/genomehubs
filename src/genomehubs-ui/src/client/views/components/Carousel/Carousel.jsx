import React, { useEffect, useRef, useState } from "react";

import Box from "@mui/material/Box";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import IconButton from "@mui/material/IconButton";
import PropTypes from "prop-types";
import Tooltip from "../Tooltip";
import Typography from "@mui/material/Typography";

const parseRatio = (ratio) => {
  if (!ratio) return 16 / 9;
  if (typeof ratio === "number") return ratio;
  if (typeof ratio === "string") {
    const n = parseFloat(ratio);
    if (!Number.isNaN(n)) return n;
  }
  return 16 / 9;
};

const randomColor = () => {
  const h = Math.floor(Math.random() * 360);
  const s = 60 + Math.floor(Math.random() * 20);
  const l = 45 + Math.floor(Math.random() * 10);
  return `hsl(${h} ${s}% ${l}%)`;
};

export default function Carousel({ items, ratio, duration, margin = "1em" }) {
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const timerRef = useRef(null);
  const parsedRatio = parseRatio(ratio);

  // stable placeholder items so empty lists don't regenerate every render
  const [placeholders] = useState(() =>
    Array.from({ length: 3 }).map(() => ({
      img: null,
      href: null,
      title: null,
      description: "This carousel has not been configured",
      tooltip: null,
      _placeholderBg: randomColor(),
    })),
  );

  // track a stable version of content so rapid parent re-creations of the
  // `items` array don't cause the carousel to swap rapidly. We compute a
  // lightweight signature from meaningful fields and only update when it
  // changes.
  const lastItemsSigRef = useRef(null);
  const [stableItems, setStableItems] = useState(() =>
    Array.isArray(items) && items.length > 0 ? items : placeholders,
  );

  useEffect(() => {
    if (Array.isArray(items) && items.length > 0) {
      const sig = items
        .map(
          (it) =>
            `${it.img || ""}|${it.href || ""}|${it.title || ""}|${it.description || ""}`,
        )
        .join(";;");
      if (sig !== lastItemsSigRef.current) {
        lastItemsSigRef.current = sig;
        setStableItems(items);
      }
    } else if (stableItems !== placeholders) {
      lastItemsSigRef.current = null;
      setStableItems(placeholders);
    }
  }, [items, placeholders]);

  const content = stableItems;

  useEffect(() => {
    const effectiveDuration =
      typeof duration === "number" && isFinite(duration) ? duration : 2000;
    const intervalMs = Math.max(1000, effectiveDuration);

    if (hover) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const id = setInterval(() => {
      setIndex((prev) => {
        return (prev + 1) % content.length;
      });
    }, intervalMs);
    timerRef.current = id;
    return () => {
      clearInterval(id);
      timerRef.current = null;
    };
  }, [content.length, duration, hover]);

  // keep index valid if content length changes
  useEffect(() => {
    setIndex((i) => (content.length > 0 ? i % content.length : 0));
  }, [content.length]);

  // (no-op) index/content effect kept for potential future instrumentation
  useEffect(() => {
    // intentionally empty
  }, [index, content]);

  const prev = () => setIndex((i) => (i - 1 + content.length) % content.length);
  const next = () => setIndex((i) => (i + 1) % content.length);

  const current = content[index];

  const tooltipText = (item) => {
    if (item.tooltip) return item.tooltip;
    if (item.href) return `open ${item.href} in a new window`;
    return "";
  };

  return (
    <Box
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setHover(false)}
      tabIndex={0}
      sx={{ width: "100%", position: "relative", margin: `${margin} 0` }}
    >
      <Box
        sx={{
          width: "100%",
          position: "relative",
          overflow: "hidden",
          aspectRatio: `${parsedRatio}`,
          bgcolor:
            current && current._placeholderBg
              ? current._placeholderBg
              : "transparent",
          borderRadius: 1,
        }}
      >
        {/* image or placeholder */}
        {current && current.img ? (
          <Box
            component="img"
            src={current.img}
            alt={current.title || ""}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <Box sx={{ width: "100%", height: "100%" }} />
        )}

        {/* click overlay + tooltip */}
        <Box
          component="a"
          href={current && current.href ? current.href : undefined}
          target={current && current.href ? "_blank" : undefined}
          rel={current && current.href ? "noopener noreferrer" : undefined}
          sx={{
            position: "absolute",
            inset: 0,
            textDecoration: "none",
            color: "inherit",
          }}
          onClick={(e) => {
            if (!current || !current.href) e.preventDefault();
          }}
        >
          {current && (current.tooltip || current.href) ? (
            <Tooltip title={tooltipText(current)}>
              <Box sx={{ width: "100%", height: "100%" }} />
            </Tooltip>
          ) : null}
        </Box>

        {/* description overlay */}
        {current && current.description ? (
          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              p: 1,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)",
              color: "common.white",
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <Typography variant="body2" sx={{ color: "white" }}>
              {current.description}
            </Typography>
          </Box>
        ) : null}

        {/* arrows */}
        <IconButton
          aria-label="previous"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          sx={{
            position: "absolute",
            left: 8,
            top: "50%",
            transform: "translateY(-50%)",
            color: "common.white",
            bgcolor: "rgba(0,0,0,0.25)",
            "&:hover": { bgcolor: "rgba(0,0,0,0.35)" },
            opacity: hover ? 1 : 0,
            transition: "opacity 200ms",
          }}
        >
          <ChevronLeftIcon />
        </IconButton>

        <IconButton
          aria-label="next"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          sx={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            color: "common.white",
            bgcolor: "rgba(0,0,0,0.25)",
            "&:hover": { bgcolor: "rgba(0,0,0,0.35)" },
            opacity: hover ? 1 : 0,
            transition: "opacity 200ms",
          }}
        >
          <ChevronRightIcon />
        </IconButton>

        {/* dots */}
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 8,
            display: "flex",
            gap: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {content.map((_, i) => (
            <Box
              key={i}
              onClick={() => setIndex(i)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: i === index ? "common.white" : "rgba(255,255,255,0.6)",
                cursor: "pointer",
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

Carousel.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      img: PropTypes.string,
      href: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      tooltip: PropTypes.string,
    }),
  ),
  ratio: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  duration: PropTypes.number,
};

Carousel.defaultProps = {
  items: [],
  ratio: 16 / 9,
  duration: 2000,
};
