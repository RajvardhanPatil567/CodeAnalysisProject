import axios, { AxiosError, AxiosResponse } from 'axios';

// Ensure the API base URL doesn't have a trailing slash
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');

// Log the API base URL for debugging
console.log('API Base URL:', API_BASE_URL);

// Define API response interface
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  details?: any;
}

// Define CodeFile interface
export interface CodeFile {
  id: string;
  name: string;
  filename: string;
  content: string;
  size?: number;
  language: string;
  created_at: string;
  updated_at: string;
  project?: string;
  lines_of_code?: number;
  issues_count?: number;
  severity?: 'critical' | 'major' | 'minor' | 'info';
  last_analyzed?: string;
}

interface ControlFlowResponse {
  dot?: string;
  html?: string;
  nodes?: any[];
  edges?: any[];
  function_name?: string;
  file_info?: {
    id?: string;
    filename?: string;
    size?: number;
    lines_of_code?: number;
    language?: string;
  };
  function_calls?: string[];
  control_flow?: string[];
  error?: string;
  complexity?: {
    time_complexity: string;
    space_complexity: string;
    cyclomatic_complexity: number;
    line_count: number;
  };
}

// Extend the AxiosInstance interface to include our custom methods
declare module 'axios' {
  // Re-export the ApiResponse interface for use in the module
  export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    data?: T;
    error?: string;
    details?: any;
  }

  interface AxiosInstance {
    getProject: (id: string) => Promise<ApiResponse<Project>>;
    getProjects: () => Promise<ApiResponse<Project[]>>;
    getFiles: (params?: { project?: string }) => Promise<ApiResponse<CodeFile[]>>;
    getReports: (params?: { project?: string }) => Promise<ApiResponse<Report[]>>;
    getIssues: (params?: { report?: string; project?: string }) => Promise<ApiResponse<Issue[]>>;
    uploadFiles: (formData: FormData) => Promise<ApiResponse<CodeFile>>;
    analyzeProject: (projectId: string) => Promise<ApiResponse<{ message: string }>>;
  }
}

// Project interface
export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  files_count?: number;
  latest_report?: any;
}

// Report interface
export interface Report {
  id: string;
  project: string;
  created_at: string;
  started_at?: string;
  status: string;
  summary?: {
    total_files?: number;
    total_lines?: number;
    total_issues?: number;
    critical_issues?: number;
    major_issues?: number;
    minor_issues?: number;
    info_issues?: number;
    [key: string]: any;
  };
  issues?: Issue[];
}

// Issue interface
export interface Issue {
  id: string;
  report: string;
  project: string;
  rule_name: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  category: string;
  file_name: string;
  line_number: number;
  message: string;
  created_at: string;
  suggestion?: string;
}

declare module 'axios' {
  interface AxiosInstance {
    // Existing methods
    getFiles: (params?: { project?: string }) => Promise<ApiResponse<CodeFile[]>>;
    uploadFiles: (formData: FormData) => Promise<ApiResponse<CodeFile>>;
    analyzeControlFlow: (data: { code: string; function_name?: string }) => Promise<ApiResponse<ControlFlowResponse>>;
    getFileControlFlow: (fileId: string, functionName?: string) => Promise<ApiResponse<ControlFlowResponse>>;
    
    // New methods
    getProject: (id: string) => Promise<ApiResponse<Project>>;
    getProjects: () => Promise<ApiResponse<Project[]>>;
    deleteProject: (id: string) => Promise<ApiResponse<void>>;
    getReports: (params?: { project?: string }) => Promise<ApiResponse<Report[]>>;
    getIssues: (params?: { report?: string; project?: string }) => Promise<ApiResponse<Issue[]>>;
    analyzeProject: (projectId: string) => Promise<ApiResponse<{ message: string }>>;
    analyzeCode: (data: { code: string; language: string; filename?: string }) => Promise<ApiResponse<any>>;
    createProject: (data: { name: string; description: string }) => Promise<ApiResponse<Project>>;
  }
}

// Log the API base URL for debugging
console.log('API Base URL:', API_BASE_URL);

// Create axios instance with base url and credentials support
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor for adding auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for consistent error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Handle successful responses
    if (response.data && typeof response.data === 'object') {
      return {
        ...response,
        data: {
          ...response.data,
          status: response.data.status || 'success',
        },
      };
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      });
      
      // Handle specific status codes
      if (error.response.status === 401) {
        // Handle unauthorized
        console.error('Unauthorized access - redirecting to login');
        // You might want to redirect to login here
      } else if (error.response.status === 404) {
        console.error('Resource not found');
      } else if (error.response.status >= 500) {
        console.error('Server error occurred');
      }
      
      // Return a consistent error response
      const errorData = error.response.data as Record<string, any>;
      return Promise.reject({
        status: 'error',
        error: errorData?.error || errorData?.detail || error.message || 'An error occurred',
        statusCode: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      return Promise.reject({
        status: 'error',
        error: 'No response from server. Please check your connection.',
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
      return Promise.reject({
        status: 'error',
        error: error.message || 'Error setting up request',
      });
    }
  }
);

// Attach methods to the api instance
api.getFiles = async (params?: { project?: string }): Promise<ApiResponse<CodeFile[]>> => {
  try {
    const response = await api.get<{ results: CodeFile[] }>('/files/', { 
      params,
      paramsSerializer: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        return searchParams.toString();
      }
    });
    
    // Handle both paginated and non-paginated responses
    const files = Array.isArray(response.data) ? response.data : 
                 response.data.results || [];
    
    return {
      status: 'success',
      data: files
    };
  } catch (error) {
    console.error('Error fetching files:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to fetch files',
      data: []
    };
  }
};

api.uploadFiles = async (formData: FormData): Promise<ApiResponse<CodeFile>> => {
  try {
    console.log('Sending upload request with form data:');
    
    // Log form data entries for debugging
    const formDataEntries: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      formDataEntries[key] = value instanceof File ? 
        `[File] ${value.name} (${value.size} bytes, ${value.type})` : 
        value;
    }
    console.log('Form data entries:', formDataEntries);

    // Get CSRF token from cookies
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };

    const csrfToken = getCookie('csrftoken');
    const headers: Record<string, string> = {
      // Let the browser set the Content-Type with the correct boundary
      'X-Requested-With': 'XMLHttpRequest',
    };
    
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
      console.log('CSRF token found in cookies');
    } else {
      console.warn('CSRF token not found in cookies');
    }

    // Create a new FormData to ensure proper formatting
    const cleanFormData = new FormData();
    
    // Copy all entries to the new FormData
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        cleanFormData.append('files', value);
      } else {
        cleanFormData.append(key, value);
      }
    }

    // Log the full URL for debugging
    const uploadUrl = `${API_BASE_URL}/upload/`;
    console.log(`Sending request to ${uploadUrl} with headers:`, headers);
    
    // Make the request using the full URL to avoid any baseURL issues
    const response = await axios.post(uploadUrl, cleanFormData, {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
      timeout: 60000, // 60 seconds timeout
    });

    console.log('Upload response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    });
    
    if (response.status >= 200 && response.status < 300) {
      return {
        status: 'success',
        data: response.data
      };
    } else {
      throw new Error(response.data?.error || `Upload failed with status ${response.status}`);
    }
  } catch (error: any) {
    const errorDetails = {
      name: error.name,
      message: error.message,
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      },
      request: error.request ? 'Request was made but no response received' : undefined,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data instanceof FormData ? 
          '[FormData]' : error.config?.data,
      },
    };

    console.error('Upload error details:', JSON.stringify(errorDetails, null, 2));
    
    let errorMessage = 'File upload failed';
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      
      if (status === 400) {
        // Bad Request - usually validation errors
        if (data) {
          if (typeof data === 'string') {
            errorMessage = `Invalid request: ${data}`;
          } else if (data.error) {
            errorMessage = `Validation error: ${data.error}`;
          } else if (data.detail) {
            errorMessage = `Error: ${data.detail}`;
          } else if (data.non_field_errors) {
            errorMessage = data.non_field_errors.join(' ');
          } else {
            errorMessage = 'Invalid request data. Please check the file and try again.';
          }
        } else {
          errorMessage = 'Invalid request. Please check the file and try again.';
        }
      } else if (status === 401 || status === 403) {
        errorMessage = 'Authentication required. Please log in and try again.';
      } else if (status === 413) {
        errorMessage = 'File too large. Please choose a smaller file.';
      } else if (status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = `Server responded with status ${status}`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response from server. Please check your connection and try again.';
    } else if (error.message) {
      // Something happened in setting up the request
      errorMessage = `Request error: ${error.message}`;
    }
    
    console.error('Upload failed:', errorMessage);
    
    return {
      status: 'error',
      error: errorMessage,
      details: errorDetails
    };
  }
};

api.analyzeControlFlow = async (data: { 
  code: string; 
  function_name?: string 
}): Promise<ApiResponse<ControlFlowResponse>> => {
  try {
    const response = await api.post<ControlFlowResponse>('/control-flow/', data);
    return { 
      status: 'success', 
      data: response.data 
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Control flow analysis failed',
      data: { error: error instanceof Error ? error.message : 'Control flow analysis failed' }
    };
  }
};

api.getFileControlFlow = async (
  fileId: string, 
  functionName?: string
): Promise<ApiResponse<ControlFlowResponse>> => {
  try {
    const response = await api.post<ControlFlowResponse>(
      `/files/${fileId}/control_flow/`, 
      { function_name: functionName }
    );
    return { 
      status: 'success', 
      data: response.data 
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to get file control flow',
      data: { error: error instanceof Error ? error.message : 'Failed to get file control flow' }
    };
  }
};

// Add the new methods to the API instance
api.getProject = async (id: string): Promise<ApiResponse<Project>> => {
  try {
    const response = await api.get<Project>(`/projects/${id}/`);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to fetch project'
    };
  }
};

api.getProjects = async (): Promise<ApiResponse<Project[]>> => {
  try {
    const response = await api.get<{ count: number; next: string | null; previous: string | null; results: Project[] }>('/projects/');
    return {
      status: 'success',
      data: response.data.results || []
    };
  } catch (error) {
    console.error('Error fetching projects:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to fetch projects',
      data: [] // Ensure we always return an array
    };
  }
};

api.getReports = async (params?: { project?: string }): Promise<ApiResponse<Report[]>> => {
  try {
    console.log('Fetching reports with params:', params);
    const response = await api.get<{ count: number; next: string | null; previous: string | null; results: Report[] }>('/reports/', { params });
    console.log('Raw API response:', response.data);
    
    // Ensure the response has the expected structure
    const reports = Array.isArray(response.data) ? response.data : (response.data?.results || []);
    
    return {
      status: 'success',
      data: reports
    };
  } catch (error) {
    console.error('Error fetching reports:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to fetch reports',
      data: []
    };
  }
};

api.deleteProject = async (id: string): Promise<ApiResponse<void>> => {
  try {
    await api.delete(`/projects/${id}/`);
    return {
      status: 'success'
    };
  } catch (error) {
    console.error('Error deleting project:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to delete project'
    };
  }
};

api.getIssues = async (params?: { report?: string; project?: string }): Promise<ApiResponse<Issue[]>> => {
  try {
    const response = await api.get<{ count: number; next: string | null; previous: string | null; results: Issue[] }>('/issues/', { params });
    return {
      status: 'success',
      data: response.data.results || []
    };
  } catch (error) {
    console.error('Error fetching issues:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to fetch issues',
      data: [] // Ensure we always return an array
    };
  }
};

api.analyzeProject = async (projectId: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await api.post<{ message: string }>(`/projects/${projectId}/analyze/`);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to analyze project'
    };
  }
};

// Analysis result interface
export interface AnalysisResult {
  file_path: string;
  language: string;
  metrics: {
    lines_of_code: number;
    cyclomatic_complexity: number;
    [key: string]: number;
  };
  issues: Array<{
    rule_id: string;
    rule_name: string;
    severity: 'critical' | 'major' | 'minor' | 'info';
    category: string;
    message: string;
    line_number: number;
    column_number: number;
    suggestion?: string;
  }>;
}

api.analyzeCode = async (data: { code: string; language: string; filename?: string }): Promise<ApiResponse<AnalysisResult>> => {
  console.log('Sending analysis request:', { 
    language: data.language, 
    filename: data.filename || 'untitled',
    codeLength: data.code.length 
  });
  
  try {
    const requestData = {
      code: data.code,
      language: data.language,
      ...(data.filename && { filename: data.filename })
    };
    
    const response = await api.post<AnalysisResult>('/analyze/', requestData);
    console.log('API response received:', response);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error: any) {
    console.error('API call failed:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || 
             error.response?.data?.detail || 
             error.message || 
             'Failed to analyze code. Please try again.'
    };
  }
};

// Create project with optional file upload
api.createProject = async (data: { name: string; description: string } | FormData): Promise<ApiResponse<Project>> => {
  try {
    const config = data instanceof FormData 
      ? {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      : {};

    const response = await api.post<Project>('/projects/', data, config);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to create project'
    };
  }
};

// Export the api instance with all methods
export default api;
