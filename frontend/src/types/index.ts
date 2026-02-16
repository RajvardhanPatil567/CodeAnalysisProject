// Common API response type
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  message?: string;
}

// Paginated response type
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Issue type
export interface Issue {
  id: string;
  report: string;
  rule_name: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  file_name: string;
  line_number: number;
  message: string;
  created_at: string;
  // Add any additional fields that might be present in your Issue type
}

// Add other common types here as needed
