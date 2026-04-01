export function ce(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/\p{Emoji_Presentation}/gu, '')
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\uFE00-\uFE0F]/g, '')
    .replace(/\u200D/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
