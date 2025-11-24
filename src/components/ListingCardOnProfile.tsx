import React from 'react';
import { Package, Eye, Star, Clock, TrendingUp, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const Card = ({ children, className }) => (
  <div className={className}>{children}</div>
);

export default function ListingsCardOnProfile({ listings }) {

  const pendingListings = listings.filter(l => l.listing_status === 'pending').length;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-[#0B090A]" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-[#A4161A]" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-[#660708]" />;
      default:
        return null;
    }
  };

  // ✅ New status badge styling logic
  const getStatusBadge = (status) => {
    const styles = {
      approved:
        'bg-gradient-to-r from-[#BA181B] to-[#E5383B] text-white border-transparent shadow-lg shadow-[#E5383B]/20',
      pending:
        'bg-[#F5F3F4] text-[#660708] border-[#B1A7A6]',
      rejected:
        'bg-[#660708]/10 text-[#660708] border-[#660708]/30',
    };
    return styles[status] || '';
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <Card className="relative max-w-7xl mx-auto bg-white/80 backdrop-blur-sm shadow-2xl rounded-[2rem] overflow-hidden border border-[#D3D3D3]/30">
        {/* Animated gradient border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#660708] via-[#E5383B] to-[#BA181B] animate-pulse"></div>

        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#E5383B]/10 via-[#BA181B]/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-[#660708]/10 via-[#161A1D]/5 to-transparent rounded-full blur-3xl"></div>

        <div className="relative p-8 md:p-12">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#E5383B] to-[#BA181B] animate-pulse"></div>
                <h2 className="pb-2 text-4xl md:text-5xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0B090A] via-[#660708] to-[#A4161A]">
                  Your Listings
                </h2>
              </div>
              <p className="text-[#660708]/80 font-medium text-lg ml-7">
                Manage and track all your products
              </p>
            </div>

            <div className="flex items-center gap-4">
              {pendingListings > 0 && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#E5383B] to-[#BA181B] rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative px-6 py-3 bg-gradient-to-r from-[#A4161A] to-[#BA181B] rounded-2xl text-white font-bold shadow-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{pendingListings} Pending Review</span>
                  </div>
                </div>
              )}
              <div className="px-6 py-3 bg-gradient-to-r from-[#F5F3F4] to-white rounded-2xl border-2 border-[#D3D3D3] font-bold text-[#660708] flex items-center gap-2 hover:shadow-lg transition-shadow">
                <TrendingUp className="w-5 h-5" />
                <span>{listings.length} Active</span>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          {listings.length === 0 ? (
            <div className="text-center py-32">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E5383B]/20 to-[#BA181B]/20 rounded-3xl blur-xl"></div>
                <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-[#E5383B]/10 to-[#BA181B]/10 flex items-center justify-center border-2 border-[#D3D3D3]/50">
                  <Package className="w-16 h-16 text-[#660708]" />
                </div>
              </div>
              <p className="text-2xl text-[#660708] font-bold mb-3">
                No listings yet
              </p>
              <p className="text-[#B1A7A6] text-lg">
                Start listing your items to begin earning!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {listings.map((listing, index) => (
                <div
                  key={listing.id}
                  className="group relative bg-gradient-to-br from-white via-[#F5F3F4]/30 to-white rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 border-2 border-[#D3D3D3]/40 hover:border-[#E5383B]/50"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                  }}
                >
                  {/* Hover gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#E5383B]/0 via-[#E5383B]/5 to-[#BA181B]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#E5383B]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                  <div className="relative p-8">
                    <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                      {/* Content Section */}
                      <div className="flex-1 space-y-5">
                        {/* Title and Status */}
                        <div className="flex items-start gap-4 flex-wrap">
                          <h3 className="text-2xl font-black text-[#0B090A] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#660708] group-hover:to-[#E5383B] transition-all duration-300">
                            {listing.product_name}
                          </h3>
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 ${getStatusBadge(listing.listing_status)} shadow-sm`}>
                            {getStatusIcon(listing.listing_status)}
                            <span className="capitalize">{listing.listing_status}</span>
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-[#660708]/70 text-lg leading-relaxed">
                          {listing.description}
                        </p>

                        {/* Stats Section */}
                        <div className="flex items-center gap-6 flex-wrap pt-2">
                          {/* Price Badge */}
                          <div className="relative group/price">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#BA181B] to-[#E5383B] rounded-2xl blur opacity-40 group-hover/price:opacity-60 transition-opacity"></div>
                            <div className="relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#BA181B] to-[#E5383B] text-white font-bold rounded-2xl shadow-lg">
                              <span className="text-2xl">₹{listing.rent_price || 0}</span>
                              {listing.product_type !== 'sale' && <span className="text-sm text-white/90">/day</span>}
                            </div>
                          </div>

                          {/* Views */}
                          <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-[#F5F3F4] to-white rounded-2xl border-2 border-[#D3D3D3] hover:border-[#660708]/30 transition-colors group/stat">
                            <Eye className="w-5 h-5 text-[#660708] group-hover/stat:scale-110 transition-transform" />
                            <div className="flex flex-col">
                              <span className="text-xs text-[#B1A7A6] font-medium">Views</span>
                              <span className="text-lg font-bold text-[#660708]">{listing.views || 0}</span>
                            </div>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl border-2 border-amber-200 hover:border-amber-300 transition-colors group/stat">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500 group-hover/stat:scale-110 transition-transform" />
                            <div className="flex flex-col">
                              <span className="text-xs text-amber-700 font-medium">Rating</span>
                              <span className="text-lg font-bold text-amber-700">{listing.rating?.toFixed(1) || '5.0'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div className="h-1 bg-gradient-to-r from-transparent via-[#E5383B]/30 to-transparent group-hover:via-[#E5383B]/60 transition-all duration-500"></div>
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