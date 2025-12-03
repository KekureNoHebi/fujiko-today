export function getNavStorageKey(basePath: string): string {
  // Remove leading slash and locale pattern (e.g., /en/, /ja/, /zh-CN/)
  const normalized = basePath
    .replace(/^\/[a-z]{2}(-[A-Z]{2})?\//, '')
    .replace(/^\//, '');
  // Replace slashes with underscores and add suffix
  return `${normalized.replace(/\//g, '_')}_nav_state`;
}
