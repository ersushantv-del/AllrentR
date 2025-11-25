import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useListings } from '@/hooks/useListings';
import { useNavigate } from 'react-router-dom';
import { useUserStreak } from '@/hooks/useLeaderboard';
import ListingCardOnProfile from '@/components/ListingCardOnProfile';
import StatsCardsOnProfile from '@/components/StatsCardsOnProfile';
import DashboardHero from '@/components/DashboardHeroOnProfile';
import { ProfileEditDialog } from '@/components/ProfileEditDialog';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OwnerReviewAnalytics } from '@/components/OwnerReviewAnalytics';
import WishlistSection from '@/components/WishlistSection';

const Profile = () => {
  const { user, authReady } = useAuth();
  const navigate = useNavigate();
  const listingsEnabled = Boolean(user?.id) && Boolean(authReady);
  const { listings, loading } = useListings(undefined, user?.id, listingsEnabled);
  const { data: streakData } = useUserStreak(user?.id || '');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  const [wishlistItems, setWishlistItems] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      // Fetch profile
      supabase
        .from('profiles')
        .select('avatar_url, name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.avatar_url) {
            setAvatarUrl(data.avatar_url);
          }
          if (data?.name) {
            setUserName(data.name);
          }
        });

      // Fetch wishlist
      const fetchWishlist = async () => {
        const { data: wishlistData } = await (supabase as any)
          .from('wishlist')
          .select('listing_id')
          .eq('user_id', user.id);

        if (wishlistData && wishlistData.length > 0) {
          const listingIds = wishlistData.map((item: any) => item.listing_id);
          const { data: listingsData } = await supabase
            .from('listings')
            .select('*')
            .in('id', listingIds);

          if (listingsData) {
            setWishlistItems(listingsData);
          }
        } else {
          setWishlistItems([]);
        }
      };
      fetchWishlist();
    }
  }, [user?.id]);

  if (!user) return null;

  const totalViews = listings.reduce((sum, listing) => sum + (listing.views || 0), 0);
  const avgRating = listings.length > 0
    ? listings.reduce((sum, listing) => sum + (listing.rating || 0), 0) / listings.length
    : 0;
  const approvedListings = listings.filter(l => l.listing_status === 'approved').length;
  const pendingListings = listings.filter(l => l.listing_status === 'pending').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3F4] via-white to-[#F5F3F4]">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 pt-16 sm:pt-20 md:pt-28 pb-8 sm:pb-12 md:pb-20">

        {/* Hero Section */}
        <DashboardHero
          user={user}
          totalViews={totalViews}
          avgRating={avgRating}
          streakData={streakData}
          avatarUrl={avatarUrl}
          userName={userName}
          onEditProfile={() => setEditDialogOpen(true)}
        />
        {(!listingsEnabled || loading) ? (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <StatsCardsOnProfile
              totalListings={listings.length}
              totalViews={totalViews}
              avgRating={avgRating}
              approvedListings={approvedListings}
              pendingListings={pendingListings}
            />

            <div className="mt-8 mb-8">
              <h2 className="text-2xl font-bold text-[#161A1D] mb-6">Review Analytics</h2>
              <OwnerReviewAnalytics userId={user.id} />
            </div>

            <ListingCardOnProfile listings={listings} />

            <WishlistSection listings={wishlistItems} />
          </>
        )}
      </div>

      {/* Edit Profile Dialog */}
      <ProfileEditDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} />
    </div>
  );
};

export default Profile;