"use client";

import '@ant-design/v5-patch-for-react-19';
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getApiDomain } from "@/utils/domain";


const BASE_URL = getApiDomain(); // Define BASE_URL

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");

      // try {
      //   const res = await fetch("${BASE_URL}/api/v1/auth/refresh", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ token }),
      //   });

      //   if (!res.ok) {
      //     localStorage.removeItem("token");
      //     localStorage.removeItem("userId");
      //     router.push("/login");
      //   } else {
      //     const data = await res.json();
      //     localStorage.setItem("token", data.token);
      //   }
      // } catch (err) {
      //   console.error("Auth check failed:", err);
      //   localStorage.removeItem("token");
      //   localStorage.removeItem("userId");
      //   router.push("/login");
      // }
    };

    checkAuth();
  }, [pathname, router]);

  return <>{children}</>;
};

export default LayoutWrapper;
