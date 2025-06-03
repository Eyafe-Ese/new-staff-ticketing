"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";

const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});
const otpSchema = z.object({
  otp: z.string().min(4, { message: "Enter the OTP sent to your email" }),
});
const passwordSchema = z.object({
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type EmailForm = z.infer<typeof emailSchema>;
type OtpForm = z.infer<typeof otpSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Step 1: Email
  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  // Step 2: OTP
  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  // Step 3: New Password
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });

  // Simulate API calls
  const handleSendEmail = emailForm.handleSubmit((data) => {
    setError(null);
    setEmail(data.email);
    // Simulate API call
    setTimeout(() => {
      setStep(2);
    }, 800);
  });

  const handleVerifyOtp = otpForm.handleSubmit((data) => {
    setError(null);
    // Simulate API call
    setTimeout(() => {
      if (data.otp === "1234") {
        // For demo, accept 1234 as valid OTP
        setStep(3);
      } else {
        setError("Invalid OTP. Please try again.");
      }
    }, 800);
  });

  const handleSetPassword = passwordForm.handleSubmit(() => {
    setError(null);
    // Simulate API call
    setTimeout(() => {
      setSuccess("Password reset successful! You can now sign in.");
      setStep(4);
    }, 800);
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="relative w-12 h-12 mb-2">
            <Image
              src="/logo.png"
              alt="GTCO Logo"
              fill
              sizes="48px"
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Forgot Password
          </CardTitle>
          <CardDescription>
            {step === 1 && "Enter your email to reset your password"}
            {step === 2 && `Enter the OTP sent to ${email}`}
            {step === 3 && "Set your new password"}
            {step === 4 && "Password reset complete!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          {step === 1 && (
            <Form {...emailForm}>
              <form onSubmit={handleSendEmail} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Send OTP
                </Button>
              </form>
            </Form>
          )}
          {step === 2 && (
            <Form {...otpForm}>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OTP</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter OTP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Verify OTP
                </Button>
              </form>
            </Form>
          )}
          {step === 3 && (
            <Form {...passwordForm}>
              <form onSubmit={handleSetPassword} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="New password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Set New Password
                </Button>
              </form>
            </Form>
          )}
          {step === 4 && (
            <div className="text-center space-y-4">
              <Alert variant="success">
                <AlertDescription>
                  Password reset successful! You can now{" "}
                  <Link href="/login" className="text-primary underline">
                    sign in
                  </Link>
                  .
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm text-primary hover:underline">
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
