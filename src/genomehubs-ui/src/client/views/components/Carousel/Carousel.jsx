import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

import Box from "#wrappers/Box";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import IconButton from "@mui/material/IconButton";
import PropTypes from "prop-types";
import Tooltip from "#wrappers/Tooltip";
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

  // swipe state
  const [pos, setPos] = useState(1); // position in slides (with clones)
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef(null);
  const pointerRef = useRef({ active: false, startX: 0, lastX: 0 });
  const [containerWidth, setContainerWidth] = useState(0);

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

  // build slides with clones for seamless loop when more than 1 slide
  const slides =
    content.length > 1
      ? [content[content.length - 1], ...content, content[0]]
      : content;

  // keep pos in sync when content changes
  useEffect(() => {
    setPos(content.length > 1 ? 1 : 0);
    setIndex(0);
  }, [content.length]);

  // measure container width to ensure initial translate is correct
  useLayoutEffect(() => {
    const measure = () => {
      const w = containerRef.current ? containerRef.current.clientWidth : 0;
      setContainerWidth(w);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // compute public index from pos
  useEffect(() => {
    if (content.length > 0) {
      const logical = (pos - 1 + content.length) % content.length;
      setIndex(logical);
    } else {
      setIndex(0);
    }
  }, [pos, content.length]);

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
      // advance the swipe position
      setIsTransitioning(true);
      setPos((p) => p + 1);
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

  const prev = () => {
    if (content.length > 1) {
      setIsTransitioning(true);
      setPos((p) => p - 1);
    } else {
      setIndex((i) => (i - 1 + content.length) % content.length);
    }
  };
  const next = () => {
    if (content.length > 1) {
      setIsTransitioning(true);
      setPos((p) => p + 1);
    } else {
      setIndex((i) => (i + 1) % content.length);
    }
  };

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
        {/* slides container for swipe/slide */}
        <Box
          ref={containerRef}
          onPointerDown={(e) => {
            if (!containerRef.current) return;
            pointerRef.current.active = true;
            pointerRef.current.startX = e.clientX;
            pointerRef.current.lastX = e.clientX;
            // capture pointer so we continue receiving events
            try {
              e.target.setPointerCapture(e.pointerId);
            } catch (err) {
              // ignore
            }
            setIsTransitioning(false);
          }}
          onPointerMove={(e) => {
            if (!pointerRef.current.active) return;
            const dx = e.clientX - pointerRef.current.startX;
            pointerRef.current.lastX = e.clientX;
            setDragOffset(dx);
          }}
          onPointerUp={(e) => {
            if (!pointerRef.current.active) return;
            pointerRef.current.active = false;
            const dx = pointerRef.current.lastX - pointerRef.current.startX;
            const w = containerRef.current
              ? containerRef.current.clientWidth
              : 0;
            const threshold = Math.min(80, w * 0.2);
            if (dx > threshold) {
              // swipe right -> prev
              setIsTransitioning(true);
              setPos((p) => p - 1);
            } else if (dx < -threshold) {
              // swipe left -> next
              setIsTransitioning(true);
              setPos((p) => p + 1);
            } else {
              // snap back
              setIsTransitioning(true);
              setPos((p) => p);
            }
            setDragOffset(0);
            try {
              e.target.releasePointerCapture(e.pointerId);
            } catch (err) {
              // ignore
            }
          }}
          onPointerCancel={() => {
            pointerRef.current.active = false;
            setDragOffset(0);
            setIsTransitioning(true);
            setPos((p) => p);
          }}
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "stretch",
            touchAction: "pan-y",
            userSelect: "none",
            overflow: "hidden",
          }}
        >
          <Box
            sx={() => {
              // translate using the container's pixel width so each slide
              // occupies exactly the full width; combine dragOffset in px.
              const w =
                containerWidth ||
                (containerRef.current ? containerRef.current.clientWidth : 0);
              const translate = w > 0 ? -pos * w + dragOffset : null;
              return {
                display: "flex",
                width: `${slides.length * 100}%`,
                transform:
                  translate !== null
                    ? `translate3d(${translate}px,0,0)`
                    : `translate3d(-${slides.length ? (pos * 100) / slides.length : 0}%,0,0)`,
                transition: isTransitioning ? "transform 400ms ease" : "none",
              };
            }}
            onTransitionEnd={() => {
              // when we land on cloned slides, jump to the real one without transition
              if (content.length > 1) {
                if (pos <= 0) {
                  // moved to clone of last -> reset to last
                  setIsTransitioning(false);
                  setPos(content.length);
                } else if (pos >= slides.length - 1) {
                  // moved to clone of first -> reset to first
                  setIsTransitioning(false);
                  setPos(1);
                } else {
                  setIsTransitioning(false);
                }
              } else {
                setIsTransitioning(false);
              }
            }}
          >
            {slides.map((it, si) => (
              <Box
                key={si}
                sx={{
                  flex: "0 0 100%",
                  width: "100%",
                  height: "100%",
                  position: "relative",
                }}
              >
                {it && it.img ? (
                  <Box
                    component="img"
                    src={it.img}
                    alt={it.title || ""}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      bgcolor: it?._placeholderBg || "transparent",
                    }}
                  />
                )}

                {/* click overlay + tooltip per slide */}
                <Box
                  component="a"
                  href={it && it.href ? it.href : undefined}
                  target={it && it.href ? "_blank" : undefined}
                  rel={it && it.href ? "noopener noreferrer" : undefined}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    textDecoration: "none",
                    color: "inherit",
                  }}
                  onClick={(e) => {
                    if (!it || !it.href) e.preventDefault();
                  }}
                >
                  {it && (it.tooltip || it.href) ? (
                    <Tooltip title={tooltipText(it)}>
                      <Box sx={{ width: "100%", height: "100%" }} />
                    </Tooltip>
                  ) : null}
                </Box>

                {/* per-slide description removed so a single static description
                    overlay (rendered outside the slides) remains, avoiding
                    sub-pixel y alignment issues during sliding */}
              </Box>
            ))}
          </Box>
        </Box>

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
              onClick={() => {
                if (content.length > 1) {
                  setIsTransitioning(true);
                  setPos(i + 1);
                } else {
                  setIndex(i);
                }
              }}
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
