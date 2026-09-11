import { useLocation } from "react-router-dom";
import { TopNavbar } from "@/components/TopNavbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hideNavbar = location.pathname === "/";
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!hideNavbar && <TopNavbar />}
      <div className="flex-1">{children}</div>
    </div>
  );
}
