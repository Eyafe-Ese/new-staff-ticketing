"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  login,
  selectAuthError,
  selectAuthStatus,
  selectIsAuthenticated,
} from "@/store/authSlice";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppDispatch } from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Shield, Search, MessageSquare, UserCheck } from "lucide-react";

// Define the form schema
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

// FormValues type is directly used in the useForm call, no need to declare separately

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const authStatus = useSelector(selectAuthStatus);
  const authError = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = authStatus === "loading";
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Create form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Form submission handler
  const onSubmit = form.handleSubmit((data) => {
    // Add rememberMe: true to always remember the user
    dispatch(login({ ...data }))
      .then((result) => {
        if (result.meta.requestStatus === "fulfilled") {
          toast.success("Login successful!");
          router.push("/");
        }
      })
      .catch((error) => {
        console.error("Login error:", error);
      });
  });

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding and Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 text-white">
        <div className="space-y-8">
          <div className="relative w-16 h-16">
            <Image
              src="/logo/logo.png"
              alt="GTCO Logo"
              fill
              sizes="64px"
              style={{ objectFit: "contain" }}
              priority
              // className="brightness-0 invert"
            />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">
              Welcome to Staff Complaint Portal
            </h1>
            <p className="text-lg text-white/80">
              A secure platform for managing and resolving workplace concerns
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-semibold">Secure & Confidential</h3>
              <p className="text-sm text-white/70">
                Your concerns are handled with utmost confidentiality
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-semibold">Track Progress</h3>
              <p className="text-sm text-white/70">
                Monitor the status of your complaints in real-time
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-semibold">Direct Communication</h3>
              <p className="text-sm text-white/70">
                Stay connected with HR through the platform
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold">Anonymous Option</h3>
              <p className="text-sm text-white/70">
                Submit concerns anonymously if preferred
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm text-white/60">
          © {new Date().getFullYear()} GTCO. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4">
          <div className="space-y-1 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900">
              Enter your credentials to access your account
            </h2>
          </div>

          <Card className="border-0 shadow-none">
            <CardContent className="pt-4">
              <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-4">
                  {authError && (
                    <Alert variant="destructive">
                      <AlertDescription>{authError}</AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="user@example.com" {...field} />
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
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-500" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-500" />
                              )}
                              <span className="sr-only">
                                {showPassword
                                  ? "Hide password"
                                  : "Show password"}
                              </span>
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/contact-admin"
              className="text-primary hover:underline"
            >
              Contact your administrator
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
