import { ApiService } from "@/api/apiService";
import { useMemo } from "react"; // think of usememo like a singleton, it ensures only one instance exists

export const useApi = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const userId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null;

  return useMemo(() => {
    const service = new ApiService();

    if (token) {
      service.setAuthToken(token);
    }
    if (userId) {
      service.setUserId(userId);
    }
    return service;
  }, [token, userId]);
};
