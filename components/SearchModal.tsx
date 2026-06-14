import React, { useState, useEffect, useRef } from 'react';
import { getPageLabel } from '@/lib/bookPages';

interface IndexedPage {
  pageIndex: number;
  pagePath: string;
  pageLabel: string;
  cleanText: string;
}

interface SearchResult {
  pageIndex: number;
  pagePath: string;
  pageLabel: string;
  snippet: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  pages: string[];
  onSelectPage: (index: number) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  bookId,
  pages,
  onSelectPage,
}) => {
  const [query, setQuery] = useState('');
  const [indexedPages, setIndexedPages] = useState<IndexedPage[]>([]);
  const [indexingProgress, setIndexingProgress] = useState(0);
  const [isIndexing, setIsIndexing] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Indexing logic
  useEffect(() => {
    if (isOpen && indexedPages.length === 0 && !isIndexing && pages.length > 0) {
      const startIndexing = async () => {
        setIsIndexing(true);
        const pagesData: IndexedPage[] = [];
        const total = pages.length;
        const batchSize = 5;

        for (let i = 0; i < total; i += batchSize) {
          const chunk = pages.slice(i, i + batchSize);
          const batchPromises = chunk.map(async (pagePath, offset) => {
            const pageIndex = i + offset;
            try {
              const res = await fetch(`/books/${bookId}${pagePath}`);
              const htmlText = await res.text();

              // Use DOMParser to extract Vietnamese text (ignoring english)
              const parser = new DOMParser();
              const doc = parser.parseFromString(htmlText, 'text/html');
              
              // Strip English text blocks
              const engEls = doc.querySelectorAll('.eng');
              engEls.forEach(el => el.remove());

              const cleanText = (doc.body.textContent || '')
                .replace(/\s+/g, ' ')
                .trim();

              return {
                pageIndex,
                pagePath,
                pageLabel: getPageLabel(pagePath),
                cleanText,
              };
            } catch (err) {
              console.error(`Failed to index page ${pagePath}:`, err);
              return null;
            }
          });

          const results = await Promise.all(batchPromises);
          results.forEach(r => {
            if (r) pagesData.push(r);
          });

          setIndexingProgress(Math.min(Math.round(((i + batchSize) / total) * 100), 100));
        }

        setIndexedPages(pagesData);
        setIsIndexing(false);
      };

      startIndexing();
    }
  }, [isOpen, indexedPages.length, isIndexing, pages, bookId]);

  // Search logic with 300ms debounce
  useEffect(() => {
    if (!query.trim() || indexedPages.length === 0) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      const term = query.toLowerCase().trim();
      const results: SearchResult[] = [];

      for (const page of indexedPages) {
        const text = page.cleanText;
        const index = text.toLowerCase().indexOf(term);
        if (index !== -1) {
          // Extract snippet (60 chars before and after match)
          const start = Math.max(0, index - 50);
          const end = Math.min(text.length, index + term.length + 50);
          let snippet = text.substring(start, end);
          if (start > 0) snippet = '...' + snippet;
          if (end < text.length) snippet = snippet + '...';

          results.push({
            pageIndex: page.pageIndex,
            pagePath: page.pagePath,
            pageLabel: page.pageLabel,
            snippet,
          });
        }
      }

      setSearchResults(results.slice(0, 20)); // Limit to 20 results
    }, 300);

    return () => clearTimeout(timer);
  }, [query, indexedPages]);

  // Listen to Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-yellow-900 dark:bg-yellow-600 dark:text-yellow-100 rounded px-0.5 font-medium">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] transition-transform scale-100">
        {/* Search Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <div className="text-zinc-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.608 10.608Z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm từ khoá tiếng Việt trong sách..."
            className="w-full bg-transparent text-sm focus:outline-none placeholder-zinc-400 dark:placeholder-zinc-500"
            disabled={isIndexing}
          />
          <button
            onClick={onClose}
            className="text-xs font-semibold px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
          >
            ESC
          </button>
        </div>

        {/* Indexing Status Bar */}
        {isIndexing && (
          <div className="bg-libero-red/5 dark:bg-libero-red/10 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-libero-red dark:text-libero-red font-medium">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-libero-red border-t-transparent rounded-full animate-spin"></div>
              <span>Đang tải và lập chỉ mục nội dung sách...</span>
            </div>
            <span>{indexingProgress}%</span>
          </div>
        )}

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {isIndexing ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Vui lòng đợi giây lát để hệ thống quét và tối ưu hoá dữ liệu tìm kiếm cho cuốn sách này.
              </span>
              <div className="w-48 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-libero-red h-full rounded-full transition-all duration-300"
                  style={{ width: `${indexingProgress}%` }}
                ></div>
              </div>
            </div>
          ) : query.trim() === '' ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400 dark:text-zinc-500 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              Gõ từ khóa để bắt đầu tìm kiếm nội dung tiếng Việt.
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
                Tìm thấy {searchResults.length} kết quả trong tổng số {pages.length} trang (Giới hạn 20)
              </div>
              {searchResults.map((result) => (
                <button
                  key={result.pageIndex}
                  onClick={() => {
                    onSelectPage(result.pageIndex);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/40 hover:border-zinc-200 dark:hover:border-zinc-700/50 transition-all flex flex-col gap-1 group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-libero-red group-hover:text-libero-red/80">
                      {result.pageLabel}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Trang {result.pageIndex + 1}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {highlightText(result.snippet, query)}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400 dark:text-zinc-500 text-sm">
              Không tìm thấy kết quả nào khớp với "{query}" trong sách.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
