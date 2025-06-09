'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Tag,
  Users,
  PanelLeft,
  PanelRight,
  BarChart,
  Search,
  X
} from 'lucide-react';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { UserRole } from '@/store/authSlice';
import { Button } from '@/components/ui/button';

// Define the minimum role required for each nav item
const navItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    minRole: 'staff' as UserRole,
  },
  {
    title: 'My Tickets',
    href: '/my-tickets',
    icon: Tag,
    minRole: 'staff' as UserRole,
  },
  {
    title: 'Tickets',
    href: '/tickets',
    icon: Package,
    minRole: 'it_officer' as UserRole,
    subItems: [
      {
        title: 'All Tickets',
        href: '/tickets',
      },
      {
        title: 'Assigned to Me',
        href: '/tickets?assigned=me',
      },
      {
        title: 'New Tickets',
        href: '/tickets?status=new',
      },
      {
        title: 'In Progress',
        href: '/tickets?status=in_progress',
      },
    ],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart,
    minRole: 'it_officer' as UserRole,
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    minRole: 'hr_admin' as UserRole,
  },
];

// Public links that don't require authentication
const publicLinks = [
  {
    title: 'Track Complaint',
    href: '/track-complaint',
    icon: Search,
  }
];

// Helper functions for localStorage with error handling
const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToLocalStorage = <T,>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

interface SidebarProps {
  onMobileClose?: () => void;
}

export function Sidebar({ onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { hasRole } = useRoleCheck();
  const [collapsed, setCollapsed] = useState(() => getFromLocalStorage('sidebarCollapsed', false));
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    // Only save collapse state on desktop
    if (!isMobile) {
      saveToLocalStorage('sidebarCollapsed', collapsed);
      
      // Update body class for layout adjustments
      if (collapsed) {
        document.body.classList.add('sidebar-collapsed');
      } else {
        document.body.classList.remove('sidebar-collapsed');
      }
    }
  }, [collapsed, isMobile]);

  // When clicking a nav link on mobile, close the sidebar
  const handleNavClick = () => {
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  // Filter nav items based on user's role
  const authorizedNavItems = navItems.filter(item => hasRole(item.minRole));

  return (
    <div 
      className={cn(
        "h-screen bg-white border-r flex flex-col justify-between transition-all duration-300",
        isMobile ? "w-[280px]" : (collapsed ? "w-20" : "w-64")
      )}
    >
      <div>
        {/* Logo Section with close button on mobile */}
        <div className={cn(
          "pt-4 pb-2 flex items-center",
          collapsed && !isMobile ? "px-2 justify-center" : "px-6 justify-between"
        )}>
          <Link href="/" className={cn(
            "flex items-center",
            collapsed && !isMobile ? "justify-center" : ""
          )} onClick={handleNavClick}>
            {collapsed && !isMobile ? (
              <div className="w-12 h-12 relative">
                <Image 
                  src="/logo.png" 
                  alt="Staff Complaint Portal Logo" 
                  width={48} 
                  height={48}
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="flex items-center">
                <div className="w-10 h-10 relative mr-2">
                  <Image 
                    src="/logo.png" 
                    alt="Staff Complaint Portal Logo" 
                    width={40} 
                    height={40}
                    className="object-contain"
                    priority
                  />
                </div>
                <h2 className="text-lg font-bold text-primary">Complaint Portal</h2>
              </div>
            )}
          </Link>
          
          {/* Mobile close button */}
          {isMobile && onMobileClose && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onMobileClose}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        {/* Navigation Section - Make it scrollable if needed but contained */}
        <nav className="mt-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
          <ul className="space-y-1">
            {authorizedNavItems.map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={cn(
                    "flex items-center p-3 mx-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors",
                    pathname === item.href && "bg-primary/10 text-primary font-medium",
                    collapsed && !isMobile && "justify-center mx-2"
                  )}
                  title={collapsed && !isMobile ? item.title : undefined}
                  onClick={handleNavClick}
                >
                  <item.icon className={cn("h-5 w-5", (!collapsed || isMobile) && "mr-3")} />
                  {(!collapsed || isMobile) && item.title}
                </Link>
              </li>
            ))}
            
            {/* Divider between authorized and public links */}
            {publicLinks.length > 0 && (
              <li className="px-3 py-2">
                <div className={cn(
                  "border-t border-gray-200",
                  collapsed && !isMobile ? "mx-2" : "mx-0"
                )}></div>
              </li>
            )}
            
            {/* Public links that don't require authentication */}
            {publicLinks.map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={cn(
                    "flex items-center p-3 mx-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors",
                    pathname === item.href && "bg-primary/10 text-primary font-medium",
                    collapsed && !isMobile && "justify-center mx-2"
                  )}
                  title={collapsed && !isMobile ? item.title : undefined}
                  onClick={handleNavClick}
                >
                  <item.icon className={cn("h-5 w-5", (!collapsed || isMobile) && "mr-3")} />
                  {(!collapsed || isMobile) && item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Bottom section with collapse button only - hide on mobile */}
      {!isMobile && (
        <div className="mt-auto">
          <div className={cn(
            "px-4 py-4 border-t",
            collapsed ? "mx-2" : "mx-3"
          )}>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelRight className="h-5 w-5" />
              ) : (
                <>
                  <PanelLeft className="h-5 w-5 mr-2" />
                  <span>Collapse</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 