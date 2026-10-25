export const SIDEBAR_INSET_PX = 14;
export const SIDEBAR_COLLAPSED_W = 76;
export const SIDEBAR_EXPANDED_W = 256;
export const SIDEBAR_EXPANDED_WIDE_W = 288;

export function navRowClass(collapsed: boolean, nested = false) {
  return `relative flex items-center overflow-hidden rounded-[var(--radius-control)] text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 ${
    collapsed ? "justify-center px-0 py-3" : nested ? "gap-3 py-2.5 pl-9 pr-3" : "gap-3 px-3 py-3"
  }`;
}

/** Active route with sliding pill — high contrast on dark rail. */
export function navRowTone(active: boolean, containsActive = false) {
  if (active) return "text-white font-semibold";
  if (containsActive) return "text-white/95 font-medium";
  return "text-white/85 hover:bg-white/10 hover:text-white";
}

export function iconTone(active: boolean) {
  return `shrink-0 transition-colors duration-200 ${active ? "text-white" : "text-white/90"}`;
}

export function labelTone(active: boolean) {
  return active ? "font-semibold text-white" : "";
}
