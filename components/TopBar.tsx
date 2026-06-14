"use client";

import Link from "next/link";
import Image from "next/image";
import { Book } from "@/lib/books";

interface TopBarProps {
  book: Book;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  setIsSearchOpen: (open: boolean) => void;
  language: 'vn' | 'en' | 'both';
  setLanguage: (lang: 'vn' | 'en' | 'both') => void;
  pagesCount: number;
  currentIndex: number;
  fontFamily: 'serif' | 'sans';
  setFontFamily: (font: 'serif' | 'sans') => void;
}

export function TopBar({
  book,
  isSidebarOpen,
  setIsSidebarOpen,
  setIsSearchOpen,
  language,
  setLanguage,
  pagesCount,
  currentIndex,
  fontFamily,
  setFontFamily,
}: TopBarProps) {
  return (
    <header className="h-16 shrink-0 bg-white border-b border-zinc-200 flex items-center px-4 justify-between z-30 shadow-sm transition-colors duration-300">
      {/* Left Side: Toggle Sidebar & Book Metadata */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-3 md:p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 transition"
          title="Toggle Sidebar (☰)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        
        <Link href="/" className="flex items-center">
          <Image
            src="/images/libero-logo.jpg"
            alt="Libero Education"
            width={120}
            height={60}
            style={{ objectFit: 'contain', height: 'auto' }}
            priority
            className="w-[90px] h-auto md:w-[120px]"
          />
        </Link>

        <span className="hidden sm:inline text-zinc-300">|</span>

        <span className="font-bold text-sm md:text-base max-w-[100px] sm:max-w-xs md:max-w-none truncate text-zinc-900">
          {book.titleVn}
        </span>
      </div>

      {/* Right Side: Search, Font toggle, Lang toggle, Page indicator */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-3 md:p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 transition flex items-center gap-1"
          title="Tìm kiếm trong sách (/) hoặc (Ctrl+F)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.608 10.608Z" />
          </svg>
        </button>

        {/* Font family Toggle */}
        <button
          onClick={() => setFontFamily(fontFamily === 'sans' ? 'serif' : 'sans')}
          className="p-2.5 sm:p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 transition flex items-center justify-center font-bold text-xs shadow-sm border border-zinc-200/50 bg-zinc-100 h-[34px] w-[34px]"
          title="Đổi font chữ (Serif / Sans-serif)"
        >
          {fontFamily === 'sans' ? 'Aa' : 'Ag'}
        </button>

        {/* Language Toggle */}
        <div className="bg-zinc-100 p-1 rounded-xl flex items-center border border-zinc-200/50">
          <button
            onClick={() => setLanguage('vn')}
            className={`px-3 py-2 sm:px-2.5 sm:py-1 text-xs font-bold rounded-lg transition-all ${language === 'vn' ? 'bg-white text-libero-red shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            VN
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-2 sm:px-2.5 sm:py-1 text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-white text-libero-red shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('both')}
            className={`px-3 py-2 sm:px-2.5 sm:py-1 text-xs font-bold rounded-lg transition-all ${language === 'both' ? 'bg-white text-libero-red shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            VN+EN
          </button>
        </div>

        {/* Page Index Badge */}
        {pagesCount > 0 && (
          <span className="text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-600 border border-zinc-200/50 shadow-sm whitespace-nowrap">
            <span className="hidden sm:inline">🔖 Trang </span>
            {currentIndex + 1}/{pagesCount}
          </span>
        )}
      </div>
    </header>
  );
}
