"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAllBooks, Book } from "@/lib/books";
import { getAllBookmarks } from "@/lib/bookmark";

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [bookmarks, setBookmarks] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const loadedBooks = await getAllBooks();
        setBooks(loadedBooks);
      } catch (err) {
        console.error("Failed to load books", err);
      }
      setBookmarks(getAllBookmarks());
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filteredBooks = books.filter((book) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      book.title.toLowerCase().includes(query) ||
      book.titleVn.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 text-zinc-900 dark:from-zinc-950 dark:to-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white border-b border-zinc-200 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-libero-red/5 text-libero-red border border-libero-red/10 whitespace-nowrap">
              OpenStax
            </span>
          </div>
          <div className="text-sm text-zinc-500 font-medium">
            Học thuật • Song ngữ • Miễn phí
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Banner Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-4">
            Tri thức mở, không giới hạn
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            LiberoGo cung cấp các đầu sách giáo dục mở từ OpenStax và các nguồn học thuật uy tín — được dịch sang tiếng Việt, trình bày song ngữ để người học dễ dàng đối chiếu từng câu.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-16 relative">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-libero-red to-orange-500 rounded-2xl blur opacity-25 group-focus-within:opacity-40 transition duration-300"></div>
            <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="pl-4 text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.608 10.608Z" />
                </svg>
              </div>
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên sách, tác giả..."
                className="w-full py-4 pl-3 pr-10 bg-transparent text-sm focus:outline-none placeholder-zinc-400 dark:placeholder-zinc-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 p-1 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  title="Clear search"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grid Sách */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800"></div>
              <div className="absolute inset-0 rounded-full border-4 border-libero-red border-t-transparent animate-spin"></div>
            </div>
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBooks.map((book) => {
              const hasBookmark = book.id in bookmarks;
              const bookInitial = book.title.charAt(0);

              return (
                <Link
                  key={book.id}
                  href={`/read/${book.id}`}
                  className="group flex flex-col h-full rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Bìa Sách Khối Đồ Hoạ */}
                  <div
                    style={{ backgroundColor: book.coverColor }}
                    className="relative aspect-[4/3] flex flex-col justify-between p-6 transition-all duration-300 overflow-hidden"
                  >
                    {/* Spine line simulation */}
                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/15 z-10"></div>
                    <div className="absolute left-3 top-0 bottom-0 w-[1px] bg-white/10 z-10"></div>

                    {/* Book Cover Overlay pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-zinc-900 to-black pointer-events-none"></div>

                    {/* Header: Reading Badge */}
                    <div className="flex justify-between items-start z-20 w-full pl-3">
                      {hasBookmark ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/90 text-white shadow-md backdrop-blur-sm animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          Đang đọc
                        </span>
                      ) : (
                        <div></div>
                      )}
                      <span
                        style={{ color: book.coverTextColor }}
                        className="text-xs uppercase font-bold tracking-widest opacity-60"
                      >
                        {book.author}
                      </span>
                    </div>

                    {/* Large Book Initial Emblem */}
                    <div
                      style={{ color: book.coverTextColor }}
                      className="absolute right-6 bottom-4 text-9xl font-black font-serif opacity-15 select-none pointer-events-none transform translate-y-4 translate-x-2"
                    >
                      {bookInitial}
                    </div>

                    {/* Title inside cover */}
                    <div className="z-20 pl-3">
                      <h3
                        style={{ color: book.coverTextColor }}
                        className="text-2xl font-extrabold tracking-tight line-clamp-2 leading-tight drop-shadow-sm"
                      >
                        {book.titleVn}
                      </h3>
                      <p
                        style={{ color: book.coverTextColor }}
                        className="text-sm font-medium mt-1 opacity-75 line-clamp-1 italic"
                      >
                        {book.title}
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      {/* Description */}
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-3">
                        {book.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {book.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        {book.chapters} Chương
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-libero-red group-hover:translate-x-0.5 transition-transform duration-200">
                        Đọc ngay
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Không tìm thấy sách</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
              Không tìm thấy kết quả nào khớp với "{searchQuery}". Vui lòng thử từ khoá khác.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 py-8 text-center text-xs text-zinc-500 dark:text-zinc-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} LiberoOpenBook Library. Dự án phi thương mại vì cộng đồng học thuật song ngữ.</p>
        </div>
      </footer>
    </div>
  );
}
