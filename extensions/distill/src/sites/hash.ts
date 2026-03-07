// DOM 要素の textContent を FNV-1a でインクリメンタルにハッシュ化
export function fingerprintElements(selector: string): string {
  let hash = 0x811c9dc5;
  for (const el of document.querySelectorAll(selector)) {
    const text = el.textContent ?? "";
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    // 要素間のセパレータ (\0)
    hash ^= 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}
