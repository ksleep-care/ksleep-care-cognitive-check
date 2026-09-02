/** 한국어 조사. 받침 유무로 이/가, 을/를, 은/는, 과/와, 으로/로를 고른다. */
export function hasLastConsonant(word: string): boolean {
  const code = word.charCodeAt(word.length - 1);
  if (Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function particle(word: string, withConsonant: string, withoutConsonant: string): string {
  return word + (hasLastConsonant(word) ? withConsonant : withoutConsonant);
}

export const 이가 = (w: string): string => particle(w, '이', '가');
export const 을를 = (w: string): string => particle(w, '을', '를');
export const 은는 = (w: string): string => particle(w, '은', '는');
export const 과와 = (w: string): string => particle(w, '과', '와');
export const 으로로 = (w: string): string => particle(w, '으로', '로');
export const 이라고라고 = (w: string): string => particle(w, '"이라고', '"라고');
