export const AVATAR_BACKGROUND = "#8FAACD";
export const AVATAR_BUST_PATH = "M12 100V88C12 69 29 58 50 58S88 69 88 88V100Z";
export const DEFAULT_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="${AVATAR_BACKGROUND}"/><svg x="0" y="0" width="100" height="100" viewBox="0 0 100 100"><clipPath id="circle"><circle cx="50" cy="50" r="50"/></clipPath><g clip-path="url(#circle)" fill="#FFFFFF"><circle cx="50" cy="34" r="17"/><path d="${AVATAR_BUST_PATH}"/></g></svg></svg>`;
export const DEFAULT_AVATAR_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(DEFAULT_AVATAR_SVG)}`;
