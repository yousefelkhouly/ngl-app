import { domMax } from "motion/react";

// the animation engine, loaded by LazyMotion (components/providers.tsx) after the page is up.
// domMax because the reveal slider drags and the inbox list animates layout
export default domMax;
