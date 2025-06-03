"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectCurrentUser } from "@/store/authSlice";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, Settings, UserCircle, X } from "lucide-react";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AppDispatch } from "@/store";

// Mock notifications for demonstration
const mockNotifications = [
  {
    id: 1,
    title: "New Order Received",
    message: "Order #ORD-001 has been placed",
    time: "5 minutes ago",
    read: false,
  },
  {
    id: 2,
    title: "Low Stock Alert",
    message: 'Product "Wireless Earbuds" is running low on stock',
    time: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    title: "Payment Successful",
    message: "Payment for Order #ORD-003 has been confirmed",
    time: "3 hours ago",
    read: true,
  },
  {
    id: 4,
    title: "New User Registration",
    message: "A new customer has registered on the platform",
    time: "1 day ago",
    read: true,
  },
];

export function Header({
  onMobileMenuToggle,
  isMobileMenuOpen,
}: {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState(mockNotifications);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const currentUser = useSelector(selectCurrentUser);
  const { userRole, isHRAdmin, isITOfficer } = useRoleCheck();

  // Get page title based on current path
  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard";
    if (pathname === "/my-tickets") return "My Tickets";
    if (pathname === "/tickets") return "Tickets";
    if (pathname === "/reports") return "Reports";
    if (pathname === "/users") return "Users";
    if (pathname === "/settings") return "Settings";
    if (pathname.startsWith("/my-tickets/")) return "Ticket Details";
    if (pathname === "/track-complaint") return "Track Complaint";
    return "Complaint Portal";
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
    toast.success("You have been logged out successfully");
  };

  // Format role for display purposes
  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getRoleBadgeColor = () => {
    if (isITOfficer()) return "bg-purple-100 text-purple-800";
    if (isHRAdmin()) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!currentUser?.name) return "U";
    return currentUser.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Get the user's avatar URL
  const getUserAvatar = () => {
    // Check if user has an avatar URL, otherwise return undefined
    return currentUser?.avatarUrl || currentUser?.profileImage || undefined;
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
    toast.success("All notifications marked as read");
  };

  // Count unread notifications
  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  // Check if user has access to settings
  const canAccessSettings = isHRAdmin() || isITOfficer();

  return (
    <header className="border-b bg-white">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          {onMobileMenuToggle && (
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-0 h-9 w-9"
              onClick={onMobileMenuToggle}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </Button>
          )}
          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Notifications Bell */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] md:w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4 pb-2">
                <h3 className="font-medium">Notifications</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto text-xs"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              <Separator />
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b last:border-b-0 ${
                        notification.read ? "" : "bg-muted/50"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-sm font-medium">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.time}
                          </p>
                        </div>
                        {!notification.read && (
                          <Badge
                            variant="secondary"
                            className="h-1.5 w-1.5 rounded-full bg-primary p-0"
                          />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Separator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-xs"
                  asChild
                >
                  <Link href="/notifications">View all notifications</Link>
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* User Avatar and Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getUserAvatar()} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="end">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getUserAvatar()} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{currentUser?.name}</p>
                  <p className="text-xs text-gray-500">{currentUser?.email}</p>
                  <span
                    className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor()}`}
                  >
                    {userRole ? formatRole(userRole) : "Staff"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-sm"
                  asChild
                >
                  <Link href="/profile">
                    <UserCircle className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </Button>
                {canAccessSettings && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-sm"
                    asChild
                  >
                    <Link href="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                )}
                <Separator className="my-2" />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-sm text-red-500 hover:text-red-500"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
