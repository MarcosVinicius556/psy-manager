"use client";

import Link from "next/link";
import { Button, buttonClass } from "@/components/ui/Button";
import { useAuth, type UserRole } from "@/lib/admin/auth-context";

function resolveHomeHref(role: UserRole | null, signedIn: boolean) {
  if (!signedIn) return "/";
  if (role === "super_admin" || role === "support") return "/plataforma";
  return "/admin";
}

export default function NotFoundActions() {
  const { user, role, loading } = useAuth();
  const homeHref = resolveHomeHref(role, Boolean(user));

  return (
    <div className="flex w-full max-w-sm flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
      <Link
        href={loading ? "/" : homeHref}
        className={buttonClass("primary", "w-full sm:w-auto text-center no-underline")}
      >
        Voltar ao início
      </Link>
      <Button
        type="button"
        variant="secondary"
        className="w-full sm:w-auto"
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
