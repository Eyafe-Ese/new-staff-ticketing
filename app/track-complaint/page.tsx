"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Search,
  Shield,
  FileSearch,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  File,
  FileText,
  Image as ImageIcon,
  Upload,
  MessageCircle,
} from "lucide-react";
import { useComplaintByToken } from "@/hooks/useComplaintByToken";
import {
  useAnonymousComplaintComments,
  useAnonymousComplaintCommentsList,
  useAnonymousComplaintAttachments,
} from "@/hooks/useAnonymousComplaintComments";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import Image from "next/image";
import { Attachment } from "@/hooks/useComplaints";
import { useComplaintAttachments } from "@/hooks/useComplaintAttachments";

// Modal component for viewing attachments
const AttachmentModal = ({
  isOpen,
  onClose,
  attachments,
  currentIndex,
  onPrev,
  onNext,
}: {
  isOpen: boolean;
  onClose: () => void;
  attachments: Attachment[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
}) => {
  // Move useState hook before any conditional returns
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
          <div className="font-medium truncate max-w-[180px] sm:max-w-md">
            {attachment.filename}
          </div>
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
                // Fallback to another Image component with unoptimized if standard Image fails
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
                <p className="text-sm sm:text-base">
                  This file can&apos;t be previewed.
                </p>
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

export default function TrackComplaintPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [token, setToken] = useState(tokenFromUrl || "");
  const [isSubmitted, setIsSubmitted] = useState(!!tokenFromUrl);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);

  // New state for comment form
  const [comment, setComment] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Refs
  const commentFileInputRef = useRef<HTMLInputElement>(null);

  // Only fetch data if a token is submitted
  const {
    data: complaint,
    isLoading,
    isError,
    error,
    refetch,
  } = useComplaintByToken(isSubmitted ? token : null);

  // Comments data and mutations
  const {
    data: comments = [],
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useAnonymousComplaintCommentsList(token);

  const {
    addComment: { mutateAsync: addComment, isPending: isAddingComment },
  } = useAnonymousComplaintComments();

  // Add state for complaint attachments
  const [complaintFiles, setComplaintFiles] = useState<File[]>([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const complaintFileInputRef = useRef<HTMLInputElement>(null);

  // Add complaint attachments mutation
  const {
    addAttachments: {
      mutateAsync: addAttachments,
      isPending: isAddingAttachments,
    },
  } = useAnonymousComplaintAttachments();

  // File handling functions
  const handleUploadProgress = (progressEvent: {
    loaded: number;
    total: number;
  }) => {
    setUploadProgress(
      Math.round((progressEvent.loaded * 100) / progressEvent.total)
    );
  };

  const validateFile = useCallback((file: File): boolean => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "video/mp4",
      "application/pdf",
    ];
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes

    if (!validTypes.includes(file.type)) {
      setUploadError(
        "Invalid file type. Please upload .jpg, .png, .mp4, or .pdf files only."
      );
      return false;
    }

    if (file.size > maxSize) {
      setUploadError("File size exceeds 25MB limit.");
      return false;
    }

    return true;
  }, []);

  // Modify handleFilesSelect to accept a setter function
  const handleFilesSelect = useCallback(
    (
      filesToAdd: File[],
      setter: React.Dispatch<React.SetStateAction<File[]>>
    ) => {
      setUploadError(null);

      const validFiles = filesToAdd.filter((file) => validateFile(file));
      if (validFiles.length > 0) {
        setter((prev) => [...prev, ...validFiles]);
        toast.success(
          validFiles.length === 1
            ? "File selected successfully"
            : `${validFiles.length} files selected successfully`
        );
      }
    },
    [validateFile]
  );

  // Update existing handleFilesSelect calls
  const handleCommentFilesSelect = (files: File[]) =>
    handleFilesSelect(files, setCommentFiles);
  const handleComplaintFilesSelect = (files: File[]) =>
    handleFilesSelect(files, setComplaintFiles);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files) {
        handleFilesSelect(Array.from(e.dataTransfer.files), setCommentFiles);
      }
    },
    [handleFilesSelect]
  );

  const handleCommentFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesSelect(Array.from(e.target.files), setCommentFiles);
    }
  };

  const handleRemoveFile = (index: number) => {
    setCommentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCommentFiles = () => {
    setCommentFiles([]);
    setUploadError(null);
  };

  const handlePostComment = async () => {
    if (!token) return;
    if (!comment.trim() || isAddingComment) return;

    try {
      setIsSubmitting(true);

      await addComment({
        token,
        message: comment,
        files: commentFiles,
        onUploadProgress: handleUploadProgress,
      });

      toast.success("Comment posted successfully");
      setComment("");
      clearCommentFiles();

      // Refresh both complaint data and comments
      refetch();
      refetchComments();
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setIsSubmitted(true);

    // Update URL with token
    router.push(`/track-complaint?token=${encodeURIComponent(token)}`);
  };

  const handleNewSearch = () => {
    setIsSubmitted(false);
    setToken("");
    router.push("/track-complaint");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Functions to handle attachment modal
  const openAttachmentModal = (index: number) => {
    setCurrentAttachmentIndex(index);
    setModalOpen(true);
  };

  const nextAttachment = () => {
    if (
      complaint?.attachments &&
      currentAttachmentIndex < complaint.attachments.length - 1
    ) {
      setCurrentAttachmentIndex((prev) => prev + 1);
    }
  };

  const prevAttachment = () => {
    if (currentAttachmentIndex > 0) {
      setCurrentAttachmentIndex((prev) => prev - 1);
    }
  };

  // Function to get file icon
  const getFileIcon = (filename: string) => {
    if (filename.match(/\.(jpeg|jpg|gif|png|webp)$/i))
      return <ImageIcon className="h-4 w-4" />;
    if (filename.match(/\.(pdf)$/i)) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  // Add handlers for complaint attachments
  const handleComplaintFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesSelect(Array.from(e.target.files), setComplaintFiles);
    }
  };

  const handleRemoveComplaintFile = (index: number) => {
    setComplaintFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearComplaintFiles = () => {
    setComplaintFiles([]);
    setUploadError(null);
  };

  const handleUploadComplaintAttachments = async () => {
    if (!token || !complaintFiles.length || isAddingAttachments) return;

    try {
      setIsUploadingAttachments(true);
      setUploadProgress(0);

      await addAttachments({
        token,
        files: complaintFiles,
        onUploadProgress: handleUploadProgress,
      });

      toast.success(
        `${complaintFiles.length} ${
          complaintFiles.length === 1 ? "attachment" : "attachments"
        } uploaded successfully`
      );
      clearComplaintFiles();
      refetch();
    } catch (error) {
      console.error("Error uploading attachments:", error);
      toast.error("Failed to upload attachments. Please try again.");
    } finally {
      setIsUploadingAttachments(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 py-4 sm:py-8 px-4 sm:px-6 lg:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
          Track Your Complaint
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Enter your tracking token to see the status of your anonymous
          complaint
        </p>
      </div>

      {!isSubmitted ? (
        <Card>
          <CardHeader className="pb-2 sm:pb-6">
            <CardTitle className="text-xl">Complaint Lookup</CardTitle>
            <CardDescription>
              Enter the tracking token you received when you submitted your
              complaint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your tracking token"
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!token.trim()}
                  className="w-full sm:w-auto"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Track
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  The tracking token was provided to you when you submitted your
                  anonymous complaint.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              {(error as Error)?.message ||
                "Failed to find a complaint with this tracking token. It may be invalid or expired."}
            </AlertDescription>
          </Alert>
          <Button onClick={handleNewSearch} variant="outline">
            Search Again
          </Button>
        </div>
      ) : complaint ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <h3 className="text-lg font-semibold">
                      {complaint.title || complaint.subject}
                    </h3>
                    <div className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">
                      {complaint.statusEntity?.name || 'Unknown'}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Submitted on {formatDate(complaint.createdAt)}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex gap-2 items-center">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Anonymous
                        </div>
                        <div className="text-sm font-medium">Yes</div>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <FileSearch className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Category
                        </div>
                        <div className="text-sm font-medium">
                          {complaint.categoryEntity?.name || "Unknown"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Last Updated
                        </div>
                        <div className="text-sm font-medium">
                          {formatDate(complaint.updatedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Department
                        </div>
                        <div className="text-sm font-medium">
                          {complaint.department?.name || "Not assigned"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Description</h4>
                    <div className="text-sm whitespace-pre-line border rounded-md p-3 bg-muted/30">
                      {complaint.description}
                    </div>
                  </div>

                  {/* Attachments Section */}
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <File className="h-5 w-5 text-primary" />
                        <h4 className="text-sm font-medium">
                          Attachments{" "}
                          {complaint.attachments &&
                            `(${complaint.attachments.length})`}
                        </h4>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => complaintFileInputRef.current?.click()}
                        disabled={isUploadingAttachments}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Add Files
                      </Button>
                    </div>

                    <input
                      type="file"
                      ref={complaintFileInputRef}
                      onChange={handleComplaintFileInput}
                      className="hidden"
                      multiple
                      accept=".jpg,.jpeg,.png,.pdf,.mp4"
                    />

                    {/* File Upload Area */}
                    {complaintFiles.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {complaintFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md text-sm"
                            >
                              {getFileIcon(file.name)}
                              <span className="truncate max-w-[150px]">
                                {file.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveComplaintFile(index)}
                                className="p-1 hover:bg-muted rounded-full"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Upload Progress */}
                        {isUploadingAttachments && uploadProgress > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Uploading...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearComplaintFiles}
                            disabled={isUploadingAttachments}
                          >
                            Clear All
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleUploadComplaintAttachments}
                            disabled={
                              isUploadingAttachments || isAddingAttachments
                            }
                          >
                            {isUploadingAttachments || isAddingAttachments ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              "Upload Files"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Existing Attachments */}
                    {complaint.attachments &&
                      complaint.attachments.length > 0 && (
                        <div className="grid gap-2">
                          {complaint.attachments.map((attachment, index) => (
                            <button
                              key={attachment.id}
                              onClick={() => openAttachmentModal(index)}
                              className="flex items-center gap-2 text-sm text-primary hover:bg-muted/50 p-2 rounded-md border border-muted/60 bg-muted/30 w-full text-left"
                            >
                              {getFileIcon(attachment.filename)}
                              <span className="truncate">
                                {attachment.filename}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* Status Messages */}
                  {complaint.statusEntity?.code === "resolved" && (
                    <div className="mt-6 flex items-center gap-2 p-3 rounded-md bg-green-50 text-green-700 border border-green-200">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="text-sm">
                        This complaint has been resolved.
                      </span>
                    </div>
                  )}

                  {complaint.statusEntity?.code === "closed" && (
                    <div className="mt-6 flex items-center gap-2 p-3 rounded-md bg-gray-50 text-gray-700 border border-gray-200">
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="text-sm">
                        This complaint has been closed.
                      </span>
                    </div>
                  )}

                  <div className="pt-6 flex flex-col sm:flex-row justify-between gap-3">
                    <Button
                      onClick={handleNewSearch}
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      Track Another Complaint
                    </Button>
                    <Button asChild className="w-full sm:w-auto">
                      <Link href="/">Home</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comments Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Comments List */}
                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="border rounded-md p-3 text-sm"
                      >
                        <div className="flex flex-wrap justify-between mb-1 gap-2">
                          <span className="font-medium">
                            {comment.author ? comment.author.name : "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="whitespace-pre-line text-sm">
                          {comment.message}
                        </p>

                        {/* Comment attachments */}
                        {comment.attachments &&
                          comment.attachments.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="text-xs text-muted-foreground mb-1">
                                Attachments:
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {comment.attachments.map((attachment) => (
                                  <button
                                    key={attachment.id}
                                    onClick={() =>
                                      openAttachmentModal(
                                        complaint.attachments?.findIndex(
                                          (a) => a.id === attachment.id
                                        ) || 0
                                      )
                                    }
                                    className="flex items-center gap-1 text-xs text-primary hover:underline px-2 py-1 rounded-md border border-muted/60 bg-muted/20"
                                  >
                                    {getFileIcon(attachment.filename)}
                                    <span className="truncate max-w-[100px]">
                                      {attachment.filename}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No comments yet</p>
                  </div>
                )}

                {/* Comment Form */}
                <div className="pt-4 border-t">
                  <div className="space-y-4">
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Type your comment here..."
                      className="min-h-[100px]"
                    />

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={handlePostComment}
                        disabled={
                          !comment.trim() || isSubmitting || isAddingComment
                        }
                      >
                        {isSubmitting || isAddingComment ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          "Post Comment"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {/* Attachment Modal */}
      {complaint?.attachments && complaint.attachments.length > 0 && (
        <AttachmentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          attachments={complaint.attachments}
          currentIndex={currentAttachmentIndex}
          onNext={nextAttachment}
          onPrev={prevAttachment}
        />
      )}
    </div>
  );
}
