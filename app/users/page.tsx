'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { UserPlus, Edit, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { queryClient } from '@/lib/react-query';
import { toast } from 'sonner';
import { RoleProtectedRoute } from '@/components/RoleProtectedRoute';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Define user interface
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  orders: number;
}

// Define the form schema
const userFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  role: z.enum(['Admin', 'Manager', 'Staff', 'Customer'], {
    required_error: 'Please select a role',
  }),
  status: z.enum(['Active', 'Inactive'], {
    required_error: 'Please select a status',
  }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

// Generate more mock data for pagination demonstration
const generateMockUsers = (count: number) => {
  const roles = ['Admin', 'Manager', 'Staff', 'Customer'];
  const statuses = ['Active', 'Inactive'];
  const users = [];
  
  // First add the original 7 users
  users.push(
    { id: '1', name: 'John Admin', email: 'admin@example.com', role: 'Admin', status: 'Active', lastLogin: '2023-06-09', orders: 0 },
    { id: '2', name: 'Jane Manager', email: 'manager@example.com', role: 'Manager', status: 'Active', lastLogin: '2023-06-08', orders: 0 },
    { id: '3', name: 'Bob Staff', email: 'staff@example.com', role: 'Staff', status: 'Active', lastLogin: '2023-06-07', orders: 0 },
    { id: '4', name: 'Alice Customer', email: 'alice@example.com', role: 'Customer', status: 'Active', lastLogin: '2023-06-10', orders: 5 },
    { id: '5', name: 'Mike Customer', email: 'mike@example.com', role: 'Customer', status: 'Active', lastLogin: '2023-06-06', orders: 3 },
    { id: '6', name: 'Sarah Customer', email: 'sarah@example.com', role: 'Customer', status: 'Inactive', lastLogin: '2023-05-20', orders: 1 },
    { id: '7', name: 'Tom Customer', email: 'tom@example.com', role: 'Customer', status: 'Active', lastLogin: '2023-06-09', orders: 2 }
  );
  
  // Then add additional users
  for (let i = 8; i <= count; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    const isCustomer = role === 'Customer';
    users.push({
      id: `${i}`,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      role,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      lastLogin: `2023-06-${Math.floor(Math.random() * 30) + 1}`,
      orders: isCustomer ? Math.floor(Math.random() * 10) : 0
    });
  }
  
  return users;
};

// Mock data fetch function
const fetchUsers = async (page = 1, pageSize = 10) => {
  // In a real app, this would be an API call with pagination
  // return await api.get(`/api/users?page=${page}&limit=${pageSize}`);
  
  const allUsers = generateMockUsers(100);
  
  // Apply pagination manually
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, allUsers.length);
  const paginatedUsers = allUsers.slice(startIndex, endIndex);
  
  // Mock API response format
  return {
    data: paginatedUsers,
    meta: {
      total: allUsers.length,
      page,
      limit: pageSize,
      totalPages: Math.ceil(allUsers.length / pageSize)
    }
  };
};

export default function UsersPage() {
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch users with pagination
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users', currentPage, pageSize],
    queryFn: () => fetchUsers(currentPage, pageSize),
    placeholderData: (previousData) => previousData,
  });

  const users = usersResponse?.data || [];
  const pagination = usersResponse?.meta;

  // Form setup
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'Staff',
      status: 'Active',
    },
  });

  // Separate staff and customers
  const staffUsers = users.filter(user => ['Admin', 'Manager', 'Staff'].includes(user.role)) || [];
  const customerUsers = users.filter(user => user.role === 'Customer') || [];

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Mutation for adding a new user
  const addUserMutation = useMutation({
    mutationFn: async (userData: UserFormValues) => {
      // In a real app, this would be an API call
      // return await api.post('/api/users', userData);
      
      // For now, simulate a successful response
      console.log('Adding user:', userData);
      return { id: String(users?.length ? users.length + 1 : 1), ...userData };
    },
    onSuccess: (newUser) => {
      toast.success(`User ${newUser.name} added successfully`);
      setIsAddUserDialogOpen(false);
      form.reset();
      
      // In a real app, this would refetch the users
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast.error('Failed to add user');
      console.error('Error adding user:', error);
    },
  });

  // Form submission handler
  const onSubmit = (data: UserFormValues) => {
    addUserMutation.mutate(data);
  };

  // Mutation for impersonating a user
  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('Impersonating user:', userId);
      return userId;
    },
    onSuccess: (userId) => {
      const foundUser = users?.find(u => u.id === userId);
      toast.success(`You are now impersonating ${foundUser?.name}`);
    },
    onError: () => {
      toast.error('Failed to impersonate user');
    },
  });

  const handleImpersonate = (userId: string) => {
    impersonateMutation.mutate(userId);
  };

  // Define columns for all users table
  const allUsersColumns = [
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' },
    { 
      key: 'role', 
      title: 'Role',
    },
    { 
      key: 'status', 
      title: 'Status',
      render: (foundUser: User) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          foundUser.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {foundUser.status}
        </span>
      )
    },
    { key: 'lastLogin', title: 'Last Login' },
    { key: 'orders', title: 'Orders' },
    { 
      key: 'actions', 
      title: 'Actions',
      render: (foundUser: User) => (
        <div className="flex justify-end space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            title={`Edit ${foundUser.name}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {foundUser.role === 'Customer' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleImpersonate(foundUser.id);
              }}
            >
              <User className="mr-2 h-4 w-4" />
              Impersonate
            </Button>
          )}
        </div>
      )
    },
  ];

  // Define columns for staff users table
  const staffUsersColumns = [
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' },
    { key: 'role', title: 'Role' },
    { 
      key: 'status', 
      title: 'Status',
      render: (foundUser: User) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          foundUser.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {foundUser.status}
        </span>
      )
    },
    { key: 'lastLogin', title: 'Last Login' },
    { 
      key: 'actions', 
      title: 'Actions',
      render: (foundUser: User) => (
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="icon"
            title={`Edit ${foundUser.name}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ];

  // Define columns for customer users table
  const customerUsersColumns = [
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' },
    { 
      key: 'status', 
      title: 'Status',
      render: (foundUser: User) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          foundUser.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {foundUser.status}
        </span>
      )
    },
    { key: 'lastLogin', title: 'Last Login' },
    { key: 'orders', title: 'Orders' },
    { 
      key: 'actions', 
      title: 'Actions',
      render: (foundUser: User) => (
        <div className="flex justify-end space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            title={`Edit ${foundUser.name}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleImpersonate(foundUser.id);
            }}
          >
            <User className="mr-2 h-4 w-4" />
            Impersonate
          </Button>
        </div>
      )
    },
  ];

  // Define filters
  const roleFilter = {
    key: 'role',
    title: 'Role',
    options: [
      { label: 'Admin', value: 'Admin' },
      { label: 'Manager', value: 'Manager' },
      { label: 'Staff', value: 'Staff' },
      { label: 'Customer', value: 'Customer' },
    ],
  };

  const statusFilter = {
    key: 'status',
    title: 'Status',
    options: [
      { label: 'Active', value: 'Active' },
      { label: 'Inactive', value: 'Inactive' },
    ],
  };

  return (
    <RoleProtectedRoute requiredRole="admin" fallbackPath="/">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">Manage your staff and customers</p>
          </div>
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account. Click save when you&apos;re done.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormDescription>
                          Password must be at least 6 characters.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Admin">Admin</SelectItem>
                              <SelectItem value="Manager">Manager</SelectItem>
                              <SelectItem value="Staff">Staff</SelectItem>
                              <SelectItem value="Customer">Customer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => setIsAddUserDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={addUserMutation.isPending}
                    >
                      {addUserMutation.isPending ? 'Adding...' : 'Add User'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <DataTable
              data={users}
              columns={allUsersColumns}
              searchable
              searchKeys={['name', 'email']}
              filters={[roleFilter, statusFilter]}
              pageSize={pageSize}
              isLoading={isLoading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </TabsContent>
          
          <TabsContent value="staff">
            <DataTable
              data={staffUsers}
              columns={staffUsersColumns}
              searchable
              searchKeys={['name', 'email']}
              filters={[
                {
                  key: 'role',
                  title: 'Role',
                  options: [
                    { label: 'Admin', value: 'Admin' },
                    { label: 'Manager', value: 'Manager' },
                    { label: 'Staff', value: 'Staff' },
                  ],
                },
                statusFilter
              ]}
              pageSize={pageSize}
              isLoading={isLoading}
              pageSizeOptions={[10, 25, 50]}
            />
          </TabsContent>
          
          <TabsContent value="customers">
            <DataTable
              data={customerUsers}
              columns={customerUsersColumns}
              searchable
              searchKeys={['name', 'email']}
              filters={[statusFilter]}
              pageSize={pageSize}
              isLoading={isLoading}
              pageSizeOptions={[10, 25, 50]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </RoleProtectedRoute>
  );
} 