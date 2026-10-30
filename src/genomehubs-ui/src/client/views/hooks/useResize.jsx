import { useEffect, useState } from "react";

const useResize = (myRef) => {
  const getDimensions = () => ({
    width: myRef.current?.offsetWidth || 0,
    height: myRef.current?.offsetHeight || 0,
  });

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // const handleResize = () => {
    //   setDimensions(getDimensions());
    // };

    const el = myRef.current;
    if (!el) return;

    const observer = new window.ResizeObserver(() => {
      const next = getDimensions();
      setDimensions((prev) =>
        prev.width === next.width && prev.height === next.height ? prev : next,
      );
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [myRef]);

  return dimensions;
};

export default useResize;
