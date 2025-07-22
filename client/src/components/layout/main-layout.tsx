import { ReactNode } from "react";
import SidebarNavigation from "./sidebar-navigation";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarNavigation />
      <main className="flex-1 lg:ml-64">
        <div className="px-4 py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}