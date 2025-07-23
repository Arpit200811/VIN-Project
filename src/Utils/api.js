import axios from 'axios';

const API = axios.create({
  baseURL: 'https://vin-project-backend.onrender.com/api', // ✅ Correct base
  withCredentials: false, // ✅ or true if using cookies
});
// const res = await API.post('/auth/signup', form);

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;