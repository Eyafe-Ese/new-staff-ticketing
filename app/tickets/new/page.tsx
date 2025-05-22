"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Upload, X, Check, Copy, AlertTriangle } from "lucide-react";
import { useComplaintCategories } from "@/hooks/useComplaintCategories";
import { useDepartments } from "@/hooks/useDepartments";
import { createFileUploadRequest } from "@/utils/api";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AxiosProgressEvent } from "axios";

// Form schema
const formSchema = z.object({
  title: z.string().min(5, { message: "Subject must be at least 5 characters" }).max(200, { message: "Subject cannot exceed 200 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }).max(2000, { message: "Description cannot exceed 2000 characters" }),
  categoryId: z.string({ required_error: "Please select a category" }),
  departmentId: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

// Define the form values type explicitly
type FormValues = z.infer<typeof formSchema>;

export default function NewTicketPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  
  // Fetch categories and departments from API
  const { complaintCategories, isLoading: categoriesLoading } = useComplaintCategories();
  const { departments, isLoading: departmentsLoading } = useDepartments();

  const form = useForm<FormValues>({
    // Using type assertion due to complex type incompatibilities with react-hook-form and zod
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      departmentId: "",
      isAnonymous: false,
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setIsSubmitting(true);
    setFormError(null);
    setUploadProgress(0);
    
    try {
      // Create FormData for multipart/form-data submission
      const formData = new FormData();
      
      // Add form fields
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('categoryId', values.categoryId);
      formData.append('isAnonymous', values.isAnonymous.toString());
      
      // Add department only if selected
      if (values.departmentId) {
        formData.append('departmentId', values.departmentId);
      }
      
      // Add file attachments
      attachments.forEach(file => {
        formData.append('files', file);
      });
      
      // Show toast indicating upload has started
      const loadingToast = toast.loading("Uploading complaint and attachments...");
      
      // Use the file upload utility with extended timeout and progress tracking
      const response = await createFileUploadRequest('/complaints/with-attachments', formData, {
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          } else {
            // If total is undefined, just show that upload is in progress
            setUploadProgress(-1); // Use a special value to indicate indeterminate progress
          }
        }
      });
      
      // Dismiss the loading toast
      toast.dismiss(loadingToast);
      
      toast.success("Complaint submitted successfully");
      
      // Debug response data
      console.log("Complaint submission response:", response.data);
      
      // If this is an anonymous complaint, store the tracking token
      // Check both response.data.trackingToken and response.data.data.trackingToken patterns
      const trackingTokenValue = response.data?.trackingToken || response.data?.data?.trackingToken;
      
      if (values.isAnonymous && trackingTokenValue) {
        setTrackingToken(trackingTokenValue);
        setShowTokenModal(true);
        
        // Reset the form after successful submission
        form.reset();
        setAttachments([]);
      } else {
        // Navigate to my-tickets if not anonymous
        router.push("/my-tickets");
      }
    } catch (error: unknown) {
      console.error("Error submitting complaint:", error);
      
      // Handle timeout errors specifically
      const err = error as { code?: string; response?: { status: number; data: { message: string | string[] } } };
      
      if (err.code === 'ECONNABORTED') {
        toast.error("Request timed out. Your complaint may still have been created. Please check your complaints list.");
        // Navigate to my-tickets to let the user check if their complaint was created
        router.push("/my-tickets");
        return;
      }
      
      // Handle specific API error responses
      if (err.response) {
        const { status, data } = err.response;
        
        if (status === 400 && data.message) {
          // Show validation errors
          const errorMessage = Array.isArray(data.message) 
            ? data.message.join(', ') 
            : data.message;
          setFormError(errorMessage);
          toast.error(errorMessage);
        } else if (status === 401) {
          toast.error("You are not authorized to submit complaints. Please log in again.");
          router.push("/login");
        } else if (status === 413) {
          toast.error("The total size of your attachments is too large.");
        } else {
          toast.error("Failed to submit complaint. Please try again.");
        }
      } else {
        toast.error("Failed to submit complaint. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
  };
  
  const processFiles = (files: File[]) => {
    // Check if adding these files would exceed a reasonable limit
    if (attachments.length + files.length > 10) {
      toast.error("You can only attach up to 10 files to a complaint");
      return;
    }
    
    const validFiles = files.filter(file => {
      // Update file validation to match API requirements
      const isValidType = file.type.startsWith('image/jpeg') || 
                         file.type.startsWith('image/png') || 
                         file.type.startsWith('image/gif') || 
                         file.type.startsWith('image/webp') ||
                         file.type.startsWith('application/pdf');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isValidType) {
        toast.error(`${file.name} is not a supported file type. Only images (JPEG, PNG, GIF, WEBP) and PDFs are allowed.`);
      }
      if (!isValidSize) {
        toast.error(`${file.name} exceeds 5MB size limit.`);
      }
      
      return isValidType && isValidSize;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const copyTrackingToken = async () => {
    if (trackingToken) {
      try {
        await navigator.clipboard.writeText(trackingToken);
        setIsCopied(true);
        toast.success("Tracking token copied to clipboard");
        setTimeout(() => setIsCopied(false), 2000);
      } catch {
        toast.error("Failed to copy tracking token");
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">New Complaint</h1>
        <p className="text-muted-foreground">Submit a new complaint or request</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Complaint Details</CardTitle>
          <CardDescription>Fill in the details of your complaint</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of the issue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please provide detailed information about your complaint"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Be specific and include any relevant details that will help us understand and address your complaint.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select a category"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {complaintCategories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={departmentsLoading ? "Loading departments..." : "Select a department"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map(department => (
                            <SelectItem key={department.id} value={department.id}>
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select a department to assign this complaint to (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isAnonymous"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Anonymous Submission</FormLabel>
                      <FormDescription>
                        Submit this complaint anonymously. Your identity will not be revealed.
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

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Attachments</label>
                  <FormDescription className="text-xs mt-1">
                    Upload images or PDFs as evidence for your complaint. Maximum 10 files, each up to 5MB.
                  </FormDescription>
                  <div className="mt-2">
                    <div 
                      className={`border-2 ${isDragging ? 'border-primary' : 'border-dashed'} rounded-lg p-4 flex flex-col items-center justify-center bg-primary/5 transition-colors`}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                        multiple
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center w-full"
                      >
                        <Upload className={`h-8 w-8 mb-2 ${isDragging ? 'text-primary' : 'text-primary/60'}`} />
                        <span className={`text-sm ${isDragging ? 'text-primary font-medium' : 'text-primary'}`}>
                          {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">Supported: JPEG, PNG, GIF, WEBP, PDF</span>
                        <span className="text-xs text-muted-foreground">Max size: 5MB per file</span>
                        <span className="text-xs text-primary font-medium mt-1">You can select multiple files</span>
                      </label>
                    </div>
                  </div>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground mb-2">
                      {attachments.length} {attachments.length === 1 ? 'file' : 'files'} selected
                    </div>
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-primary/5 rounded p-2">
                        <div className="flex items-center gap-2">
                          {file.type.startsWith("image/jpeg") || file.type.startsWith("image/jpg") ? (
                            <span className="w-6 h-6 flex items-center justify-center bg-primary/10 rounded">🖼️</span>
                          ) : file.type.startsWith("image/png") ? (
                            <span className="w-6 h-6 flex items-center justify-center bg-primary/10 rounded">🖼️</span>
                          ) : file.type.startsWith("image/gif") ? (
                            <span className="w-6 h-6 flex items-center justify-center bg-primary/10 rounded">🖼️</span>
                          ) : file.type.startsWith("image/webp") ? (
                            <span className="w-6 h-6 flex items-center justify-center bg-primary/10 rounded">🖼️</span>
                          ) : file.type.startsWith("application/pdf") ? (
                            <span className="w-6 h-6 flex items-center justify-center bg-primary/10 rounded">📄</span>
                          ) : (
                            <span className="w-6 h-6 flex items-center justify-center bg-primary/10 rounded">📎</span>
                          )}
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {formError && (
                <div className="bg-destructive/10 p-3 rounded-md border border-destructive">
                  <p className="text-destructive font-medium text-sm">{formError}</p>
                </div>
              )}

              {isSubmitting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Upload progress</span>
                    {uploadProgress >= 0 ? (
                      <span>{uploadProgress}%</span>
                    ) : (
                      <span>Processing...</span>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    {uploadProgress >= 0 ? (
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    ) : (
                      <div className="bg-primary h-2.5 rounded-full animate-pulse w-full"></div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadProgress > 0 ? `Uploading ${uploadProgress}%` : 
                       uploadProgress === -1 ? "Processing..." : "Submitting..."}
                    </>
                  ) : (
                    "Submit Complaint"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Tracking Token Modal */}
      <Dialog 
        open={showTokenModal} 
        onOpenChange={(open) => {
          setShowTokenModal(open);
          // If modal is closed, don't navigate away
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Complaint Submitted Successfully
            </DialogTitle>
            <DialogDescription>
              Your anonymous complaint has been received and will be reviewed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <h3 className="font-medium text-amber-800">Important: Save Your Tracking Token</h3>
                  <p className="text-sm text-amber-700">
                    Please save this tracking token to check the status of your complaint in the future.
                    <strong className="block mt-1">This token will only be shown once!</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium text-sm">Your Tracking Token:</div>
              <div className="flex gap-2">
                <div className="flex-1 font-mono text-sm bg-muted p-3 rounded-md overflow-auto break-all">
                  {trackingToken}
                </div>
                <Button 
                  type="button" 
                  size="icon" 
                  onClick={copyTrackingToken}
                  className="flex-shrink-0"
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowTokenModal(false);
                // Don't navigate away, just close the modal
              }}
            >
              Close
            </Button>
            <Button
              type="button"
              asChild
            >
              <Link href={`/track-complaint?token=${trackingToken}`}>
                Track Your Complaint
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 