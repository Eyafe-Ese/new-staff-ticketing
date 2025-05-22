'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, Bell, AlertCircle, ShoppingCart, Package, User, Info } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, subDays, subHours, subMinutes } from 'date-fns';

// Generate mock notifications
const generateMockNotifications = () => {
  const now = new Date();
  
  return [
    {
      id: 1,
      title: 'New Order Received',
      message: 'Order #ORD-001 has been placed',
      time: subMinutes(now, 5).toISOString(),
      read: false,
      type: 'order',
      actionUrl: '/admin/orders/ORD-001',
    },
    {
      id: 2,
      title: 'Low Stock Alert',
      message: 'Product "Wireless Earbuds" is running low on stock',
      time: subHours(now, 1).toISOString(),
      read: false,
      type: 'inventory',
      actionUrl: '/admin/products/PROD-001',
    },
    {
      id: 3,
      title: 'Payment Successful',
      message: 'Payment for Order #ORD-003 has been confirmed',
      time: subHours(now, 3).toISOString(),
      read: true,
      type: 'order',
      actionUrl: '/admin/orders/ORD-003',
    },
    {
      id: 4,
      title: 'New User Registration',
      message: 'A new customer has registered on the platform',
      time: subDays(now, 1).toISOString(),
      read: true,
      type: 'user',
      actionUrl: '/admin/users/USR-001',
    },
    {
      id: 5,
      title: 'Order Shipped',
      message: 'Order #ORD-002 has been shipped',
      time: subHours(now, 6).toISOString(),
      read: false,
      type: 'order',
      actionUrl: '/admin/orders/ORD-002',
    },
    {
      id: 6,
      title: 'System Update',
      message: 'The system will undergo maintenance in 2 days',
      time: subDays(now, 2).toISOString(),
      read: true,
      type: 'system',
      actionUrl: '#',
    },
    {
      id: 7,
      title: 'Product Review',
      message: 'New review for "Smart Watch" - 5 stars',
      time: subDays(now, 3).toISOString(),
      read: true,
      type: 'product',
      actionUrl: '/admin/products/PROD-002',
    },
    {
      id: 8,
      title: 'Stock Replenished',
      message: 'Inventory for "Bluetooth Speaker" has been updated',
      time: subHours(now, 12).toISOString(),
      read: true,
      type: 'inventory',
      actionUrl: '/admin/products/PROD-003',
    },
    {
      id: 9,
      title: 'Order Cancelled',
      message: 'Order #ORD-005 has been cancelled by the customer',
      time: subDays(now, 4).toISOString(),
      read: false,
      type: 'order',
      actionUrl: '/admin/orders/ORD-005',
    },
    {
      id: 10,
      title: 'Staff Account Created',
      message: 'New staff account for "Jane Smith" has been created',
      time: subDays(now, 5).toISOString(),
      read: true,
      type: 'user',
      actionUrl: '/admin/users/USR-002',
    },
  ];
};

// Format the relative time
const formatRelativeTime = (dateString: string) => {
  const date = parseISO(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    return format(date, 'MMM d, yyyy');
  }
};

// Get icon for notification type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'order':
      return <ShoppingCart className="h-5 w-5" />;
    case 'inventory':
      return <Package className="h-5 w-5" />;
    case 'user':
      return <User className="h-5 w-5" />;
    case 'system':
      return <AlertCircle className="h-5 w-5" />;
    case 'product':
      return <Package className="h-5 w-5" />;
    default:
      return <Info className="h-5 w-5" />;
  }
};

// Get color for notification type
const getNotificationColor = (type: string) => {
  switch (type) {
    case 'order':
      return 'bg-blue-100 text-blue-800';
    case 'inventory':
      return 'bg-yellow-100 text-yellow-800';
    case 'user':
      return 'bg-green-100 text-green-800';
    case 'system':
      return 'bg-red-100 text-red-800';
    case 'product':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(generateMockNotifications());
  const [activeTab, setActiveTab] = useState('all');
  
  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      read: true
    })));
    toast.success('All notifications marked as read');
  };
  
  // Mark single notification as read
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };
  
  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    return notification.type === activeTab;
  });
  
  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            View and manage your notifications
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>
            You have {unreadCount} unread notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                All
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {notifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="order">Orders</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="user">Users</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
            
            <div className="space-y-1">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'unread' 
                      ? "You've read all your notifications" 
                      : "You don&apos;t have any notifications yet"}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 rounded-lg border ${notification.read ? '' : 'bg-muted/30'}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-medium">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(notification.time)}
                            </span>
                            {!notification.read && (
                              <Badge variant="secondary" className="h-2 w-2 rounded-full bg-primary p-0" />
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="h-auto p-0 text-xs"
                            asChild
                          >
                            <a href={notification.actionUrl}>View details</a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 