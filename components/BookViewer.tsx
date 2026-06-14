import React, { useRef, useEffect } from 'react';

export interface GlossaryItem {
  key: string;
  translation: string;
  desc_en: string;
  desc_vi: string;
}

interface BookViewerProps {
  htmlContent: string;
  language: 'vn' | 'en' | 'both';
  glossary: GlossaryItem[];
  onTranslationHover: (content: string) => void;
  onTermHover: (term: GlossaryItem | null) => void;
  pages: string[];
  currentIndex: number;
  onSelectPage: (index: number) => void;
}

export const BookViewer: React.FC<BookViewerProps> = ({
  htmlContent,
  language,
  glossary,
  onTranslationHover,
  onTermHover,
  pages,
  currentIndex,
  onSelectPage,
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);

  const languageStyle = `
    ${language === 'en' ? '#book-viewer-content .eng.hidden { display: block !important } #book-viewer-content .vn.visible { display: none !important }' : ''}
    ${language === 'both' ? '#book-viewer-content .eng.hidden { display: block !important; margin-bottom: 0.5rem; opacity: 0.85; font-style: italic; } #book-viewer-content .vn.visible { display: block !important; margin-bottom: 1.25rem; }' : ''}
    ${language === 'vn' ? '#book-viewer-content .eng.hidden { display: none !important } #book-viewer-content .vn.visible { display: block !important }' : ''}
    #book-viewer-content .vn.visible:hover, #book-viewer-content .eng.hidden:hover { background-color: rgba(232, 57, 42, 0.08); border-radius: 4px; cursor: pointer; }
    #book-viewer-content [data-type="term"] { background-color: #fef3c7; color: #92400e; border-radius: 4px; padding: 1px 4px; cursor: help; border-bottom: 1px dashed #d97706; transition: all 0.2s; }
    #book-viewer-content [data-type="term"]:hover { background-color: #fde68a; }
    .dark #book-viewer-content [data-type="term"] { background-color: #78350f; color: #fef3c7; border-bottom: 1px dashed #f59e0b; }
    .dark #book-viewer-content [data-type="term"]:hover { background-color: #92400e; }
  `;

  // Hover detection
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Hover trên term
      const termEl = target.closest('[data-type="term"]') as HTMLElement;
      if (termEl) {
        const termText = termEl.textContent?.trim() || '';
        const termLower = termText.toLowerCase();
        const match = glossary.find(g =>
          g.key.toLowerCase() === termLower ||
          g.translation.toLowerCase() === termLower
        );
        if (match) {
          onTermHover(match);
        } else {
          onTermHover({
            key: termText,
            translation: 'No matching definition',
            desc_en: 'No matching definition',
            desc_vi: 'No matching definition'
          });
        }
      } else {
        onTermHover(null);
      }

      // Hover trên block để xem translation
      const vnBlock = target.closest('.vn') as HTMLElement;
      const engBlock = target.closest('.eng') as HTMLElement;

      if (vnBlock && language !== 'both') {
        const vnId = vnBlock.id;
        if (vnId?.endsWith('-vn')) {
          const engId = vnId.replace('-vn', '');
          const engEl = viewer.querySelector(`#${engId}`) as HTMLElement;
          onTranslationHover(engEl?.innerHTML || '');
        }
      } else if (engBlock && language !== 'both') {
        const engId = engBlock.id;
        if (engId) {
          const vnEl = viewer.querySelector(`#${engId}-vn`) as HTMLElement;
          onTranslationHover(vnEl?.innerHTML || '');
        }
      } else {
        if (!vnBlock && !engBlock) {
          onTranslationHover('');
        }
      }
    };

    viewer.addEventListener('mouseover', handleMouseOver);
    return () => viewer.removeEventListener('mouseover', handleMouseOver);
  }, [glossary, language, onTermHover, onTranslationHover]);

  // Click interceptor for links, terms, and translation blocks (touch support)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleViewerClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 1. Handle term clicks
      const termEl = target.closest('[data-type="term"]') as HTMLElement;
      if (termEl) {
        const termText = termEl.textContent?.trim() || '';
        const termLower = termText.toLowerCase();
        const match = glossary.find(g =>
          g.key.toLowerCase() === termLower ||
          g.translation.toLowerCase() === termLower
        );
        if (match) {
          onTermHover(match);
        } else {
          onTermHover({
            key: termText,
            translation: 'No matching definition',
            desc_en: 'No matching definition',
            desc_vi: 'No matching definition'
          });
        }
        return; // Prevents triggering paragraph translation click
      }

      // 2. Handle translation block clicks
      const vnBlock = target.closest('.vn') as HTMLElement;
      const engBlock = target.closest('.eng') as HTMLElement;

      if (vnBlock && language !== 'both') {
        const vnId = vnBlock.id;
        if (vnId?.endsWith('-vn')) {
          const engId = vnId.replace('-vn', '');
          const engEl = viewer.querySelector(`#${engId}`) as HTMLElement;
          onTranslationHover(engEl?.innerHTML || '');
        }
      } else if (engBlock && language !== 'both') {
        const engId = engBlock.id;
        if (engId) {
          const vnEl = viewer.querySelector(`#${engId}-vn`) as HTMLElement;
          onTranslationHover(vnEl?.innerHTML || '');
        }
      }

      // 3. Handle link click
      const link = target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Ignore external or mailto links
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
        return;
      }

      e.preventDefault();

      // Handle local hash targets on current page
      if (href.startsWith('#')) {
        const hashId = href.substring(1);
        const element = viewer.querySelector(`#${hashId}`) || document.getElementById(hashId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }

      // Get current page path
      const currentPath = pages[currentIndex];
      if (!currentPath) return;

      const [relPath, hash] = href.split('#');

      // Resolve relative path segments
      const currentParts = currentPath.split('/');
      currentParts.pop(); // Remove current filename

      const relParts = relPath.split('/');
      for (const part of relParts) {
        if (part === '..') {
          currentParts.pop();
        } else if (part && part !== '.') {
          currentParts.push(part);
        }
      }

      let resolvedPath = currentParts.join('/');
      if (!resolvedPath.startsWith('/')) {
        resolvedPath = '/' + resolvedPath;
      }

      // Append .html if not present
      if (!resolvedPath.endsWith('.html')) {
        resolvedPath += '.html';
      }

      const matchedIndex = pages.findIndex(p => p.toLowerCase() === resolvedPath.toLowerCase());
      if (matchedIndex !== -1) {
        onSelectPage(matchedIndex);

        // Scroll to hash ID after page change
        if (hash) {
          setTimeout(() => {
            const element = document.getElementById(hash);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }, 200);
        }
      } else {
        console.warn(`Internal link path could not be resolved in pages: ${resolvedPath}`);
      }
    };

    viewer.addEventListener('click', handleViewerClick);
    return () => viewer.removeEventListener('click', handleViewerClick);
  }, [pages, currentIndex, onSelectPage, glossary, language, onTermHover, onTranslationHover]);

  return (
    <div className="relative w-full h-full flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: languageStyle }} />
      <div
        ref={viewerRef}
        id="book-viewer-content"
        className="w-full text-zinc-800 dark:text-zinc-200 leading-relaxed text-base md:text-lg break-words space-y-6"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};

export default BookViewer;
