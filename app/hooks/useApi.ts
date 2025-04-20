import { ApiService } from "@/api/apiService";
import { useMemo } from "react"; // think of usememo like a singleton, it ensures only one instance exists
import useLocalStorage from "./useLocalStorage";

export const useApi = () => {
  const { value: token } = useLocalStorage("token", null);
  const { value: userId } = useLocalStorage("userId", null);

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
