import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, ThumbsDown, MessageCircle, MoreVertical, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    parent_id: string | null;
    likes_count: number;
    dislikes_count: number;
    user: {
        name: string;
        avatar_url: string | null;
    };
    replies?: Comment[];
    user_vote?: 'like' | 'dislike' | null;
}

interface BlogCommentsProps {
    blogId: string;
}

export const BlogComments = ({ blogId }: BlogCommentsProps) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [blogId, user?.id]);

    const fetchComments = async () => {
        try {
            // Fetch comments
            const { data: commentsData, error } = await (supabase
                .from('blog_comments') as any)
                .select(`
          *,
          profiles:user_id (name, avatar_url)
        `)
                .eq('blog_id', blogId)
                .eq('status', 'published')
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Fetch user votes if logged in
            let userVotes: any[] = [];
            if (user) {
                const { data: votes } = await (supabase
                    .from('blog_comment_votes') as any)
                    .select('*')
                    .eq('user_id', user.id);
                userVotes = votes || [];
            }

            // Process comments
            const processedComments = commentsData?.map((c: any) => ({
                ...c,
                user: c.profiles || {},
                user_vote: userVotes.find((v: any) => v.comment_id === c.id)?.vote_type || null,
                replies: []
            })) || [];

            // Build hierarchy
            const rootComments: Comment[] = [];
            const replyMap = new Map<string, Comment[]>();

            processedComments.forEach((c: Comment) => {
                if (c.parent_id) {
                    if (!replyMap.has(c.parent_id)) {
                        replyMap.set(c.parent_id, []);
                    }
                    replyMap.get(c.parent_id)?.push(c);
                } else {
                    rootComments.push(c);
                }
            });

            // Attach replies
            rootComments.forEach(c => {
                c.replies = replyMap.get(c.id) || [];
            });

            setComments(rootComments);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleSubmitComment = async (parentId: string | null = null) => {
        if (!user) {
            toast({
                title: 'Login required',
                description: 'Please login to post a comment',
                variant: 'destructive',
            });
            return;
        }

        const content = parentId ? replyContent : newComment;
        if (!content.trim()) return;

        // Simple spam filter
        const spamKeywords = ['buy crypto', 'free money', 'click here'];
        if (spamKeywords.some(k => content.toLowerCase().includes(k))) {
            toast({
                title: 'Spam detected',
                description: 'Your comment contains prohibited content.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            const { error } = await (supabase
                .from('blog_comments') as any)
                .insert({
                    blog_id: blogId,
                    user_id: user.id,
                    content: content,
                    parent_id: parentId
                });

            if (error) throw error;

            toast({
                title: 'Comment posted',
                description: 'Your comment has been published.',
            });

            setNewComment('');
            setReplyContent('');
            setReplyingTo(null);
            fetchComments();
        } catch (error: any) {
            console.error('Error posting comment:', error);
            toast({
                title: 'Error',
                description: error?.message || 'Failed to post comment',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (commentId: string, type: 'like' | 'dislike') => {
        if (!user) return;

        try {
            const currentVote = comments.find(c => c.id === commentId)?.user_vote ||
                comments.flatMap(c => c.replies || []).find(r => r.id === commentId)?.user_vote;

            if (currentVote === type) {
                // Remove vote
                await (supabase
                    .from('blog_comment_votes') as any)
                    .delete()
                    .eq('comment_id', commentId)
                    .eq('user_id', user.id);
            } else {
                // Upsert vote
                await (supabase
                    .from('blog_comment_votes') as any)
                    .upsert({
                        comment_id: commentId,
                        user_id: user.id,
                        vote_type: type
                    });
            }

            // Update counts (optimistic or refetch)
            fetchComments();
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    const handleDelete = async (commentId: string) => {
        try {
            const { error } = await (supabase
                .from('blog_comments') as any)
                .delete()
                .eq('id', commentId);

            if (error) throw error;

            toast({ title: 'Comment deleted' });
            fetchComments();
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => (
        <div className={`flex gap-4 ${isReply ? 'ml-12 mt-4' : 'mt-6'}`}>
            <Avatar className="w-10 h-10 border border-gray-200">
                <AvatarImage src={comment.user.avatar_url || undefined} />
                <AvatarFallback>{comment.user.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <span className="font-semibold text-sm text-gray-900">{comment.user.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                        </div>
                        {user?.id === comment.user_id && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleDelete(comment.id)} className="text-red-600">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                </div>

                <div className="flex items-center gap-4 mt-2 ml-2">
                    <button
                        onClick={() => handleVote(comment.id, 'like')}
                        className={`flex items-center gap-1 text-xs font-medium transition-colors ${comment.user_vote === 'like' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <ThumbsUp className="w-3 h-3" />
                        {comment.likes_count || 0}
                    </button>
                    <button
                        onClick={() => handleVote(comment.id, 'dislike')}
                        className={`flex items-center gap-1 text-xs font-medium transition-colors ${comment.user_vote === 'dislike' ? 'text-red-600' : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <ThumbsDown className="w-3 h-3" />
                        {comment.dislikes_count || 0}
                    </button>
                    {!isReply && (
                        <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <MessageCircle className="w-3 h-3" />
                            Reply
                        </button>
                    )}
                </div>

                {replyingTo === comment.id && (
                    <div className="mt-4 flex gap-3 animate-in fade-in slide-in-from-top-2">
                        <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="min-h-[60px] text-sm"
                        />
                        <Button
                            size="sm"
                            onClick={() => handleSubmitComment(comment.id)}
                            disabled={loading}
                            className="self-end"
                        >
                            Reply
                        </Button>
                    </div>
                )}

                {comment.replies?.map(reply => (
                    <CommentItem key={reply.id} comment={reply} isReply={true} />
                ))}
            </div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">
                Comments ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
            </h3>

            {/* New Comment Input */}
            <div className="flex gap-4 mb-10">
                <Avatar className="w-10 h-10">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>{user?.email?.[0]?.toUpperCase() || 'G'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                    <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={user ? "Share your thoughts..." : "Please login to comment"}
                        disabled={!user}
                        className="min-h-[100px] resize-none border-gray-200 focus:border-gray-400 focus:ring-0"
                    />
                    <div className="flex justify-end">
                        <Button
                            onClick={() => handleSubmitComment()}
                            disabled={!user || loading || !newComment.trim()}
                            className="bg-gray-900 hover:bg-gray-800 text-white"
                        >
                            Post Comment
                        </Button>
                    </div>
                </div>
            </div>

            {/* Comments List */}
            <div className="space-y-2">
                {comments.map(comment => (
                    <CommentItem key={comment.id} comment={comment} />
                ))}
                {comments.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No comments yet. Be the first to share your thoughts!</p>
                )}
            </div>
        </div>
    );
};
