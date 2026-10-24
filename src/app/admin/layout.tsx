"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToastContainer position="top-right" autoClose={2800} hideProgressBar />
      {children}
    </>
  );
}
