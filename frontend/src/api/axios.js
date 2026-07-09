import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";

const api = axios.create({
  baseURL: "https://k5piu4f4k3.execute-api.ap-southeast-1.amazonaws.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach Cognito JWT to every request
api.interceptors.request.use(
  async (config) => {
    const session = await fetchAuthSession();

    const token = session.tokens?.accessToken?.toString();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;