// Common API response type
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

// Issue type
export interface Issue {
  id: string;
  report: string;
  rule_name: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  category: string;
  file_name: string;
  line_number: number;
  message: string;
  created_at: string;
  // Add any additional fields from your API response
  [key: string]: any; // Index signature to allow string indexing
}

// Type for sortable fields in the issues table
export type SortableIssueField = 'created_at' | 'severity' | 'rule_name' | 'message' | 'file_name';
