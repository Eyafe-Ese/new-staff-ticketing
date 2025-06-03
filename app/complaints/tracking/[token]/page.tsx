"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useAnonymousComplaintComments, useAnonymousComplaintCommentsList} from '@/hooks/useAnonymousComplaintComments';

interface AnonymousComplaintPageProps {
  params: {
    token: string;
  };
}

export default function AnonymousComplaintPage({ params }: AnonymousComplaintPageProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addComment } = useAnonymousComplaintComments();
  const { data: comments = [], isLoading: isLoadingComments } = useAnonymousComplaintCommentsList(params.token);

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setIsSubmitting(true);
      await addComment.mutateAsync({
        token: params.token,
        message: comment,
      });

      setComment('');
      toast.success('Comment posted successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 py-4 sm:py-8 px-4 sm:px-6 lg:px-0">
      {/* Comments Panel */}
      <Card className="sticky top-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Comments List */}
          {isLoadingComments ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-md p-3 text-sm">
                  <div className="flex flex-wrap justify-between mb-1 gap-2">
                    <span className="font-medium">{comment.author.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-sm">{comment.message}</p>
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
            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Type your comment here..."
                className="min-h-[100px]"
              />
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!comment.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post Comment'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 