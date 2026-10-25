/** Admin shell: desktop sidebar from 960px; mobile tab bar below that. */
export const ADMIN_DESK_MIN_PX = 960;
export const ADMIN_MOBILE_MAX_PX = 959;

export const ADMIN_DESK_MEDIA = "(min-width: 60rem)";
export const ADMIN_MOBILE_TABBAR_MEDIA = `(max-width: ${ADMIN_MOBILE_MAX_PX}px)`;

/** Viewports where the floating sidebar is tight; start collapsed unless user saved preference on wider screens. */
export const ADMIN_NARROW_DESK_MIN_PX = 960;
export const ADMIN_NARROW_DESK_MAX_PX = 1023;

export function isNarrowDeskViewport(widthPx: number) {
  return widthPx >= ADMIN_NARROW_DESK_MIN_PX && widthPx <= ADMIN_NARROW_DESK_MAX_PX;
}
