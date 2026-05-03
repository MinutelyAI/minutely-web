import { createMinutelyApiClient } from "@minutely/shared/api";

export const apiBaseUrl = import.meta.env.VITE_BACKEND || "";

const clearAuthState = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("auth");
  localStorage.removeItem("user_email");
  window.dispatchEvent(new Event("unauthorized_api_call"));
};

export const minutelyApi = createMinutelyApiClient({
  baseUrl: apiBaseUrl,
  getToken: () => localStorage.getItem("token"),
  onUnauthorized: clearAuthState,
});

export const apiUrl = minutelyApi.url;

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const response = await minutelyApi.request(endpoint, options);
  if (response.status === 401) {
    throw new Error("Unauthorized");
  }
  return response;
};
