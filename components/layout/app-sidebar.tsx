'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

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
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname?.includes(item.href);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      size="lg"
                      isActive={isActive}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-2"
                        onClick={() => {
                          if (isMobile) {
                            setOpenMobile(false);
                          }
                        }}
                      >
                        <Image
                          src={item.iconUrl}
                          alt={item.title}
                          width={24}
                          height={24}
                          className="shrink-0 rounded"
                        />
                        <span className="font-medium whitespace-normal! overflow-visible! text-clip!">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Roadmap"
              size="lg"
              isActive={pathname?.includes('/roadmap')}
            >
              <Link
                href="/roadmap"
                className="flex items-center gap-2"
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
              >
                <Map className="w-6 h-6 shrink-0" />
                <span className="font-medium whitespace-normal! overflow-visible! text-clip!">
                  Roadmap
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
