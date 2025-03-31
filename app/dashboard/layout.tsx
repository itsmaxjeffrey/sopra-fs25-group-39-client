import Sidebar from "@/components/sidebar/sidebar";
import LayoutWrapper from "./layout-wrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutWrapper>
      <div style={{ display: "flex" }}>
        <Sidebar />
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </LayoutWrapper>
  );
}
