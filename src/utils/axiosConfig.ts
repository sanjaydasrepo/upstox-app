// axiosConfig.ts

import axios, { AxiosInstance } from 'axios';
export const BASE_URL='http://localhost:3002';
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL, // Replace with your API base URL
  headers: {
    'Content-Type': 'application/json',
    Authorization: localStorage.getItem('token'),
  },
});

export default axiosInstance;
