"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";

// Payment settings schema
const paymentSchema = z.object({
  stripeEnabled: z.boolean(),
  stripePublicKey: z.string().min(1, "Stripe public key is required"),
  stripeSecretKey: z.string().min(1, "Stripe secret key is required"),
  paypalEnabled: z.boolean(),
  paypalClientId: z.string().optional(),
  paypalSecretKey: z.string().optional(),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD"]),
});

// Shipping settings schema
const shippingSchema = z.object({
  enableFreeShipping: z.boolean(),
  freeShippingThreshold: z.coerce.number().min(0),
  defaultShippingRate: z.coerce.number().min(0),
  allowLocalPickup: z.boolean(),
  allowInternationalShipping: z.boolean(),
  internationalShippingRate: z.coerce.number().min(0),
});

// Tax settings schema
const taxSchema = z.object({
  enableTax: z.boolean(),
  taxRate: z.coerce.number().min(0).max(100),
  includeTaxInPrice: z.boolean(),
  enableVAT: z.boolean(),
  vatRate: z.coerce.number().min(0).max(100),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;
type ShippingFormValues = z.infer<typeof shippingSchema>;
type TaxFormValues = z.infer<typeof taxSchema>;

export default function SettingsPage() {
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isSavingShipping, setIsSavingShipping] = useState(false);
  const [isSavingTax, setIsSavingTax] = useState(false);

  // Payment form
  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      stripeEnabled: true,
      stripePublicKey: "pk_test_...",
      stripeSecretKey: "sk_test_...",
      paypalEnabled: false,
      paypalClientId: "",
      paypalSecretKey: "",
      currency: "USD",
    },
  });

  // Shipping form
  const shippingForm = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      enableFreeShipping: false,
      freeShippingThreshold: 100,
      defaultShippingRate: 10,
      allowLocalPickup: true,
      allowInternationalShipping: false,
      internationalShippingRate: 25,
    },
  });

  // Tax form
  const taxForm = useForm<TaxFormValues>({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      enableTax: true,
      taxRate: 7.5,
      includeTaxInPrice: false,
      enableVAT: false,
      vatRate: 20,
    },
  });

  // Payment settings mutation
  const paymentMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      setIsSavingPayment(true);
      try {
        // In a real app, this would be an API call
        // return await api.put('/api/settings/payment', data);
        console.log("Saving payment settings:", data);
        return data;
      } finally {
        setIsSavingPayment(false);
      }
    },
    onSuccess: () => {
      toast.success("Payment settings saved successfully");
    },
    onError: () => {
      toast.error("Failed to save payment settings");
    },
  });

  // Shipping settings mutation
  const shippingMutation = useMutation({
    mutationFn: async (data: ShippingFormValues) => {
      setIsSavingShipping(true);
      try {
        // In a real app, this would be an API call
        // return await api.put('/api/settings/shipping', data);
        console.log("Saving shipping settings:", data);
        return data;
      } finally {
        setIsSavingShipping(false);
      }
    },
    onSuccess: () => {
      toast.success("Shipping settings saved successfully");
    },
    onError: () => {
      toast.error("Failed to save shipping settings");
    },
  });

  // Tax settings mutation
  const taxMutation = useMutation({
    mutationFn: async (data: TaxFormValues) => {
      setIsSavingTax(true);
      try {
        // In a real app, this would be an API call
        // return await api.put('/api/settings/tax', data);
        console.log("Saving tax settings:", data);
        return data;
      } finally {
        setIsSavingTax(false);
      }
    },
    onSuccess: () => {
      toast.success("Tax settings saved successfully");
    },
    onError: () => {
      toast.error("Failed to save tax settings");
    },
  });

  // Handle form submissions
  const onSubmitPayment = (values: PaymentFormValues) => {
    paymentMutation.mutate(values);
  };

  const onSubmitShipping = (values: ShippingFormValues) => {
    shippingMutation.mutate(values);
  };

  const onSubmitTax = (values: TaxFormValues) => {
    taxMutation.mutate(values);
  };

  return (
    <RoleProtectedRoute requiredRole="admin" fallbackPath="/">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your store settings</p>
        </div>

        <Tabs defaultValue="payment" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
            <TabsTrigger value="tax">Tax</TabsTrigger>
          </TabsList>

          {/* Payment Settings Tab */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>
                  Configure your store payment methods and options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...paymentForm}>
                  <form
                    onSubmit={paymentForm.handleSubmit(onSubmitPayment)}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium">Stripe</h3>
                            <p className="text-sm text-muted-foreground">
                              Accept credit card payments via Stripe
                            </p>
                          </div>
                          <FormField
                            control={paymentForm.control}
                            name="stripeEnabled"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-3">
                          <FormField
                            control={paymentForm.control}
                            name="stripePublicKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Public Key</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="pk_test_..."
                                    {...field}
                                    disabled={
                                      !paymentForm.watch("stripeEnabled")
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={paymentForm.control}
                            name="stripeSecretKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Secret Key</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="sk_test_..."
                                    {...field}
                                    disabled={
                                      !paymentForm.watch("stripeEnabled")
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium">PayPal</h3>
                            <p className="text-sm text-muted-foreground">
                              Accept payments via PayPal
                            </p>
                          </div>
                          <FormField
                            control={paymentForm.control}
                            name="paypalEnabled"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-3">
                          <FormField
                            control={paymentForm.control}
                            name="paypalClientId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client ID</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="PayPal Client ID"
                                    {...field}
                                    disabled={
                                      !paymentForm.watch("paypalEnabled")
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={paymentForm.control}
                            name="paypalSecretKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Secret Key</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="PayPal Secret Key"
                                    {...field}
                                    disabled={
                                      !paymentForm.watch("paypalEnabled")
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <FormField
                        control={paymentForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="USD">
                                  USD - US Dollar
                                </SelectItem>
                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                <SelectItem value="GBP">
                                  GBP - British Pound
                                </SelectItem>
                                <SelectItem value="CAD">
                                  CAD - Canadian Dollar
                                </SelectItem>
                                <SelectItem value="AUD">
                                  AUD - Australian Dollar
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" disabled={isSavingPayment}>
                      {isSavingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Payment Settings"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipping Settings Tab */}
          <TabsContent value="shipping">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Settings</CardTitle>
                <CardDescription>
                  Configure shipping options and delivery methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...shippingForm}>
                  <form
                    onSubmit={shippingForm.handleSubmit(onSubmitShipping)}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border p-4 rounded-md">
                        <div>
                          <h3 className="font-medium">Free Shipping</h3>
                          <p className="text-sm text-muted-foreground">
                            Offer free shipping on orders above a threshold
                          </p>
                        </div>
                        <FormField
                          control={shippingForm.control}
                          name="enableFreeShipping"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={shippingForm.control}
                        name="freeShippingThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Free Shipping Threshold ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                disabled={
                                  !shippingForm.watch("enableFreeShipping")
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Orders above this amount will qualify for free
                              shipping
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={shippingForm.control}
                        name="defaultShippingRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Shipping Rate ($)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              The default shipping rate for domestic orders
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={shippingForm.control}
                        name="allowLocalPickup"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Local Pickup
                              </FormLabel>
                              <FormDescription>
                                Allow customers to pick up orders locally
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={shippingForm.control}
                        name="allowInternationalShipping"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                International Shipping
                              </FormLabel>
                              <FormDescription>
                                Allow shipping to international addresses
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={shippingForm.control}
                        name="internationalShippingRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              International Shipping Rate ($)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                disabled={
                                  !shippingForm.watch(
                                    "allowInternationalShipping"
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              The default shipping rate for international orders
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" disabled={isSavingShipping}>
                      {isSavingShipping ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Shipping Settings"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Settings Tab */}
          <TabsContent value="tax">
            <Card>
              <CardHeader>
                <CardTitle>Tax Settings</CardTitle>
                <CardDescription>
                  Configure sales tax and VAT options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...taxForm}>
                  <form
                    onSubmit={taxForm.handleSubmit(onSubmitTax)}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <FormField
                        control={taxForm.control}
                        name="enableTax"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Enable Sales Tax
                              </FormLabel>
                              <FormDescription>
                                Apply sales tax to eligible orders
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taxForm.control}
                        name="taxRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sales Tax Rate (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                disabled={!taxForm.watch("enableTax")}
                              />
                            </FormControl>
                            <FormDescription>
                              The default tax rate applied to orders
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taxForm.control}
                        name="includeTaxInPrice"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Include Tax in Product Prices
                              </FormLabel>
                              <FormDescription>
                                Product prices will be displayed with tax
                                included
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!taxForm.watch("enableTax")}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taxForm.control}
                        name="enableVAT"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Enable VAT
                              </FormLabel>
                              <FormDescription>
                                Apply Value Added Tax (VAT) to international
                                orders
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taxForm.control}
                        name="vatRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>VAT Rate (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                disabled={!taxForm.watch("enableVAT")}
                              />
                            </FormControl>
                            <FormDescription>
                              The VAT rate applied to eligible orders
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" disabled={isSavingTax}>
                      {isSavingTax ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Tax Settings"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleProtectedRoute>
  );
}
