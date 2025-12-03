import { LocaleSelector } from 'gt-next';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 py-32 px-16 bg-white dark:bg-black">
        <LocaleSelector />
        <Link
          className="flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          href="/dora-world/contents"
        >
          ドラえもんチャンネル
        </Link>
        <Link
          className="flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          href="/fujiko-museum/blog"
        >
          川崎市 藤子・F・不二雄ミュージアム
        </Link>
      </main>
    </div>
  );
}
