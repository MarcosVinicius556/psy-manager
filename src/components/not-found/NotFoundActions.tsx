"use client";

import Link from "next/link";
import { Button, buttonClass } from "@/components/ui/Button";
import { useAuth, type UserRole } from "@/lib/admin/auth-context";

function resolveHomeHref(role: UserRole | null, signedIn: boolean) {
  if (!signedIn) return "/";
  if (role === "super_admin" || role === "support") return "/plataforma";
  return "/admin";
}

const actionButtonClass =
  "w-full min-h-[3.125rem] px-7 py-[0.9rem] text-[0.95rem] sm:w-auto sm:min-w-[11.5rem]";

export default function NotFoundActions() {
  const { user, role, loading } = useAuth();
  const homeHref = resolveHomeHref(role, Boolean(user));

  return (
    <div className="flex w-full max-w-md flex-col items-stretch gap-3 sm:mx-auto sm:flex-row sm:justify-center">
      <Link
        href={loading ? "/" : homeHref}
        className={buttonClass("primary", `${actionButtonClass} text-center no-underline`)}
      >
        Voltar ao início
      </Link>
      <Button
        type="button"
        variant="chip"
        className={`${actionButtonClass} border-[var(--color-border-subtle)] bg-white font-semibold text-teal`}
        onClick={() => {
          if (typeof window !== "undefined" && window.history.length > 1) {
            window.history.back();
            return;
          }
          window.location.assign(homeHref);
        }}
      >
        Voltar
      </Button>
    </div>
  );
}
