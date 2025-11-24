import { useState, useEffect } from 'react';
import { Star, MessageCircle, CornerDownRight, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Reply {
  id: string;
  rating_id: string;
  user_id: string;
  reply_text: string;
  created_at: string;
}

interface Rating {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  rating_replies?: Reply[];
}

interface ProfileMap {
  [key: string]: {
    name: string;
    avatar_url: string | null;
  };
}

interface RatingCardProps {
  listingId: string;
  currentUserId?: string;
}

export const RatingCard = ({ listingId, currentUserId }: RatingCardProps) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [profiles, setProfiles] = useState<ProfileMap>({});
  const [loading, setLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const { toast } = useToast();

  const fetchRatings = async () => {
    try {
      // Try fetching with replies first
      const { data: ratingsData, error } = await (supabase
        .from('ratings') as any)
        .select(`
          *,
          rating_replies (
            id,
            reply_text,
            created_at,
            user_id
          )
        `)
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (ratingsData) {
        setRatings(ratingsData);
        await fetchProfiles(ratingsData);
      }
    } catch (err) {
      console.warn('Failed to fetch ratings with replies, falling back to basic ratings:', err);
      // Fallback: fetch without replies
      const { data: ratingsData, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (!error && ratingsData) {
        setRatings(ratingsData);
        await fetchProfiles(ratingsData);
      }
    }
  };

  const fetchProfiles = async (data: any[]) => {
    const userIds = new Set<string>();
    data.forEach(r => {
      userIds.add(r.user_id);
      r.rating_replies?.forEach((reply: any) => userIds.add(reply.user_id));
    });

    if (userIds.size > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', Array.from(userIds));

      if (profilesData) {
        const profileMap: ProfileMap = {};
        profilesData.forEach(p => {
          profileMap[p.id] = { name: p.name, avatar_url: p.avatar_url };
        });
        setProfiles(prev => ({ ...prev, ...profileMap }));
      }
    }
  };

  const handleSubmitReply = async (ratingId: string) => {
    if (!currentUserId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to reply',
        variant: 'destructive',
      });
      return;
    }

    if (!replyText.trim()) {
      toast({
        title: 'Error',
        description: 'Reply cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setReplyLoading(true);
    const { error } = await (supabase.from('rating_replies') as any).insert({
      rating_id: ratingId,
      user_id: currentUserId,
      reply_text: replyText,
    });

    if (error) {
      console.error('Error submitting reply:', error);
      toast({
        title: 'Error submitting reply',
        description: error.message || 'Failed to submit reply. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Reply submitted successfully',
      });
      setReplyText('');
      setReplyingTo(null);
      fetchRatings();
    }
    setReplyLoading(false);
  };

  const handleSubmitRating = async () => {
    if (!currentUserId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to rate',
        variant: 'destructive',
      });
      return;
    }

    if (userRating === 0) {
      toast({
        title: 'Error',
        description: 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('ratings').upsert({
      listing_id: listingId,
      user_id: currentUserId,
      rating: userRating,
      comment: userComment || null,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit rating',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Rating submitted successfully',
      });
      setUserRating(0);
      setUserComment('');
      fetchRatings();
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const averageRating =
    ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
      : '0.0';

  return (
    <Card
      className="mt-10 border border-[#B1A7A6]/30 rounded-3xl overflow-hidden 
      bg-gradient-to-br from-[#F5F3F4] via-[#FFFFFF] to-[#F5F3F4]
      shadow-[0_8px_24px_rgba(102,7,8,0.08)] hover:shadow-[0_10px_28px_rgba(102,7,8,0.15)]
      transition-all duration-500 backdrop-blur-md"
    >
      <CardHeader className="border-b border-[#D3D3D3]/50 pb-4 bg-gradient-to-r from-[#E5383B] via-[#fc7777] to-[#e4cec7]">
        <CardTitle className="flex items-center justify-between text-[#161A1D]">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 fill-[#ffde21] text-[#E5383B]" />
            <span className="text-lg font-bold tracking-wide">Ratings & Reviews</span>
          </div>
          <span className="text-lg font-bold text-[#660708]/80">
            ({ratings.length}) • Avg: {averageRating}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-8 space-y-8 bg-[#FFFFFF]/60 backdrop-blur-sm">
        {currentUserId && (
          <div className="p-6 border border-[#D3D3D3]/60 rounded-2xl bg-[#F5F3F4]/70 shadow-sm hover:shadow-[0_0_20px_rgba(229,56,59,0.15)] transition-all duration-300">
            <h4 className="font-semibold text-[#161A1D] mb-3 text-lg">Leave a Rating</h4>

            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setUserRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform duration-200 hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${star <= (hoveredRating || userRating)
                      ? 'fill-[#E5383B] text-[#E5383B] drop-shadow-[0_0_4px_rgba(229,56,59,0.3)]'
                      : 'text-[#B1A7A6]'
                      }`}
                  />
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Share your thoughts about this listing..."
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              className="mb-3 border-[#D3D3D3]/60 bg-white text-[#161A1D]
              placeholder:text-[#B1A7A6] focus:ring-[#E5383B] focus:border-[#E5383B] rounded-xl"
              rows={3}
            />
            <Button
              onClick={handleSubmitRating}
              disabled={loading}
              className="bg-gradient-to-r from-[#BA181B] via-[#E5383B] to-[#A4161A] 
              text-white rounded-xl shadow-md hover:shadow-[0_0_20px_rgba(229,56,59,0.3)]
              transition-all duration-300 px-6 py-2 font-semibold tracking-wide"
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {ratings.length === 0 ? (
            <p className="text-center text-[#B1A7A6] py-8 italic text-sm tracking-wide">
              No ratings yet — be the first to rate!
            </p>
          ) : (
            ratings.map((rating) => (
              <div
                key={rating.id}
                className="p-5 rounded-2xl border border-[#D3D3D3]/60 bg-[#F5F3F4]/70 
                hover:bg-[#E9E9E9]/80 hover:border-[#E5383B]/40 
                transition-all duration-300 group shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= rating.rating
                            ? 'fill-[#E5383B] text-[#E5383B]'
                            : 'text-[#B1A7A6]'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-[#161A1D]">
                      {profiles[rating.user_id]?.name || 'User'}
                    </span>
                    <span className="text-xs text-[#660708]/70">
                      • {new Date(rating.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(replyingTo === rating.id ? null : rating.id);
                        setReplyText('');
                      }}
                      className="text-[#E5383B] hover:text-[#BA181B] hover:bg-[#E5383B]/10 h-8 px-2"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Reply
                    </Button>
                  )}
                </div>

                {rating.comment && (
                  <p className="text-sm text-[#161A1D]/90 leading-relaxed mb-4">
                    {rating.comment}
                  </p>
                )}

                {/* Replies Section */}
                {rating.rating_replies && rating.rating_replies.length > 0 && (
                  <div className="ml-6 mt-4 space-y-3 border-l-2 border-[#D3D3D3]/40 pl-4">
                    {rating.rating_replies.map((reply) => (
                      <div key={reply.id} className="bg-white/50 p-3 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-[#161A1D]">
                            {profiles[reply.user_id]?.name || 'User'}
                          </span>
                          <span className="text-[10px] text-[#660708]/60">
                            {new Date(reply.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-[#161A1D]/80">
                          {reply.reply_text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input */}
                {replyingTo === rating.id && (
                  <div className="mt-4 ml-6 animate-in fade-in slide-in-from-top-2">
                    <div className="flex gap-2">
                      <CornerDownRight className="w-5 h-5 text-[#B1A7A6] mt-2" />
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Write a reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="min-h-[80px] bg-white"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(null)}
                            className="text-[#660708]"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSubmitReply(rating.id)}
                            disabled={replyLoading}
                            className="bg-[#E5383B] hover:bg-[#BA181B] text-white"
                          >
                            {replyLoading ? 'Posting...' : 'Post Reply'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
