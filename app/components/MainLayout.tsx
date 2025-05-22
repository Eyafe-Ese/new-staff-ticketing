"use client";

import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/Sidebar";
import { useState, useEffect } from "react";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-gray-50">
        {/* Mobile overlay for sidebar */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        {/* Sidebar - hidden by default on mobile, shown when menu is open */}
        <div 
          className={`fixed inset-y-0 left-0 z-40 lg:relative lg:z-0 transform ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } transition-transform duration-300 ease-in-out`}
        >
          <Sidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
        </div>
        
        {/* Main content area */}
        <div className="flex flex-col flex-1 w-full overflow-hidden">
          <Header 
            onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            isMobileMenuOpen={isMobileMenuOpen} 
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="min-h-[calc(100%-2rem)]">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 