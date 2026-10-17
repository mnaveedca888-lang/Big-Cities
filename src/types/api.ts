export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}

export interface FilterState {
  search: string;
  category: string;
  country: string;
  city: string;
  priceRange: string;
  language: string;
  organizer: string;
  sortBy: string;
}
