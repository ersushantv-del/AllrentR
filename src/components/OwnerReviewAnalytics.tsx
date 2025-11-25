import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Star, TrendingUp, Users, MessageSquare, ThumbsUp } from 'lucide-react';

interface AnalyticsData {
    totalReviews: number;
    averageRating: number;
    totalHelpfulVotes: number;
    ratingDistribution: { name: string; value: number }[];
    categoryAverages: {
        condition: number;
        communication: number;
        value: number;
        accuracy: number;
    };
}

export const OwnerReviewAnalytics = ({ userId }: { userId: string }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Get all listings for this user
                const { data: listings } = await supabase
                    .from('listings')
                    .select('id')
                    .eq('user_id', userId);

                if (!listings?.length) {
                    setLoading(false);
                    return;
                }

                const listingIds = listings.map(l => l.id);

                // Get all ratings for these listings
                const { data: ratings } = await (supabase
                    .from('ratings') as any)
                    .select('*')
                    .in('listing_id', listingIds);

                if (!ratings) {
                    setLoading(false);
                    return;
                }

                // Calculate stats
                const totalReviews = ratings.length;
                const averageRating = totalReviews > 0
                    ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
                    : 0;

                const totalHelpfulVotes = ratings.reduce((sum: number, r: any) => sum + (r.helpful_votes || 0), 0);

                // Distribution
                const distribution = [1, 2, 3, 4, 5].map(star => ({
                    name: `${star} Stars`,
                    value: ratings.filter((r: any) => Math.round(r.rating) === star).length
                }));

                // Category averages
                const categoryAverages = {
                    condition: totalReviews > 0 ? ratings.reduce((sum: number, r: any) => sum + (r.rating_condition || r.rating), 0) / totalReviews : 0,
                    communication: totalReviews > 0 ? ratings.reduce((sum: number, r: any) => sum + (r.rating_communication || r.rating), 0) / totalReviews : 0,
                    value: totalReviews > 0 ? ratings.reduce((sum: number, r: any) => sum + (r.rating_value || r.rating), 0) / totalReviews : 0,
                    accuracy: totalReviews > 0 ? ratings.reduce((sum: number, r: any) => sum + (r.rating_accuracy || r.rating), 0) / totalReviews : 0,
                };

                setData({
                    totalReviews,
                    averageRating,
                    totalHelpfulVotes,
                    ratingDistribution: distribution,
                    categoryAverages
                });

            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [userId]);

    if (loading) return <div className="p-8 text-center">Loading analytics...</div>;
    if (!data || data.totalReviews === 0) return <div className="p-8 text-center text-muted-foreground">No reviews yet to analyze.</div>;

    const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600">Total Reviews</p>
                            <h3 className="text-3xl font-bold text-blue-900">{data.totalReviews}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <MessageSquare className="w-6 h-6 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-100">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-yellow-600">Average Rating</p>
                            <h3 className="text-3xl font-bold text-yellow-900">{data.averageRating.toFixed(1)}</h3>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <Star className="w-6 h-6 text-yellow-600 fill-current" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600">Helpful Votes</p>
                            <h3 className="text-3xl font-bold text-green-900">{data.totalHelpfulVotes}</h3>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <ThumbsUp className="w-6 h-6 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-600">Engagement</p>
                            <h3 className="text-3xl font-bold text-purple-900">High</h3>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Rating Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.ratingDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                />
                                <Bar dataKey="value" fill="#E5383B" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Category Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={[
                                    { name: 'Condition', value: data.categoryAverages.condition },
                                    { name: 'Communication', value: data.categoryAverages.communication },
                                    { name: 'Value', value: data.categoryAverages.value },
                                    { name: 'Accuracy', value: data.categoryAverages.accuracy },
                                ]}
                                margin={{ left: 40 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" domain={[0, 5]} />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={30}>
                                    {
                                        [0, 1, 2, 3].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
