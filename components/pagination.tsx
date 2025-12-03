'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { T } from 'gt-next';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams = {},
}: PaginationProps) {
  const router = useRouter();
  const [jumpPage, setJumpPage] = useState('');

  if (totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams({
      ...searchParams,
      page: page.toString(),
    });
    return `${basePath}?${params.toString()}`;
  };

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpPage, 10);
    if (pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage) {
      router.push(buildUrl(pageNum));
      setJumpPage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    // Show current page and neighbors
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav
      className="flex items-center justify-center gap-2 mt-8"
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === 1}
        className="h-9 w-9"
      >
        {currentPage === 1 ? (
          <span className="cursor-not-allowed opacity-50">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">
              <T>Previous page</T>
            </span>
          </span>
        ) : (
          <Link href={buildUrl(currentPage - 1)}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">
              <T>Previous page</T>
            </span>
          </Link>
        )}
      </Button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="icon"
              asChild={currentPage !== page}
              className="h-9 w-9"
            >
              {currentPage === page ? (
                <span>{page}</span>
              ) : (
                <Link href={buildUrl(page)}>{page}</Link>
              )}
            </Button>
          ),
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === totalPages}
        className="h-9 w-9"
      >
        {currentPage === totalPages ? (
          <span className="cursor-not-allowed opacity-50">
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">
              <T>Next page</T>
            </span>
          </span>
        ) : (
          <Link href={buildUrl(currentPage + 1)}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">
              <T>Next page</T>
            </span>
          </Link>
        )}
      </Button>

      <div className="hidden sm:flex items-center gap-2 ml-4">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          <T>Go to</T>
        </span>
        <Input
          type="number"
          min={1}
          max={totalPages}
          value={jumpPage}
          onChange={(e) => setJumpPage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={currentPage.toString()}
          className="h-9 w-16 text-center"
          aria-label="Jump to page"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleJumpToPage}
          disabled={!jumpPage || parseInt(jumpPage, 10) === currentPage}
          className="h-9"
        >
          <T>Go</T>
        </Button>
      </div>
    </nav>
  );
}
