export const DEFAULT_PROFILE_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 2 16 18"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="%239ca3af"/></svg>`;

export const getFallbackAvatar = () => {
  return DEFAULT_PROFILE_IMAGE;
};

export const handleImageError = (e) => {
  if (e.currentTarget.src !== DEFAULT_PROFILE_IMAGE) {
    e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
    e.currentTarget.onerror = null; // Prevent infinite loop
  }
};
