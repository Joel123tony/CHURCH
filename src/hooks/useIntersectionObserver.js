import { useEffect, useRef, useState } from "react";

export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = "0px",
  triggerOnce = true,
} = {}) {
  const [isIntersecting, setIntersecting] = useState(false);
  const ref = useRef(null);
  
  // Track if prefers-reduced-motion is enabled
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    
    const listener = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    // If reduced motion is preferred, immediately set to intersecting
    if (reducedMotion) {
      setIntersecting(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntersecting(true);
          if (triggerOnce) observer.disconnect();
        } else if (!triggerOnce) {
          setIntersecting(false);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, triggerOnce, reducedMotion]);

  return [ref, isIntersecting, reducedMotion];
}
