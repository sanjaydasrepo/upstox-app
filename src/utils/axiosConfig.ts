import axios, { AxiosInstance } from 'axios';
export const BASE_URL = process.env.REACT_APP_BASE_URL;
export const ST_BASE_URL = process.env.REACT_APP_ST_BASE_URL;

const axiosInstance: AxiosInstance = axios.create({
  baseURL: ST_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
