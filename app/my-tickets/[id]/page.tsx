"use client";

import Link from "next/link";
import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter, useParams } from "next/navigation";
import { Upload, X, Loader2, RefreshCw, ChevronLeft, ChevronRight, Download, Plus, FileText, File, Image as ImageIcon } from 'lucide-react';
import { toast } from "sonner";
import { useComplaint } from "@/hooks/useComplaint";
import { useComplaintComments } from "@/hooks/useComplaintComments";
import { useComplaintAttachments } from "@/hooks/useComplaintAttachments";
import Image from "next/image";
import { Attachment } from "@/hooks/useComplaints";

// Modal component for viewing attachments
const AttachmentModal = ({ 
  isOpen, 
  onClose, 
  attachments, 
  currentIndex, 
  onPrev, 
  onNext
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  attachments: Attachment[], 
  currentIndex: number,
  onPrev: () => void,
  onNext: () => void
}) => {
  // State to track if Next.js Image fails - moved outside of conditional rendering
  const [imageLoadError, setImageLoadError] = useState(false);
  
  if (!isOpen) return null;
  
  const attachment = attachments[currentIndex];
  const isImage = attachment.url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  const isPdf = attachment.url.match(/\.(pdf)$/i);
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b flex items-center justify-between">
          <div className="font-medium truncate max-w-[180px] sm:max-w-md">{attachment.filename}</div>
          <div className="flex items-center gap-1 sm:gap-2">
            <a 
              href={attachment.url} 
              download={attachment.filename}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5" />
            </a>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center">
          {isImage ? (
            <div className="relative w-full h-full min-h-[200px] sm:min-h-[300px]">
              {!imageLoadError ? (
                <Image 
                  src={attachment.url} 
                  alt={attachment.filename}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
                  className="object-contain"
                  priority
                  onError={() => setImageLoadError(true)}
                />
              ) : (
                // Fallback to regular img tag if Next.js Image fails
                <Image 
                  src={attachment.url} 
                  alt={attachment.filename}
                  width={800}
                  height={600}
                  className="max-w-full max-h-full object-contain mx-auto"
                  unoptimized
                />
              )}
            </div>
          ) : isPdf ? (
            <iframe 
              src={attachment.url} 
              className="w-full h-full min-h-[300px] sm:min-h-[500px]" 
              title={attachment.filename}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="text-4xl mb-4">📄</div>
              <div className="text-center">
                <p className="text-sm sm:text-base">This file can&apos;t be previewed.</p>
                <a 
                  href={attachment.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline mt-2 inline-block text-sm sm:text-base"
                >
                  Download the file
                </a>
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation */}
        {attachments.length > 1 && (
          <div className="p-3 sm:p-4 border-t flex items-center justify-between">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onPrev} 
              disabled={currentIndex === 0}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {currentIndex + 1} of {attachments.length}
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onNext}
              disabled={currentIndex === attachments.length - 1}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function TicketDetailPage() {
  const [comment, setComment] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [complaintFiles, setComplaintFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const complaintFileInputRef = useRef<HTMLInputElement>(null);
  
  const params = useParams();
  const ticketId = params.id as string;
  const router = useRouter();

  // Fetch ticket data
  const { complaint, isLoading, refetch } = useComplaint(ticketId);
  
  // Comment and attachment mutations
  const { 
    addComment: { mutateAsync: addComment, isPending: isAddingComment }
  } = useComplaintComments();
  const { 
    addAttachments: { mutateAsync: addAttachments, isPending: isAddingAttachments },
    deleteAttachment: { mutateAsync: deleteAttachment, isPending: isDeletingComplaintAttachment }
  } = useComplaintAttachments();

  // Handle sidebar collapse state persistence
  useEffect(() => {
    // Get the sidebar state from localStorage when component mounts
    const sidebarState = localStorage.getItem('sidebarCollapsed');
    
    // Apply the sidebar state to the DOM
    if (sidebarState === 'true') {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, []);

  // Handle back button if complaint not found
  useEffect(() => {
    if (!isLoading && !complaint) {
      toast.error("Ticket not found");
      router.push("/my-tickets");
    }
  }, [isLoading, complaint, router]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Ticket refreshed");
    } catch {
      toast.error("Failed to refresh ticket");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Open attachment modal
  const openAttachmentModal = (index: number) => {
    setCurrentAttachmentIndex(index);
    setModalOpen(true);
  };

  // Function to get file icon based on filename
  const getFileIcon = (filename: string) => {
    if (filename.match(/\.(jpeg|jpg|gif|png|webp)$/i)) return <ImageIcon className="h-4 w-4" />;
    if (filename.match(/\.(pdf)$/i)) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  // Navigate to next attachment
  const nextAttachment = () => {
    if (complaint?.attachments && currentAttachmentIndex < complaint.attachments.length - 1) {
      setCurrentAttachmentIndex(currentAttachmentIndex + 1);
    }
  };

  // Navigate to previous attachment
  const prevAttachment = () => {
    if (currentAttachmentIndex > 0) {
      setCurrentAttachmentIndex(currentAttachmentIndex - 1);
    }
  };

  // Handle upload progress with proper type
  const handleUploadProgress = (progressEvent: { loaded: number; total: number }) => {
    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    setUploadProgress(percentCompleted);
  };

  // Create validateFile with useCallback
  const validateFile = useCallback((file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'];
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes

    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please upload .jpg, .png, .mp4, or .pdf files only.');
      return false;
    }

    if (file.size > maxSize) {
      setUploadError('File size exceeds 25MB limit.');
      return false;
    }

    return true;
  }, []);

  // Create handleFilesSelect with useCallback, dependent on validateFile
  const handleFilesSelect = useCallback((filesToAdd: File[], forCommentSection: boolean = true) => {
    setUploadError(null);
    
    const validFiles = filesToAdd.filter(file => validateFile(file));
    if (validFiles.length > 0) {
      if (forCommentSection) {
        setCommentFiles(prev => [...prev, ...validFiles]);
      } else {
        setComplaintFiles(prev => [...prev, ...validFiles]);
      }
      
      if (validFiles.length === 1) {
        toast.success('File selected successfully');
      } else {
        toast.success(`${validFiles.length} files selected successfully`);
      }
    }
  }, [validateFile, setUploadError, setCommentFiles, setComplaintFiles]);

  // Fix useCallback dependencies
  const handleComplaintDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      handleFilesSelect(droppedFiles, false);
    }
  }, [handleFilesSelect, setIsDragging, setUploadError]);

  const handleCommentDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      handleFilesSelect(droppedFiles, true);
    }
  }, [handleFilesSelect, setIsDragging, setUploadError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleCommentFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFilesSelect(files, true);
    }
  };

  const handleComplaintFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFilesSelect(files, false);
    }
  };

  const handleRemoveFile = (index: number, forCommentSection: boolean = true) => {
    if (forCommentSection) {
      setCommentFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setComplaintFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const clearCommentFiles = () => {
    setCommentFiles([]);
    if (commentFileInputRef.current) {
      commentFileInputRef.current.value = '';
    }
  };

  const clearComplaintFiles = () => {
    setComplaintFiles([]);
    if (complaintFileInputRef.current) {
      complaintFileInputRef.current.value = '';
    }
  };

  // Handle delete complaint attachment
  const handleDeleteComplaintAttachment = async (attachmentId: string) => {
    if (!complaint || !attachmentId) return;
    
    try {
      await deleteAttachment({
        complaintId: complaint.id,
        attachmentId
      });
      
      toast.success("Attachment removed successfully");
      refetch(); // Refresh complaint data to update the UI
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Failed to remove attachment. Please try again.");
    }
  };

  // Upload files directly to complaint
  const handleUploadAttachments = async () => {
    if (!complaint || !complaintFiles.length || isAddingAttachments) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      await addAttachments({
        complaintId: complaint.id,
        files: complaintFiles,
        onUploadProgress: handleUploadProgress
      });
      
      toast.success(`${complaintFiles.length} ${complaintFiles.length === 1 ? 'attachment' : 'attachments'} uploaded successfully`);
      setComplaintFiles([]);
      if (complaintFileInputRef.current) {
        complaintFileInputRef.current.value = '';
      }
      
      refetch(); // Refresh complaint data to show new attachments
    } catch (error) {
      console.error("Error uploading attachments:", error);
      toast.error("Failed to upload attachments. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle post comment
  const handlePostComment = async () => {
    if (!complaint) return;
    if ((!comment.trim() && commentFiles.length === 0) || isAddingComment) return;
    
    try {
      setIsSubmitting(true);
      setUploadProgress(0);
      
      await addComment({
        complaintId: complaint.id,
        message: comment,
        files: commentFiles.length > 0 ? commentFiles : undefined,
        onUploadProgress: handleUploadProgress
      });
      
      if (commentFiles.length > 0) {
        toast.success(`Comment posted with ${commentFiles.length} ${commentFiles.length === 1 ? 'attachment' : 'attachments'}`);
      } else {
        toast.success('Comment posted');
      }
      
      setComment("");
      clearCommentFiles();
      refetch(); // Refresh complaint data to show new comment
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  // If loading, show loading spinner
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading ticket details...</span>
      </div>
    );
  }

  // If error or no complaint found
  if (!complaint) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert>
          <AlertDescription>
            Failed to load ticket details. The ticket may not exist or you don&apos;t have permission to view it.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/my-tickets">Back to My Tickets</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 px-4 sm:px-6 lg:px-0">
      {/* Attachment Modal */}
      {complaint.attachments && complaint.attachments.length > 0 && (
        <AttachmentModal 
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          attachments={complaint.attachments}
          currentIndex={currentAttachmentIndex}
          onPrev={prevAttachment}
          onNext={nextAttachment}
        />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8">
        {/* LEFT: Main Ticket Content */}
        <div className="space-y-6">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground flex items-center gap-2 mb-2" aria-label="Breadcrumb">
            <Link href="/my-tickets" className="hover:underline">My Tickets</Link>
            <span>/</span>
            <span className="text-primary font-medium">#{complaint.id}</span>
          </nav>
          {/* Page Title */}
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Ticket #{complaint.id}</h1>
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <div className="text-lg sm:text-xl font-bold mb-1 truncate">{complaint.title || complaint.subject}</div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary`}>
                  {complaint.statusEntity?.name || complaint.status}
                </span>
                <span className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  <span>Category:</span> <span className="font-medium">
                    {complaint.categoryEntity?.name || "N/A"}
                  </span>
                  <span className="ml-2">Dept:</span> <span className="font-medium">
                    {complaint.department?.name || "N/A"}
                  </span>
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Created: {new Date(complaint.createdAt).toLocaleString()} &nbsp;|&nbsp; Last Updated: {new Date(complaint.updatedAt).toLocaleString()}
              </div>
              {complaint.isAnonymous && (
                <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                  <span>🛡️</span> <span>Anonymous Submission</span>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                  </>
                )}
              </Button>
            </div>
          </div>
          {/* Reporter Info */}
          <div className="mb-2">
            {complaint.isAnonymous ? (
              <span className="text-xs text-muted-foreground">Reported Anonymously</span>
            ) : (
              <span className="text-xs text-muted-foreground">Reported by {complaint.reportedBy?.name || "Unknown"}</span>
            )}
          </div>
          {/* Description & Attachments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line text-sm">{complaint.description}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-4">
                <CardTitle>Attachments</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => complaintFileInputRef.current?.click()}
                  disabled={isUploading || complaintFiles.length > 0}
                  className="h-8 w-8 sm:h-auto sm:w-auto sm:px-3"
                >
                  <Plus className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </CardHeader>
              <CardContent>
                {/* File input for complaint attachments */}
                <input
                  ref={complaintFileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleComplaintFileInput}
                  multiple
                  accept=".jpg,.jpeg,.png,.mp4,.pdf"
                  disabled={isUploading}
                />

                {/* Attachment List */}
                {complaint.attachments && complaint.attachments.length > 0 ? (
                  <ul className="space-y-2 mb-4">
                    {complaint.attachments.map((attachment, idx) => (
                      <li key={attachment.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-xs font-mono">{idx + 1}.</span>
                          <button 
                            className="flex items-center gap-2 text-sm text-primary hover:underline text-left overflow-hidden"
                            onClick={() => openAttachmentModal(idx)}
                          >
                            {getFileIcon(attachment.filename)}
                            <span className="truncate max-w-[100px] sm:max-w-[200px]">{attachment.filename}</span>
                          </button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComplaintAttachment(attachment.id)}
                          disabled={isDeletingComplaintAttachment}
                          className="ml-2 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground mb-4">No attachments</div>
                )}

                {/* Selected files to upload */}
                {complaintFiles.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Files to upload:</div>
                    <ul className="space-y-2 mb-4">
                      {complaintFiles.map((file, idx) => (
                        <li key={idx} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-xs font-mono truncate max-w-[150px] sm:max-w-none">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(idx, false)}
                            disabled={isUploading}
                            className="ml-2 h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>

                    {/* Upload progress */}
                    {isUploading && uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium mb-1">Uploading: {uploadProgress}%</div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Upload button */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={handleUploadAttachments}
                        className="bg-primary text-white w-full sm:w-auto"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Files
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearComplaintFiles}
                        disabled={isUploading}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* File Drop Area */}
                {complaintFiles.length === 0 && !complaint.attachments?.length && (
                  <div
                    className={`border-2 border-dashed rounded-md p-4 text-center ${
                      isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'
                    }`}
                    onDrop={handleComplaintDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <div className="cursor-pointer flex flex-col items-center justify-center" onClick={() => complaintFileInputRef.current?.click()}>
                      <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                      <span className="text-sm text-primary font-medium">Click to upload or drag and drop</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, MP4, PDF up to 25MB
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* RIGHT: Ticket Info - moved below the main content on mobile */}
        <div className="space-y-6 order-first lg:order-none mb-4 lg:mb-0">
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="grid grid-cols-[1fr_2fr] gap-1">
                  <dt className="text-sm text-muted-foreground">Status</dt>
                  <dd>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary`}>
                      {complaint.statusEntity?.name || complaint.status}
                    </span>
                  </dd>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-1">
                  <dt className="text-sm text-muted-foreground">Ticket ID</dt>
                  <dd className="text-sm font-mono">{complaint.id}</dd>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-1">
                  <dt className="text-sm text-muted-foreground">Created</dt>
                  <dd className="text-sm">{new Date(complaint.createdAt).toLocaleString()}</dd>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-1">
                  <dt className="text-sm text-muted-foreground">Last Updated</dt>
                  <dd className="text-sm">{new Date(complaint.updatedAt).toLocaleString()}</dd>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-1">
                  <dt className="text-sm text-muted-foreground">Category</dt>
                  <dd className="text-sm">
                    {complaint.categoryEntity?.name || "N/A"}
                  </dd>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-1">
                  <dt className="text-sm text-muted-foreground">Department</dt>
                  <dd className="text-sm">
                    {complaint.department?.name || "N/A"}
                  </dd>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-1">
                  <dt className="text-sm text-muted-foreground">Anonymous</dt>
                  <dd className="text-sm">{complaint.isAnonymous ? "Yes" : "No"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/my-tickets">Back to All Tickets</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* BOTTOM: Timeline & Comments - Always full width */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle>Timeline & Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {/* Timeline items here */}
          </ul>
          
          {/* Separator */}
          <div className="border-t border-border my-6"></div>
          
          {/* Add Comment Form */}
          <div>
            <h3 className="font-medium mb-2">Add Comment</h3>
            
            {/* Comment Input */}
            <Textarea
              placeholder="Type your comment here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="mb-4"
              disabled={isAddingComment}
            />
            
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-md p-4 mb-4 text-center ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'
              }`}
              onDrop={handleCommentDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={commentFileInputRef}
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleCommentFileInput}
                multiple
                accept=".jpg,.jpeg,.png,.mp4,.pdf"
                disabled={isAddingComment}
              />
              
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground mb-2" />
                <span className="text-xs sm:text-sm text-primary font-medium">Click to upload or drag and drop</span>
                <span className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, MP4, PDF up to 25MB
                </span>
              </label>
            </div>
            
            {/* Upload Error */}
            {uploadError && (
              <div className="text-sm text-red-500 mb-4">
                {uploadError}
              </div>
            )}
            
            {/* Selected Files */}
            {commentFiles.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">Selected Files:</div>
                <ul className="space-y-2">
                  {commentFiles.map((file, idx) => (
                    <li key={idx} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-xs font-mono truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(idx, true)}
                        disabled={isAddingComment}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearCommentFiles}
                  className="mt-2"
                  disabled={isAddingComment}
                >
                  Clear All
                </Button>
              </div>
            )}
            
            {/* Upload Progress */}
            {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mb-4">
                <div className="text-sm font-medium mb-1">Uploading: {uploadProgress}%</div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <Button
              onClick={handlePostComment}
              className="w-full bg-primary text-white"
              disabled={(!comment.trim() && commentFiles.length === 0) || isAddingComment}
            >
              {isAddingComment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Posting Comment...
                </>
              ) : (
                'Post Comment'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 