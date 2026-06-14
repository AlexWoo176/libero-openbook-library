// Fetch và parse book-pages.js của từng cuốn
export async function getBookPages(bookId: string): Promise<string[]> {
  // We need to fetch from the API or server side. Since this helper can be called on both
  // server-side and client-side, let's make sure it handles both.
  // When running on server side, we can read directly from public directory to avoid fetch errors.
  if (typeof window === 'undefined') {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'public', 'books', bookId, 'book-reader', 'book-pages.js');
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const text = fs.readFileSync(filePath, 'utf-8');
    const match = text.match(/window\.BOOK_PAGES\s*=\s*(\[[\s\S]*?\])/);
    if (!match) return [];
    try {
      const jsonText = match[1].replace(/'/g, '"');
      return JSON.parse(jsonText);
    } catch (e) {
      console.error('Error parsing book-pages.js on server side:', e);
      return [];
    }
  } else {
    try {
      const res = await fetch(`/books/${bookId}/book-reader/book-pages.js`);
      const text = await res.text();
      // Parse: window.BOOK_PAGES = ['...', '...']
      const match = text.match(/window\.BOOK_PAGES\s*=\s*(\[[\s\S]*?\])/);
      if (!match) return [];
      const jsonText = match[1].replace(/'/g, '"');
      return JSON.parse(jsonText);
    } catch (e) {
      console.error('Error fetching or parsing book-pages.js on client side:', e);
      return [];
    }
  }
}

// Label hiển thị cho từng trang
export function getPageLabel(pagePath: string): string {
  const filename = pagePath.split('/').pop()?.replace('.html', '') || '';
  const map: Record<string, string> = {
    'preface': 'Lời tựa',
    'index': 'Mục lục',
    'a-suggested-resources': 'Tài liệu tham khảo',
    'introduction': 'Giới thiệu',
    'key-terms': 'Thuật ngữ chính',
    'summary': 'Tóm tắt',
    'review-questions': 'Câu hỏi ôn tập',
    'discussion-questions': 'Câu hỏi thảo luận',
    'case-questions': 'Câu hỏi tình huống',
    'suggested-resources': 'Tài liệu đề xuất',
  };
  // Tìm key khớp cuối filename
  for (const [key, label] of Object.entries(map)) {
    if (filename.endsWith(key)) return label;
  }
  // Section như "1-1-entrepreneurship-today" → slug làm label
  const parts = filename.split('-');
  if (parts.length >= 3 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
    return parts.slice(2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return filename;
}

// Lấy số chương từ path
export function getChapterFromPath(pagePath: string): string | null {
  const match = pagePath.match(/\/chapter-(\d+)\//);
  return match ? match[1] : null;
}
