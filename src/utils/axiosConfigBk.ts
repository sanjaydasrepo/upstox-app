import axios, { AxiosInstance } from 'axios';
export const BASE_URL = process.env.REACT_APP_BASE_URL;

const axiosInstanceBk: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstanceBk.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstanceBk;
