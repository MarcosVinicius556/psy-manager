"use client";

import { useEffect } from "react";
import { registerAppServiceWorker } from "@/lib/push/client";

export default function PwaBootstrap() {
  useEffect(() => {
    void registerAppServiceWorker();
  }, []);
  return null;
}
