"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");

      try {
        const res = await fetch("http://localhost:8080/api/v1/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("id");
          router.push("/login");
        } else {
          const data = await res.json();
          localStorage.setItem("token", data.token);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("id");
        router.push("/login");
      }
    };

    checkAuth();
  }, [pathname]);

  return <>{children}</>;
};

export default LayoutWrapper;
