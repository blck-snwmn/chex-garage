// FNV-1a 32bit hash — 変更検知用の軽量ハッシュ
export function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

// DOM 要素の textContent をインクリメンタルにハッシュ化
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
