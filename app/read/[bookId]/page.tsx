import { getAllBooks } from '@/lib/books';
import { notFound } from 'next/navigation';
import BookReaderClient from './BookReaderClient';

export default async function ReadPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const books = await getAllBooks();
  const book = books.find(b => b.id === bookId);
  if (!book) notFound();
  return <BookReaderClient book={book} />;
}
