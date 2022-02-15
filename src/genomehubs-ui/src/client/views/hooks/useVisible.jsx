import { useEffect, useState } from "react";

export default (rootElRef, top) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let mounted = true;
    if (rootElRef && rootElRef.current) {
      const ob = new IntersectionObserver(
        ([entry]) => {
          if (mounted && !visible) {
            setVisible(entry.isIntersecting);
          }
        },
        {
          rootMargin: top,
        }
      );
      ob.observe(rootElRef.current);
      return () => {
        ob.unobserve(rootElRef.current);
      };
    }
    return () => {
      mounted = false;
    };
  }, []);
  return visible;
};
