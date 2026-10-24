"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

type PressableProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export default function Pressable<T extends ElementType = "div">({
  as,
  children,
  className = "",
  ...rest
}: PressableProps<T>) {
  const reduced = useReducedMotion();
  const Component = as ?? "div";

  if (reduced) {
    return (
      <Component className={className} {...rest}>
        {children}
      </Component>
    );
  }

  const MotionComponent = motion.create(Component);
  return (
    <MotionComponent
      className={className}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 520, damping: 36 }}
      {...rest}
    >
      {children}
    </MotionComponent>
  );
}
