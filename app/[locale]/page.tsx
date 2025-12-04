import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  const menuItems = [
    {
      title: 'ドラえもんチャンネル',
      href: '/dora-world/contents',
      iconUrl: 'https://dora-world.com/assets/images/favicon.ico',
    },
    {
      title: '川崎市 藤子・F・不二雄ミュージアム',
      href: '/fujiko-museum/blog',
      iconUrl: 'https://fujiko-museum.com/webclip.png',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4">
        {menuItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group relative flex flex-col gap-4 rounded-lg border bg-card p-6 md:p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/50 h-full"
          >
            <div className="flex items-start gap-4 min-h-16">
              <div className="shrink-0">
                <Image
                  src={item.iconUrl}
                  alt={item.title}
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <span>Explore</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
