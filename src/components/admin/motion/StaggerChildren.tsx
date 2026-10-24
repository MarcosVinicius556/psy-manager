"use client";

import { Children, isValidElement, type ReactNode } from "react";
import { AdminStaggerItem } from "@/components/admin/motion/AdminPageMotion";

export default function StaggerChildren({ children }: { children: ReactNode }) {
  return Children.map(children, (child, index) => {
    if (!isValidElement(child)) return child;
    return (
      <AdminStaggerItem key={child.key ?? `stagger-${index}`}>
        {child}
      </AdminStaggerItem>
    );
  });
}
