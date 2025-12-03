export interface ContentItem {
  id: number;
  page_url: string;
  title: string;
  image_url: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedContentsResponse {
  contents: ContentItem[];
  meta: PaginationMeta;
}
