export interface Book {
  id: string;
  title: string;
  titleVn: string;
  author: string;
  coverColor: string;
  coverTextColor: string;
  chapters: number;
  description: string;
  tags: string[];
}

export async function getAllBooks(): Promise<Book[]> {
  // Import trực tiếp — Next.js bundle json tự động
  const books = await import('../books.json');
  return books.default as Book[];
}
