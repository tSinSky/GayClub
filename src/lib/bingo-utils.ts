export function seededRandom(seed: number) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const rng = seededRandom(seed);
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateBingoCard(
  items: string[],
  sessionId: string,
  userId: string
): string[] {
  const seed = hashString(sessionId + userId) * 7919 + 42;
  const shuffled = shuffleWithSeed(items, seed);
  return shuffled.slice(0, 16);
}

export function checkBingoWin(marked: boolean[]): number[][] {
  const winLines: number[][] = [];
  const size = 4;

  // Rows
  for (let r = 0; r < size; r++) {
    const line = Array.from({ length: size }, (_, c) => r * size + c);
    if (line.every((i) => marked[i])) winLines.push(line);
  }

  // Columns
  for (let c = 0; c < size; c++) {
    const line = Array.from({ length: size }, (_, r) => r * size + c);
    if (line.every((i) => marked[i])) winLines.push(line);
  }

  // Diagonals
  const diag1 = [0, 5, 10, 15];
  if (diag1.every((i) => marked[i])) winLines.push(diag1);

  const diag2 = [3, 6, 9, 12];
  if (diag2.every((i) => marked[i])) winLines.push(diag2);

  return winLines;
}
