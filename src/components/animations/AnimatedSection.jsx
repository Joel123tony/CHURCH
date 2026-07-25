import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";

export function AnimatedSection({ 
  children, 
  className = "", 
  animation = "fade-up", 
  delay = 0,
  duration = 600,
  triggerOnce = true 
}) {
  const [ref, isIntersecting, reducedMotion] = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce,
  });

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const getAnimationStyles = () => {
    const baseTransition = `all ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`;
    
    if (!isIntersecting) {
      switch (animation) {
        case "fade-up":
          return { opacity: 0, transform: "translateY(24px)", transition: baseTransition };
        case "fade-left":
          return { opacity: 0, transform: "translateX(-24px)", transition: baseTransition };
        case "fade-right":
          return { opacity: 0, transform: "translateX(24px)", transition: baseTransition };
        case "scale-in":
          return { opacity: 0, transform: "scale(0.97)", transition: baseTransition };
        default:
          return { opacity: 0, transition: baseTransition };
      }
    }
    
    return {
      opacity: 1,
      transform: "translate(0) scale(1)",
      transition: baseTransition,
      willChange: "transform, opacity",
    };
  };

  return (
    <div ref={ref} className={className} style={getAnimationStyles()}>
      {children}
    </div>
  );
}
