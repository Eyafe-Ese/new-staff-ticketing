"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, Shield, FileSearch, Clock, User, CheckCircle2, XCircle, Download, ChevronLeft, ChevronRight, X, File, FileText, Image as ImageIcon } from "lucide-react";
import { useComplaintByToken } from "@/hooks/useComplaintByToken";
import Link from "next/link";
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

export default function TrackComplaintPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  
  const [token, setToken] = useState(tokenFromUrl || "");
  const [isSubmitted, setIsSubmitted] = useState(!!tokenFromUrl);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);
  
  // Only fetch data if a token is submitted
  const { data: complaint, isLoading, isError, error } = useComplaintByToken(isSubmitted ? token : null);

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
    if (complaint?.attachments && currentAttachmentIndex < complaint.attachments.length - 1) {
      setCurrentAttachmentIndex(prev => prev + 1);
    }
  };

  const prevAttachment = () => {
    if (currentAttachmentIndex > 0) {
      setCurrentAttachmentIndex(prev => prev - 1);
    }
  };

  // Function to get file icon
  const getFileIcon = (filename: string) => {
    if (filename.match(/\.(jpeg|jpg|gif|png|webp)$/i)) return <ImageIcon className="h-4 w-4" />;
    if (filename.match(/\.(pdf)$/i)) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 py-4 sm:py-8 px-4 sm:px-6 lg:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Track Your Complaint</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Enter your tracking token to see the status of your anonymous complaint</p>
      </div>

      <Card>
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-xl">Complaint Lookup</CardTitle>
          <CardDescription>Enter the tracking token you received when you submitted your complaint</CardDescription>
        </CardHeader>
        <CardContent>
          {!isSubmitted ? (
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
                <p>The tracking token was provided to you when you submitted your anonymous complaint.</p>
              </div>
            </form>
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  {(error as Error)?.message || "Failed to find a complaint with this tracking token. It may be invalid or expired."}
                </AlertDescription>
              </Alert>
              <Button onClick={handleNewSearch} variant="outline">Search Again</Button>
            </div>
          ) : complaint ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <h3 className="text-lg font-semibold">{complaint.title || complaint.subject}</h3>
                  <div className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">
                    {complaint.status}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Submitted on {formatDate(complaint.createdAt)}</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex gap-2 items-center">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Anonymous</div>
                      <div className="text-sm font-medium">Yes</div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <FileSearch className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Category</div>
                      <div className="text-sm font-medium">{complaint.categoryEntity?.name || "Unknown"}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Last Updated</div>
                      <div className="text-sm font-medium">{formatDate(complaint.updatedAt)}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Department</div>
                      <div className="text-sm font-medium">{complaint.department?.name || "Not assigned"}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Description</h4>
                  <div className="text-sm whitespace-pre-line border rounded-md p-3 bg-muted/30">
                    {complaint.description}
                  </div>
                </div>

                {complaint.comments && complaint.comments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Updates ({complaint.comments.length})</h4>
                    <div className="space-y-3">
                      {complaint.comments.map((comment) => (
                        <div key={comment.id} className="border rounded-md p-3 text-sm">
                          <div className="flex flex-wrap justify-between mb-1 gap-2">
                            <span className="font-medium">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-line text-sm">{comment.message}</p>
                          
                          {/* Comment attachments */}
                          {comment.attachments && comment.attachments.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="text-xs text-muted-foreground mb-1">Attachments:</div>
                              <div className="flex flex-wrap gap-2">
                                {comment.attachments.map((attachment) => (
                                  <button
                                    key={attachment.id}
                                    onClick={() => openAttachmentModal(
                                      // Find the index in the global attachments array
                                      complaint.attachments?.findIndex(a => a.id === attachment.id) || 0
                                    )}
                                    className="flex items-center gap-1 text-xs text-primary hover:underline px-2 py-1 rounded-md border border-muted/60 bg-muted/20"
                                  >
                                    {getFileIcon(attachment.filename)}
                                    <span className="truncate max-w-[100px]">{attachment.filename}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {complaint.attachments && complaint.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Attachments ({complaint.attachments.length})</h4>
                    <div className="grid gap-2">
                      {complaint.attachments.map((attachment, index) => (
                        <button
                          key={attachment.id}
                          onClick={() => openAttachmentModal(index)}
                          className="flex items-center gap-2 text-sm text-primary hover:bg-muted/50 p-2 rounded-md border border-muted/60 bg-muted/30 w-full text-left"
                        >
                          {getFileIcon(attachment.filename)}
                          <span className="truncate">{attachment.filename}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {complaint.status === "Resolved" && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="text-sm">This complaint has been resolved.</span>
                  </div>
                )}

                {complaint.status === "Closed" && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-gray-50 text-gray-700 border border-gray-200">
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="text-sm">This complaint has been closed.</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row justify-between gap-3">
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
          ) : null}
        </CardContent>
      </Card>

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