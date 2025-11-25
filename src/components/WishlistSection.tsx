import React from 'react';
import { Package, Eye, Star, Heart, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={className}>{children}</div>
);

export default function WishlistSection({ listings }: { listings: any[] }) {
    const navigate = useNavigate();

    return (
        <div className="mt-8 mb-8">
            <Card className="relative max-w-7xl mx-auto bg-white/80 backdrop-blur-sm shadow-2xl rounded-[2rem] overflow-hidden border border-[#D3D3D3]/30">
                {/* Animated gradient border */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#660708] via-[#E5383B] to-[#BA181B] animate-pulse"></div>

                <div className="relative p-8 md:p-12">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#E5383B] to-[#BA181B] animate-pulse"></div>
                                <h2 className="pb-2 text-3xl md:text-4xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0B090A] via-[#660708] to-[#A4161A]">
                                    My Wishlist
                                </h2>
                            </div>
                            <p className="text-[#660708]/80 font-medium text-lg ml-7">
                                Items you've saved for later
                            </p>
                        </div>

                        <div className="px-6 py-3 bg-gradient-to-r from-[#F5F3F4] to-white rounded-2xl border-2 border-[#D3D3D3] font-bold text-[#660708] flex items-center gap-2 hover:shadow-lg transition-shadow">
                            <Heart className="w-5 h-5 fill-[#E5383B] text-[#E5383B]" />
                            <span>{listings.length} Saved</span>
                        </div>
                    </div>

                    {/* Listings Grid */}
                    {listings.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="relative inline-block mb-8">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#E5383B]/20 to-[#BA181B]/20 rounded-3xl blur-xl"></div>
                                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#E5383B]/10 to-[#BA181B]/10 flex items-center justify-center border-2 border-[#D3D3D3]/50">
                                    <Heart className="w-12 h-12 text-[#660708]" />
                                </div>
                            </div>
                            <p className="text-xl text-[#660708] font-bold mb-3">
                                Your wishlist is empty
                            </p>
                            <p className="text-[#B1A7A6] text-lg mb-6">
                                Save items you like to find them easily later.
                            </p>
                            <button
                                onClick={() => navigate('/listings')}
                                className="px-6 py-3 bg-gradient-to-r from-[#E5383B] to-[#BA181B] text-white rounded-xl font-bold hover:shadow-lg transition-all"
                            >
                                Browse Listings
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {listings.map((listing, index) => (
                                <div
                                    key={listing.id}
                                    onClick={() => navigate('/listings')} // Ideally this would open the specific listing details
                                    className="group relative bg-white rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 border border-[#D3D3D3]/40 hover:border-[#E5383B]/50 cursor-pointer"
                                    style={{
                                        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                                    }}
                                >
                                    {/* Image */}
                                    <div className="h-48 overflow-hidden relative">
                                        {listing.images?.[0] ? (
                                            <img
                                                src={listing.images[0]}
                                                alt={listing.product_name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                <Package className="w-12 h-12 text-gray-300" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold text-[#E5383B] shadow-sm">
                                            ₹{listing.rent_price}
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-[#0B090A] mb-2 line-clamp-1 group-hover:text-[#E5383B] transition-colors">
                                            {listing.product_name}
                                        </h3>
                                        <p className="text-[#660708]/70 text-sm line-clamp-2 mb-4">
                                            {listing.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                                    <Eye className="w-4 h-4" />
                                                    <span>{listing.views || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-sm text-amber-500">
                                                    <Star className="w-4 h-4 fill-current" />
                                                    <span>{listing.rating?.toFixed(1) || '5.0'}</span>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-[#F5F3F4] rounded-full group-hover:bg-[#E5383B] group-hover:text-white transition-colors">
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
}
