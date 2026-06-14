// Mỗi cuốn sách có bookmark riêng, không xung đột
export function saveBookmark(bookId: string, pageIndex: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`bookmark_${bookId}`, String(pageIndex));
}

export function loadBookmark(bookId: string): number {
  if (typeof window === 'undefined') return 0;
  const val = localStorage.getItem(`bookmark_${bookId}`);
  return val ? parseInt(val, 10) : 0;
}

export function getAllBookmarks(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  const result: Record<string, number> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('bookmark_')) {
      const bookId = key.replace('bookmark_', '');
      result[bookId] = parseInt(localStorage.getItem(key) || '0', 10);
    }
  }
  return result;
}
