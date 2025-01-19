import axios, { AxiosInstance } from 'axios';
export const BASE_URL = process.env.REACT_APP_BASE_URL;
export const ST_BASE_URL = process.env.REACT_APP_ST_BASE_URL;

const axiosInstance: AxiosInstance = axios.create({
  baseURL: ST_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: localStorage.getItem('token'),
  },
});

export default axiosInstance;
