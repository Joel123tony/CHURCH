export { AnimatedSection } from "./AnimatedSection.jsx";
export { StaggerContainer, StaggerItem } from "./StaggerContainer.jsx";
import { AnimatedSection } from "./AnimatedSection.jsx";

export const FadeUp = (props) => <AnimatedSection animation="fade-up" {...props} />;
export const FadeLeft = (props) => <AnimatedSection animation="fade-left" {...props} />;
export const FadeRight = (props) => <AnimatedSection animation="fade-right" {...props} />;
export const ScaleIn = (props) => <AnimatedSection animation="scale-in" {...props} />;
