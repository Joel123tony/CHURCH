import React from "react";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";

export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 80, // Delay between items in ms
  baseDelay = 0, // Initial delay before the first item
  triggerOnce = true
}) {
  const [ref, isIntersecting, reducedMotion] = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce,
  });

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  // Clone children to pass down isIntersecting and calculated delay
  const staggeredChildren = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;
    
    // Prevent React warnings: only pass internal props to custom components
    if (typeof child.type !== 'function' && typeof child.type !== 'object') {
      return child;
    }
    
    return React.cloneElement(child, {
      _inStagger: true,
      _isIntersecting: isIntersecting,
      _delay: baseDelay + index * staggerDelay
    });
  });

  return (
    <div ref={ref} className={className}>
      {staggeredChildren}
    </div>
  );
}

// Child wrapper for StaggerContainer
export function StaggerItem({ 
  children, 
  className = "", 
  animation = "fade-up", 
  duration = 500,
  _inStagger,
  _isIntersecting,
  _delay
}) {
  // If not used inside StaggerContainer, it behaves like a normal div
  // (Alternatively, could default to AnimatedSection behavior, but keeping it simple)
  if (!_inStagger) {
    return <div className={className}>{children}</div>;
  }

  const getAnimationStyles = () => {
    const baseTransition = `all ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${_delay}ms`;
    
    if (!_isIntersecting) {
      switch (animation) {
        case "fade-up": return { opacity: 0, transform: "translateY(24px)", transition: baseTransition };
        case "scale-in": return { opacity: 0, transform: "scale(0.97)", transition: baseTransition };
        default: return { opacity: 0, transition: baseTransition };
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
    <div className={className} style={getAnimationStyles()}>
      {children}
    </div>
  );
}
