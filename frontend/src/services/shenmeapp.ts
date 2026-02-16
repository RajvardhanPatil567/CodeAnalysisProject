import axios from 'axios';

const SHENMEAPP_API = 'https://www.shenmeapp.com/api/v1';

interface ShenmeAppResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const analyzeApk = async (file: File): Promise<ShenmeAppResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${SHENMEAPP_API}/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('Error analyzing APK:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to analyze APK',
    };
  }
};

export const getAnalysisResult = async (analysisId: string): Promise<ShenmeAppResponse> => {
  try {
    const response = await axios.get(`${SHENMEAPP_API}/analysis/${analysisId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('Error fetching analysis result:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch analysis result',
    };
  }
};
