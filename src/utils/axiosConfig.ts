// axiosConfig.ts

import axios, { AxiosInstance } from 'axios';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000', // Replace with your API base URL
  headers: {
    'Content-Type': 'application/json',
    Authorization: localStorage.getItem('token'),
  },
});

export default axiosInstance;
