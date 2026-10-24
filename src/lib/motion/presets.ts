export const springNav = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.85 };

export const pageStagger = {
  staggerChildren: 0.06,
  delayChildren: 0.04,
};

export const pageItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};
