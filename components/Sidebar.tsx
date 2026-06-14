"use client";

import Link from "next/link";

interface PageItem {
  index: number;
  path: string;
  label: string;
}

interface ChapterGroup {
  name: string;
  pages: PageItem[];
}

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  pageGroups: ChapterGroup[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  pagesCount: number;
}

export function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  pageGroups,
  currentIndex,
  setCurrentIndex,
  pagesCount,
}: SidebarProps) {
  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-35 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={`
          fixed md:relative top-0 md:top-0 left-0 z-40
          w-[280px] h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800
          transition-transform duration-300 overflow-y-auto shrink-0 flex flex-col justify-between
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:transform-none md:transition-none
          ${!isSidebarOpen ? 'md:hidden' : ''}
        `}
      >
        <div>
          {/* Header: Library Back Button */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-1 text-sm font-bold text-zinc-700 hover:text-libero-red dark:text-zinc-300 dark:hover:text-libero-red transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              Về thư viện
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Hierarchy Tree */}
          <div className="p-4 space-y-6">
            {pageGroups.map((group) => (
              <div key={group.name} className="space-y-1">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
                  {group.name}
                </div>
                <div className="space-y-0.5 pl-2.5 border-l border-zinc-100 dark:border-zinc-800/60 ml-1">
                  {group.pages.map((p) => {
                    const isActive = currentIndex === p.index;
                    return (
                      <button
                        key={p.path}
                        id={isActive ? "active-sidebar-item" : undefined}
                        onClick={() => {
                          setCurrentIndex(p.index);
                          if (window.innerWidth < 768) {
                            setIsSidebarOpen(false);
                          }
                        }}
                        className={`w-full text-left text-xs px-3 py-2 rounded-xl transition flex items-start gap-2 ${isActive ? 'bg-libero-red/5 dark:bg-libero-red/10 text-libero-red dark:text-libero-red font-extrabold shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                      >
                        <span className="mt-0.5 text-zinc-400 shrink-0">📄</span>
                        <span className="line-clamp-2 leading-relaxed">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 text-center font-medium">
          Mẹo: Dùng ← và → để lật trang
        </div>
      </aside>
    </>
  );
}
