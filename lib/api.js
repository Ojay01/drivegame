

import axios from "axios";


export const DRIVES_URL = 'http://localhost:8000/api/drives';
  // process.env.NEXT_PUBLIC_DRIVES_URL || "https://betpool.online/api/drives";

export const createApiClient = (authToken) => {
  return axios.create({
    baseURL: DRIVES_URL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
  });
};

export const createPublicApiClient = () => {
  return axios.create({
    baseURL: DRIVES_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};
