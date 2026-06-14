"use client";

import { GlossaryItem } from "@/components/BookViewer";

interface RightPanelProps {
  language: 'vn' | 'en' | 'both';
  hoverTranslation: string;
  hoverTerm: GlossaryItem | null;
}

export function RightPanel({
  language,
  hoverTranslation,
  hoverTerm,
}: RightPanelProps) {
  return (
    <aside className="hidden lg:flex flex-col w-[320px] h-full border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 sticky top-0 transition-colors duration-300">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col h-full gap-4">
        {/* Translation Display - 60% */}
        <div className="flex-[3] flex flex-col min-h-0 bg-zinc-50 dark:bg-zinc-950/45 border border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl p-4 shadow-xs overflow-y-auto">
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21a3 3 0 0 0 3-3v-3.75M10.5 21a3 3 0 0 1-3-3v-3.75M10.5 21h4.5M10.5 21h-4.5m1.5-10.5h12M15 3h3.5A2.25 2.25 0 0 1 20.25 5.25v13.5A2.25 2.25 0 0 1 18 21h-3.5M15 3v18M15 3H9m6 0H4.5A2.25 2.25 0 0 0 2.25 5.25v13.5A2.25 2.25 0 0 0 4.5 21H9m0-18v18" />
            </svg>
            {language === 'en' ? 'Bản gốc tiếng Việt' : 'Bản dịch tiếng Anh'}
          </h4>
          {hoverTranslation ? (
            <div
              className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans"
              dangerouslySetInnerHTML={{ __html: hoverTranslation }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-xs text-zinc-500 dark:text-zinc-400 italic px-4">
              {language === 'en' ? 'Di chuột vào đoạn văn để xem bản gốc' : 'Di chuột vào đoạn văn để xem bản dịch'}
            </div>
          )}
        </div>

        {/* Term Definition Display - 40% */}
        <div className="flex-[2] flex flex-col min-h-0 bg-amber-50/20 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-900/20 rounded-2xl p-4 shadow-xs overflow-y-auto">
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-500 mb-3 flex items-center gap-1.5 border-b border-amber-200/20 dark:border-amber-900/10 pb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
            </svg>
            Thuật ngữ chuyên ngành
          </h4>
          {hoverTerm ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-300">{hoverTerm.key}</div>
                <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mt-0.5">VN: {hoverTerm.translation}</div>
              </div>
              <div className="border-t border-amber-200/25 dark:border-amber-900/15 pt-2 space-y-2">
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
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-xs text-zinc-500 dark:text-zinc-400 italic px-4">
              Di chuột vào thuật ngữ được highlight để xem định nghĩa
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
