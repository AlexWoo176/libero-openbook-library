"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Book } from "@/lib/books";
import { getBookPages, getPageLabel, getChapterFromPath } from "@/lib/bookPages";
import { saveBookmark, loadBookmark } from "@/lib/bookmark";
import { BookViewer, GlossaryItem } from "@/components/BookViewer";
import { SearchModal } from "@/components/SearchModal";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { RightPanel } from "@/components/RightPanel";

function fixTableBilingual(html: string, language: 'vn' | 'en' | 'both'): string {
  if (typeof window === 'undefined') return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.querySelectorAll('tr').forEach(row => {
    const cells = Array.from(row.children); // td, th

    cells.forEach((cell, idx) => {
      const isEng = cell.classList.contains('eng');
      const isVn = cell.classList.contains('vn');

      if (language === 'vn') {
        if (isEng) {
          cell.remove();
        } else {
          cell.classList.remove('hidden', 'visible');
          (cell as HTMLElement).style.display = '';
        }
      } else if (language === 'en') {
        if (isVn) {
          cell.remove();
        } else {
          cell.classList.remove('hidden', 'visible');
          (cell as HTMLElement).style.display = '';
        }
      } else if (language === 'both') {
        if (isEng) {
          // Find adjacent vn cell (prev or next)
          let vnCell: Element | null = null;

          const prevCell = cells[idx - 1];
          if (prevCell && prevCell.classList.contains('vn') && prevCell.parentNode === row) {
            vnCell = prevCell;
          }

          if (!vnCell) {
            const nextCell = cells[idx + 1];
            if (nextCell && nextCell.classList.contains('vn') && nextCell.parentNode === row) {
              vnCell = nextCell;
            }
          }

          if (vnCell) {
            const engContent = cell.innerHTML;
            vnCell.innerHTML = `
              <div class="vn-text-block">${vnCell.innerHTML}</div>
              <div class="eng-text-block block text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 italic mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">${engContent}</div>
            `;
            cell.remove();
          } else {
            cell.classList.remove('hidden', 'visible');
            (cell as HTMLElement).style.display = '';
          }
        } else {
          cell.classList.remove('hidden', 'visible');
          (cell as HTMLElement).style.display = '';
        }
      }
    });
  });

  return doc.body.innerHTML;
}

interface BookReaderClientProps {
  book: Book;
}

interface PageItem {
  index: number;
  path: string;
  label: string;
}

interface ChapterGroup {
  name: string;
  pages: PageItem[];
}

export default function BookReaderClient({ book }: BookReaderClientProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rawHtml, setRawHtml] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [language, setLanguage] = useState<'vn' | 'en' | 'both'>('vn');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [glossary, setGlossary] = useState<GlossaryItem[]>([]);
  const [hoverTranslation, setHoverTranslation] = useState('');
  const [hoverTerm, setHoverTerm] = useState<GlossaryItem | null>(null);
  const [isError, setIsError] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('sans');

  // Group pages for the hierarchical sidebar
  const [pageGroups, setPageGroups] = useState<ChapterGroup[]>([]);

  // CSV parsing function that correctly handles commas inside quotes
  function parseCSV(text: string): GlossaryItem[] {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let i = 0;
      while (i < line.length) {
        if (line[i] === ',') {
          result.push('');
          i++;
          continue;
        }
        if (line[i] === '"') {
          let field = '';
          i++; // skip open quote
          while (i < line.length) {
            if (line[i] === '"' && line[i + 1] === '"') {
              field += '"';
              i += 2;
            } else if (line[i] === '"') {
              i++; // skip close quote
              break;
            } else {
              field += line[i];
              i++;
            }
          }
          result.push(field);
          if (line[i] === ',') {
            i++;
          }
        } else {
          const nextComma = line.indexOf(',', i);
          if (nextComma === -1) {
            result.push(line.substring(i));
            break;
          } else {
            result.push(line.substring(i, nextComma));
            i = nextComma + 1;
          }
        }
      }
      return result;
    };

    const rows = lines.slice(1).map(parseLine);
    return rows.map(row => {
      const key = row[0]?.trim() || '';
      const translation = row[1]?.trim() || '';
      const desc_en = row[3]?.trim() || '';
      const desc_vi = row[4]?.trim() || '';
      return { key, translation, desc_en, desc_vi };
    }).filter(item => item.key !== '');
  }

  // Load pages and bookmark on start
  useEffect(() => {
    async function init() {
      const loadedPages = await getBookPages(book.id);
      setPages(loadedPages);

      // Bookmark / page query loading
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      const startIndex = pageParam
        ? parseInt(pageParam, 10)
        : loadBookmark(book.id);
      
      setCurrentIndex(Math.min(Math.max(0, startIndex), loadedPages.length - 1));

      // Build hierarchical sidebar groups
      const groups: Record<string, PageItem[]> = {};
      loadedPages.forEach((path, index) => {
        const label = getPageLabel(path);
        const chapterNum = getChapterFromPath(path);
        
        if (chapterNum) {
          const groupKey = `Chương ${chapterNum}`;
          if (!groups[groupKey]) groups[groupKey] = [];
          groups[groupKey].push({ index, path, label });
        } else {
          const groupKey = 'Tài liệu chung';
          if (!groups[groupKey]) groups[groupKey] = [];
          groups[groupKey].push({ index, path, label });
        }
      });

      const sortedKeys = Object.keys(groups).sort((a, b) => {
        if (a === 'Tài liệu chung') return -1;
        if (b === 'Tài liệu chung') return 1;
        const numA = parseInt(a.replace('Chương ', ''), 10);
        const numB = parseInt(b.replace('Chương ', ''), 10);
        return numA - numB;
      });

      setPageGroups(sortedKeys.map(key => ({
        name: key,
        pages: groups[key]
      })));
    }
    init();

    // Hide sidebar by default on smaller screens initially
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [book.id]);

  // Load glossary CSV
  useEffect(() => {
    fetch(`/books/${book.id}/glossary.csv`)
      .then(r => r.text())
      .then(csv => setGlossary(parseCSV(csv)))
      .catch(() => setGlossary([]));
  }, [book.id]);

  // Fetch page HTML content when currentIndex changes
  useEffect(() => {
    if (!pages.length) return;
    const pagePath = pages[currentIndex];
    setIsError(false);
    setHoverTranslation('');
    setHoverTerm(null);
    
    fetch(`/books/${book.id}${pagePath}`)
      .then(r => {
        if (!r.ok) throw new Error("Failed to fetch page");
        return r.text();
      })
      .then(html => {
        // Find current folder for image rewrites: e.g. '/chapter-1/' or '/_book-level/'
        const parts = pagePath.split('/');
        const folder = parts[1] || '';

        // Rewrite image paths from 'assets/img-X.webp' to absolute URL
        let fixed = html.replace(/src="assets\//g, `src="/books/${book.id}/${folder}/assets/`);
        fixed = fixed.replace(/src='assets\//g, `src='/books/${book.id}/${folder}/assets/`);

        // Extract <body> content
        const bodyMatch = fixed.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        setRawHtml(bodyMatch ? bodyMatch[1] : fixed);
      })
      .catch(err => {
        console.error("Error fetching page:", err);
        setIsError(true);
        setRawHtml('');
      });

    // Save bookmarks
    saveBookmark(book.id, currentIndex);

    // Update URL query parameters
    window.history.replaceState({}, '', `/read/${book.id}?page=${currentIndex}`);

    // Scroll to top of the content viewer
    const viewerEl = document.getElementById('book-viewer');
    if (viewerEl) {
      viewerEl.scrollTop = 0;
    }
  }, [currentIndex, pages, book.id, fetchTrigger]);

  // Sync scroll of sidebar to active page item
  useEffect(() => {
    if (!isSidebarOpen) return;
    const timer = setTimeout(() => {
      const activeEl = document.getElementById("active-sidebar-item");
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentIndex, isSidebarOpen]);

  // Process raw HTML to processed html based on language
  useEffect(() => {
    if (!rawHtml) {
      setHtmlContent('');
      return;
    }
    const processed = fixTableBilingual(rawHtml, language);
    setHtmlContent(processed);
  }, [rawHtml, language]);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes modal or mobile sidebar
      if (e.key === 'Escape') {
        if (isSearchOpen) {
          setIsSearchOpen(false);
        } else if (isSidebarOpen && window.innerWidth < 1024) {
          setIsSidebarOpen(false);
        }
      }

      // Open search on Ctrl+F or /
      if ((e.ctrlKey && e.key === 'f') || e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
      }

      // Arrows to change pages
      const isTyping = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      if (!isTyping) {
        if (e.key === 'ArrowLeft') {
          setCurrentIndex(prev => Math.max(0, prev - 1));
        }
        if (e.key === 'ArrowRight') {
          setCurrentIndex(prev => Math.min(pages.length - 1, prev + 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pages.length, isSearchOpen, isSidebarOpen]);

  const goToNextPage = () => {
    setCurrentIndex(prev => Math.min(pages.length - 1, prev + 1));
  };

  const goToPrevPage = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300">
      {/* TopBar */}
      <TopBar
        book={book}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        setIsSearchOpen={setIsSearchOpen}
        language={language}
        setLanguage={setLanguage}
        pagesCount={pages.length}
        currentIndex={currentIndex}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          pageGroups={pageGroups}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          pagesCount={pages.length}
        />

        {/* Central Book Viewer Panel */}
        <main
          id="book-viewer"
          className={`flex-1 overflow-y-auto bg-white dark:bg-zinc-950 px-4 py-8 md:px-16 md:py-12 flex flex-col justify-between transition-colors duration-300 ${
            fontFamily === 'serif' ? 'font-serif' : 'font-sans'
          }`}
        >
          <div className="max-w-2xl mx-auto w-full">
            {htmlContent ? (
              <BookViewer
                htmlContent={htmlContent}
                language={language}
                glossary={glossary}
                onTranslationHover={setHoverTranslation}
                onTermHover={setHoverTerm}
                pages={pages}
                currentIndex={currentIndex}
                onSelectPage={setCurrentIndex}
              />
            ) : isError ? (
              <div className="flex flex-col items-center justify-center text-center py-24 px-4 border border-red-200/50 dark:border-red-900/30 rounded-2xl bg-red-50/20 dark:bg-red-950/10">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Không thể tải nội dung trang</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-4">Vui lòng kiểm tra kết nối mạng hoặc chuyển sang trang khác.</p>
                <button
                  onClick={() => {
                    setRawHtml('');
                    setIsError(false);
                    setFetchTrigger(p => p + 1);
                  }}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Tải lại trang
                </button>
              </div>
            ) : (
              <div className="flex justify-center items-center py-32">
                <div className="w-10 h-10 border-4 border-zinc-200 dark:border-zinc-800 border-t-libero-red rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Bottom Pagination Buttons */}
          <div className="max-w-2xl mx-auto w-full mt-16 pt-8 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between">
            <button
              onClick={goToPrevPage}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1.5 px-4 py-3 sm:py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition disabled:opacity-40 disabled:pointer-events-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              Trang trước
            </button>

            <button
              onClick={goToNextPage}
              disabled={currentIndex === pages.length - 1}
              className="inline-flex items-center gap-1.5 px-4 py-3 sm:py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition disabled:opacity-40 disabled:pointer-events-none"
            >
              Trang tiếp
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </main>

        {/* Right Info Panel */}
        <RightPanel
          language={language}
          hoverTranslation={hoverTranslation}
          hoverTerm={hoverTerm}
        />
      </div>

      {/* Mobile Bottom Sheet Drawer */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-45 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-t-2xl shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1),0_-8px_10px_-6px_rgba(0,0,0,0.1)] transition-all duration-300 transform px-4 pb-6 pt-3 flex flex-col gap-3 max-h-[50vh] overflow-y-auto ${
          (hoverTranslation || hoverTerm) ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
      >
        {/* Peek Handle */}
        <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto shrink-0 mb-1" />

        {/* Close Button */}
        <button
          onClick={() => {
            setHoverTranslation('');
            setHoverTerm(null);
          }}
          className="absolute top-3 right-4 p-2 rounded-xl text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          title="Đóng bản dịch/thuật ngữ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Translation Content */}
        {hoverTranslation && (
          <div className="flex-1 flex flex-col min-h-0">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800/50 pb-1.5 pr-8">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21a3 3 0 0 0 3-3v-3.75M10.5 21a3 3 0 0 1-3-3v-3.75M10.5 21h4.5M10.5 21h-4.5m1.5-10.5h12M15 3h3.5A2.25 2.25 0 0 1 20.25 5.25v13.5A2.25 2.25 0 0 1 18 21h-3.5M15 3v18M15 3H9m6 0H4.5A2.25 2.25 0 0 0 2.25 5.25v13.5A2.25 2.25 0 0 0 4.5 21H9m0-18v18" />
              </svg>
              {language === 'en' ? 'Bản gốc tiếng Việt' : 'Bản dịch tiếng Anh'}
            </h4>
            <div
              className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: hoverTranslation }}
            />
          </div>
        )}

        {/* Term Content */}
        {hoverTerm && (
          <div className="flex-1 flex flex-col min-h-0 bg-amber-50/10 dark:bg-amber-950/5 border border-amber-200/20 dark:border-amber-900/10 rounded-xl p-3 overflow-y-auto">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-500 mb-2 flex items-center gap-1.5 border-b border-amber-200/20 dark:border-amber-900/10 pb-1.5 pr-8">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
              </svg>
              Thuật ngữ chuyên ngành
            </h4>
            <div className="space-y-2">
              <div>
                <div className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-300">{hoverTerm.key}</div>
                <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mt-0.5">VN: {hoverTerm.translation}</div>
              </div>
              <div className="border-t border-amber-200/25 dark:border-amber-900/15 pt-1.5 space-y-1">
                {hoverTerm.desc_en && (
                  <div>
                    <span className="text-[9px] font-extrabold text-amber-600/80 uppercase">EN:</span>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">{hoverTerm.desc_en}</p>
                  </div>
                )}
                {hoverTerm.desc_vi && (
                  <div>
                    <span className="text-[9px] font-extrabold text-amber-600/80 uppercase">VN:</span>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">{hoverTerm.desc_vi}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Search Modal overlay */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        bookId={book.id}
        pages={pages}
        onSelectPage={setCurrentIndex}
      />
    </div>
  );
}
