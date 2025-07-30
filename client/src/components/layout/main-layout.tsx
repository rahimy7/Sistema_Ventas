import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SidebarNavigation from "@/components/layout/sidebar-navigation";
import { Menu } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarNavigation />
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">AutoParts</h1>
          </div>
        </div>

        {/* Mobile Content */}
        <main className="flex-1">
          <div className="container mx-auto p-4">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-shrink-0">
        <SidebarNavigation />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header - opcional, solo si necesitas mostrar algo más */}
        <header className="bg-white border-b border-gray-200 lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SidebarNavigation />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900">AutoParts</h1>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}