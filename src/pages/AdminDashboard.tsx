import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useListings, approveListing, rejectListing } from '@/hooks/useListings';
import { useAdminStats } from '@/hooks/useAdminStats';
import { CheckCircle, XCircle, Clock, IndianRupee, Users, TrendingUp, Download, FileSpreadsheet, FileText, ScrollText, Trophy, Bell, Tag, Activity, BarChart3, Package, Flag, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { listings: pendingListings, refetch } = useListings('pending');
  const { stats, loading: statsLoading, refetch: refetchStats } = useAdminStats();
  const [loading, setLoading] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [flaggedReviews, setFlaggedReviews] = useState<any[]>([]);

  const refetchActivityLogs = async () => {
    try {
      const { data: adminLogs } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      setActivityLogs(adminLogs || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const fetchFlaggedReviews = async () => {
    try {
      const { data } = await (supabase
        .from('ratings') as any)
        .select('*, listings(product_name)')
        .eq('status', 'flagged');
      setFlaggedReviews(data || []);
    } catch (error) {
      console.error('Error fetching flagged reviews:', error);
    }
  };

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/');
      return;
    }
    refetchActivityLogs();
    fetchFlaggedReviews();
  }, [user, isAdmin, navigate]);

  const handleApprove = async (listingId: string) => {
    setLoading(listingId);
    const success = await approveListing(listingId);

    if (success) {
      await supabase.from('admin_activity_logs').insert({
        admin_id: user?.id,
        action: 'APPROVE_LISTING',
        target_type: 'listing',
        target_id: listingId,
        details: { timestamp: new Date().toISOString() }
      });

      toast({
        title: "Listing approved!",
        description: "The listing is now live on the marketplace.",
      });
      await refetch();
      await refetchStats();
      await refetchActivityLogs();
    }
    setLoading(null);
  };

  const handleReject = async (listingId: string) => {
    setLoading(listingId);
    const success = await rejectListing(listingId);

    if (success) {
      await supabase.from('admin_activity_logs').insert({
        admin_id: user?.id,
        action: 'REJECT_LISTING',
        target_type: 'listing',
        target_id: listingId,
        details: { timestamp: new Date().toISOString() }
      });

      toast({
        title: "Listing rejected",
        description: "The listing has been rejected.",
        variant: "destructive",
      });
      await refetch();
      await refetchStats();
      await refetchActivityLogs();
    }
    setLoading(null);
  };

  const handleReviewAction = async (reviewId: string, action: 'approve' | 'remove') => {
    try {
      const status = action === 'approve' ? 'published' : 'removed';
      const { error } = await (supabase
        .from('ratings') as any)
        .update({ status })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: `Review ${action}d`,
        description: `Review has been ${status}.`,
      });
      fetchFlaggedReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      toast({
        title: 'Error',
        description: 'Failed to update review status',
        variant: 'destructive',
      });
    }
  };

  const downloadReport = async () => {
    try {
      await supabase.from('admin_activity_logs').insert({
        admin_id: user?.id,
        action: 'DOWNLOAD_REPORT',
        target_type: 'system',
        target_id: 'report',
        details: { timestamp: new Date().toISOString() }
      });

      const { data: listings } = await supabase.from('listings').select('*');
      const { data: profiles } = await supabase.from('profiles').select('*');

      let csv = 'RENTKARO ADMIN REPORT\n\n';
      csv += 'SUMMARY STATISTICS\n';
      csv += `Total Listings,${stats.totalListings}\n`;
      csv += `Approved Listings,${stats.approvedListings}\n`;
      csv += `Pending Listings,${stats.pendingListings}\n`;
      csv += `Rejected Listings,${stats.rejectedListings}\n`;
      csv += `Total Users,${stats.totalUsers}\n`;
      csv += `Total Revenue,₹${stats.totalRevenue}\n\n`;

      csv += 'ALL LISTINGS\n';
      csv += 'ID,Product Name,Description,Rent Price,Pin Code,Status,Created At\n';
      listings?.forEach(l => {
        csv += `"${l.id}","${l.product_name}","${l.description}",${l.rent_price},"${l.pin_code}","${l.listing_status}","${l.created_at}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rentkaro-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report downloaded",
        description: "Your admin report has been downloaded successfully",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />

      <div className="container mx-auto px-4 pt-28 pb-20">
        {/* Header Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-3xl p-8 border border-border/50 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                  <Activity className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-sm font-bold text-primary">ADMIN CONTROL PANEL</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-3">
                  Dashboard
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  Monitor platform performance, manage listings, and control all administrative functions
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={downloadReport} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-amber-500/20">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-foreground">{stats.pendingListings}</p>
                <p className="text-xs text-muted-foreground mt-1">Pending</p>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-full" />
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-foreground">{stats.approvedListings}</p>
                <p className="text-xs text-muted-foreground mt-1">Approved</p>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full" />
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-foreground">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Users</p>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-full" />
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <IndianRupee className="w-6 h-6 text-primary" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-foreground">₹{stats.totalRevenue}</p>
                <p className="text-xs text-muted-foreground mt-1">Revenue</p>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-primary/30 to-accent/30 rounded-full" />
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-primary" />
            Management Tools
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Button onClick={() => navigate('/admin/terms')} variant="outline" className="h-24 flex-col gap-2">
              <ScrollText className="w-6 h-6" />
              <span className="text-sm font-medium">Terms</span>
            </Button>
            <Button onClick={() => navigate('/admin/ad-editor')} variant="outline" className="h-24 flex-col gap-2">
              <FileText className="w-6 h-6" />
              <span className="text-sm font-medium">Ads</span>
            </Button>
            <Button onClick={() => navigate('/admin/blogs')} variant="outline" className="h-24 flex-col gap-2">
              <FileText className="w-6 h-6" />
              <span className="text-sm font-medium">Blogs</span>
            </Button>
            <Button onClick={() => navigate('/admin/top-profiles')} variant="outline" className="h-24 flex-col gap-2">
              <Users className="w-6 h-6" />
              <span className="text-sm font-medium">Profiles</span>
            </Button>
            <Button onClick={() => navigate('/admin/influencer-partners')} variant="outline" className="h-24 flex-col gap-2">
              <Users className="w-6 h-6" />
              <span className="text-sm font-medium">Influencers</span>
            </Button>
            <Button onClick={() => navigate('/admin/leaderboard')} variant="outline" className="h-24 flex-col gap-2">
              <Trophy className="w-6 h-6" />
              <span className="text-sm font-medium">Leaderboard</span>
            </Button>
            <Button onClick={() => navigate('/admin/notifications')} variant="outline" className="h-24 flex-col gap-2">
              <Bell className="w-6 h-6" />
              <span className="text-sm font-medium">Notifications</span>
            </Button>
            <Button onClick={() => navigate('/admin/coupons')} variant="outline" className="h-24 flex-col gap-2">
              <Tag className="w-6 h-6" />
              <span className="text-sm font-medium">Coupons</span>
            </Button>
            <Button onClick={() => navigate('/manage-packages')} variant="outline" className="h-24 flex-col gap-2">
              <Package className="w-6 h-6" />
              <span className="text-sm font-medium">Packages</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="listings">Pending Listings</TabsTrigger>
            <TabsTrigger value="reviews">Flagged Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <Package className="w-6 h-6 text-primary" />
                      Pending Approvals
                    </h2>
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-bold">
                      {pendingListings.length} Items
                    </span>
                  </div>

                  {pendingListings.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      </div>
                      <p className="text-xl font-semibold text-foreground mb-2">All Caught Up!</p>
                      <p className="text-muted-foreground">No pending listings to review</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {pendingListings.map((listing) => (
                        <Card key={listing.id} className="p-4 border-l-4 border-l-amber-500 hover:shadow-md transition-all">
                          <div className="flex gap-4">
                            <img
                              src={listing.images[0] || '/placeholder.svg'}
                              alt={listing.product_name}
                              className="w-24 h-24 object-cover rounded-lg border border-border"
                            />
                            <div className="flex-1">
                              <h3 className="font-bold text-lg mb-1">{listing.product_name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{listing.description}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-semibold text-primary">₹{listing.rent_price || 0}{listing.product_type === 'sale' ? '' : '/day'}</span>
                                <span className="text-muted-foreground">📍 {listing.pin_code}</span>
                                {listing.listing_type === 'paid' && (
                                  <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                    PAID
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                onClick={() => handleApprove(listing.id)}
                                disabled={loading === listing.id}
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleReject(listing.id)}
                                disabled={loading === listing.id}
                                size="sm"
                                variant="destructive"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Activity Feed */}
              <div>
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Recent Activity
                  </h2>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {activityLogs.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No recent activity</p>
                    ) : (
                      activityLogs.map((log) => (
                        <div key={log.id} className="flex gap-3 pb-4 border-b border-border/50 last:border-0">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {log.action.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Flag className="w-6 h-6 text-red-500" />
                  Flagged Reviews
                </h2>
                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-sm font-bold">
                  {flaggedReviews.length} Items
                </span>
              </div>

              {flaggedReviews.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <p className="text-xl font-semibold text-foreground mb-2">All Clear!</p>
                  <p className="text-muted-foreground">No flagged reviews to moderate</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {flaggedReviews.map((review) => (
                    <Card key={review.id} className="p-4 border-l-4 border-l-red-500">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="font-semibold text-red-500">Flagged for Review</span>
                            <span className="text-sm text-muted-foreground">• {new Date(review.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="font-medium mb-1">Listing: {review.listings?.product_name}</p>
                          <p className="text-sm text-muted-foreground mb-3">"{review.comment}"</p>
                          {review.flag_reason && (
                            <p className="text-xs bg-red-50 text-red-600 p-2 rounded mb-3">
                              Reason: {review.flag_reason}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleReviewAction(review.id, 'approve')}
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Keep Review
                            </Button>
                            <Button
                              onClick={() => handleReviewAction(review.id, 'remove')}
                              size="sm"
                              variant="destructive"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Remove Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
