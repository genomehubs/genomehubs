import { useEffect, useState } from "react";

export default (rootElRef, top) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let mounted = true;
    if (rootElRef && rootElRef.current) {
      try {
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
          try {
            ob.unobserve(rootElRef.current);
          } catch (e) {
            console.log(e);
          }
        };
      } catch (e) {
        console.log(e);
      }
    }
    return () => {
      mounted = false;
    };
  }, []);
  return visible;
};
