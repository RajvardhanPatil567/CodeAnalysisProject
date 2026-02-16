import axios from 'axios';

// Use the backend API URL from environment variables or default to localhost:8000
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  withCredentials: true, // Include cookies in requests for session handling
});

// Add a response interceptor to handle errors consistently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      
      // Handle specific status codes
      if (error.response.status === 401) {
        // Handle unauthorized access (e.g., redirect to login)
        console.error('Unauthorized access - please log in');
      } else if (error.response.status === 403) {
        // Handle forbidden access
        console.error('You do not have permission to perform this action');
      } else if (error.response.status === 404) {
        // Handle not found
        console.error('The requested resource was not found');
      } else if (error.response.status >= 500) {
        // Handle server errors
        console.error('A server error occurred. Please try again later.');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
    
    // Return a rejected promise with the error
    return Promise.reject(error);
  }
);

export const MobSFService = {
  // Upload and analyze APK file using our backend
  analyzeApk: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post('/api/apk/analyze/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error analyzing APK:', error);
      throw error;
    }
  },
  
  // Get analysis report (cached results from our backend)
  getReport: async (fileHash: string) => {
    try {
      const response = await api.get(`/api/apk/report/${fileHash}/`);
      return response.data;
    } catch (error) {
      console.error('Error getting report:', error);
      throw error;
    }
  },
  
  // Get scan logs (from our backend)
  getScanLogs: async (fileHash: string) => {
    try {
      const response = await api.get(`/api/apk/logs/${fileHash}/`);
      return response.data;
    } catch (error) {
      console.error('Error getting scan logs:', error);
      throw error;
    }
  },
  
  // Download PDF report (from our backend)
  downloadPdf: async (fileHash: string, fileName: string) => {
    try {
      const response = await api.get(`/api/apk/report/${fileHash}/pdf/`, {
        responseType: 'blob',
      });
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${fileName}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  },
  
  // Search previous scans (from our backend)
  searchScans: async (query: string) => {
    try {
      const response = await api.get('/api/apk/search/', {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching scans:', error);
      throw error;
    }
  },
};
