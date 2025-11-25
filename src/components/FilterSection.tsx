import React, { useState } from 'react';
import { Search, MapPin, SlidersHorizontal, X, ChevronDown, Sparkles, Navigation } from 'lucide-react';

interface FilterSectionProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  pinCodeFilter: string;
  setPinCodeFilter: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  categories: Array<{ value: string; label: string }>;
  nearbyEnabled: boolean;
  setNearbyEnabled: (value: boolean) => void;
  requestLocation: () => void;
  radiusMeters: number;
  setRadiusMeters: (value: number) => void;
  clusterMode: 'none' | 'city' | 'pin' | 'geo';
  setClusterMode: (value: 'none' | 'city' | 'pin' | 'geo') => void;
  setSelectedClusterItems?: (items: any[] | null) => void;
  minPrice: number;
  setMinPrice: (value: number) => void;
  maxPrice: number;
  setMaxPrice: (value: number) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
}

const FilterSection = ({
  searchQuery,
  setSearchQuery,
  pinCodeFilter,
  setPinCodeFilter,
  categoryFilter,
  setCategoryFilter,
  categories,
  nearbyEnabled,
  setNearbyEnabled,
  requestLocation,
  radiusMeters,
  setRadiusMeters,
  clusterMode,
  setClusterMode,
  setSelectedClusterItems,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sortBy,
  setSortBy,
}: FilterSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFiltersCount = [
    searchQuery ? 1 : 0,
    pinCodeFilter ? 1 : 0,
    categoryFilter ? 1 : 0,
    nearbyEnabled ? 1 : 0,
    minPrice > 0 ? 1 : 0,
    maxPrice < 1000000 ? 1 : 0,
    sortBy !== 'newest' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleRequestLocation = () => {
    if (nearbyEnabled) {
      setNearbyEnabled(false);
    } else {
      requestLocation();
    }
  };

  return (
    <div className="w-full mb-8">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!isExpanded && (
          <div
            onClick={() => setIsExpanded(true)}
            className="group cursor-pointer relative"
          >
            <div className="w-full relative bg-gradient-to-br from-white/95 to-[#F5F3F4]/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/50 group-hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#E5383B] to-[#660708] rounded-2xl blur-md opacity-50" />
                    <div className="relative bg-gradient-to-br from-[#E5383B] to-[#BA181B] p-4 rounded-2xl">
                      <SlidersHorizontal className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-[#161A1D] via-[#660708] to-[#BA181B] bg-clip-text text-transparent">
                      Smart Filters
                    </h3>
                    <p className="text-sm text-[#660708]/60 mt-1">
                      Click to refine your search
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {activeFiltersCount > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E5383B] to-[#BA181B] rounded-full shadow-lg">
                      <Sparkles className="w-4 h-4 text-white" />
                      <span className="text-white font-bold text-sm">{activeFiltersCount}</span>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-[#660708] to-[#BA181B] p-3 rounded-full group-hover:rotate-180 transition-transform duration-500">
                    <ChevronDown className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Quick preview of active filters */}
              {activeFiltersCount > 0 && (
                <div className="mt-4 pt-4 border-t border-[#B1A7A6]/20">
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <div className="px-3 py-1 bg-gradient-to-r from-[#E5383B]/10 to-[#BA181B]/10 rounded-full border border-[#E5383B]/30">
                        <span className="text-xs font-medium text-[#660708]">Search: {searchQuery}</span>
                      </div>
                    )}
                    {pinCodeFilter && (
                      <div className="px-3 py-1 bg-gradient-to-r from-[#E5383B]/10 to-[#BA181B]/10 rounded-full border border-[#E5383B]/30">
                        <span className="text-xs font-medium text-[#660708]">PIN: {pinCodeFilter}</span>
                      </div>
                    )}
                    {categoryFilter && (
                      <div className="px-3 py-1 bg-gradient-to-r from-[#E5383B]/10 to-[#BA181B]/10 rounded-full border border-[#E5383B]/30">
                        <span className="text-xs font-medium text-[#660708]">
                          {categories.find(c => c.value === categoryFilter)?.label}
                        </span>
                      </div>
                    )}
                    {nearbyEnabled && (
                      <div className="px-3 py-1 bg-gradient-to-r from-[#E5383B]/10 to-[#BA181B]/10 rounded-full border border-[#E5383B]/30">
                        <span className="text-xs font-medium text-[#660708]">Nearby: {radiusMeters / 1000}km</span>
                      </div>
                    )}
                    {(minPrice > 0 || maxPrice < 1000000) && (
                      <div className="px-3 py-1 bg-gradient-to-r from-[#E5383B]/10 to-[#BA181B]/10 rounded-full border border-[#E5383B]/30">
                        <span className="text-xs font-medium text-[#660708]">Price: ₹{minPrice} - ₹{maxPrice}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <div className="relative">
            <div className="relative bg-gradient-to-br from-white/95 to-[#F5F3F4]/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
              {/* Header with close button */}
              <div className="relative p-6 border-b border-[#B1A7A6]/20">
                <div className="absolute inset-0 bg-gradient-to-r from-[#E5383B]/5 to-[#660708]/5" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-[#E5383B] to-[#BA181B] p-3 rounded-2xl">
                      <SlidersHorizontal className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-[#161A1D] via-[#660708] to-[#BA181B] bg-clip-text text-transparent">
                        Advanced Filters
                      </h3>
                      <p className="text-xs text-[#660708]/60 mt-1">
                        Fine-tune your search results
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsExpanded(false)}
                    className="group p-2 hover:bg-[#E5383B]/10 rounded-xl transition-all duration-300"
                  >
                    <X className="w-6 h-6 text-[#660708] group-hover:text-[#E5383B] group-hover:rotate-90 transition-all duration-300" />
                  </button>
                </div>
              </div>

              {/* Filter Content */}
              <div className="p-6 space-y-6">
                {/* Search and PIN row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Search Input */}
                  <div className="group/input relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#E5383B]/20 to-[#BA181B]/20 rounded-2xl blur-md opacity-0 group-hover/input:opacity-100 transition-opacity duration-300" />
                    <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-[#B1A7A6]/30 group-hover/input:border-[#E5383B]/50 transition-all duration-300 overflow-hidden">
                      <div className="flex items-center p-4 gap-3">
                        <div className="bg-gradient-to-br from-[#E5383B]/10 to-[#BA181B]/10 p-2.5 rounded-xl">
                          <Search className="w-5 h-5 text-[#BA181B]" />
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search anything..."
                          className="flex-1 bg-transparent text-[#161A1D] placeholder:text-[#B1A7A6] outline-none font-medium"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="p-1.5 hover:bg-[#E5383B]/10 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4 text-[#660708]" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PIN Code Input */}
                  <div className="group/input relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#E5383B]/20 to-[#BA181B]/20 rounded-2xl blur-md opacity-0 group-hover/input:opacity-100 transition-opacity duration-300" />
                    <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-[#B1A7A6]/30 group-hover/input:border-[#E5383B]/50 transition-all duration-300 overflow-hidden">
                      <div className="flex items-center p-4 gap-3">
                        <div className="bg-gradient-to-br from-[#E5383B]/10 to-[#BA181B]/10 p-2.5 rounded-xl">
                          <MapPin className="w-5 h-5 text-[#BA181B]" />
                        </div>
                        <input
                          type="text"
                          value={pinCodeFilter}
                          onChange={(e) => setPinCodeFilter(e.target.value)}
                          placeholder="Enter PIN code..."
                          className="flex-1 bg-transparent text-[#161A1D] placeholder:text-[#B1A7A6] outline-none font-medium"
                        />
                        {pinCodeFilter && (
                          <button
                            onClick={() => setPinCodeFilter('')}
                            className="p-1.5 hover:bg-[#E5383B]/10 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4 text-[#660708]" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Range and Sort */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/50 p-4 rounded-2xl border border-[#B1A7A6]/20">
                    <label className="block text-sm font-semibold text-[#660708] mb-3">Price Range (₹)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(Number(e.target.value))}
                        placeholder="Min"
                        className="w-full bg-white border border-[#B1A7A6]/30 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5383B]/50"
                      />
                      <span className="text-[#660708]">-</span>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        placeholder="Max"
                        className="w-full bg-white border border-[#B1A7A6]/30 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5383B]/50"
                      />
                    </div>
                  </div>

                  <div className="bg-white/50 p-4 rounded-2xl border border-[#B1A7A6]/20">
                    <label className="block text-sm font-semibold text-[#660708] mb-3">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full bg-white border border-[#B1A7A6]/30 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5383B]/50"
                    >
                      <option value="newest">Newest First</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="most_reviewed">Most Reviewed</option>
                      <option value="top_rated">Top Rated</option>
                    </select>
                  </div>
                </div>

                {/* Category Pills */}
                <div>
                  <label className="block text-sm font-semibold text-[#660708] mb-3 ml-1">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setCategoryFilter(cat.value === '' ? '' : cat.value)}
                        className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${categoryFilter === cat.value
                            ? 'bg-gradient-to-r from-[#E5383B] to-[#BA181B] text-white shadow-lg scale-105'
                            : 'bg-white/80 border-2 border-[#B1A7A6]/30 text-[#161A1D] hover:border-[#E5383B]/50 hover:scale-105'
                          }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Section */}
                <div className="bg-gradient-to-br from-[#F5F3F4]/50 to-white/50 rounded-2xl p-5 border border-[#B1A7A6]/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-[#BA181B]" />
                      <span className="font-semibold text-[#660708]">Location-based Search</span>
                    </div>
                    <button
                      onClick={handleRequestLocation}
                      className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 ${nearbyEnabled
                          ? 'bg-gradient-to-r from-[#E5383B] to-[#BA181B] text-white shadow-lg'
                          : 'bg-white border-2 border-[#B1A7A6]/30 text-[#660708] hover:border-[#E5383B]/50'
                        }`}
                    >
                      {nearbyEnabled ? 'Enabled' : 'Enable'}
                    </button>
                  </div>

                  {nearbyEnabled && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[#660708]/70">Radius:</span>
                      <select
                        value={radiusMeters}
                        onChange={(e) => setRadiusMeters(Number(e.target.value))}
                        className="flex-1 bg-white border-2 border-[#B1A7A6]/30 rounded-xl px-4 py-2 text-[#161A1D] font-medium outline-none focus:border-[#E5383B]/50 transition-colors"
                      >
                        <option value={2000}>2 kilometers</option>
                        <option value={5000}>5 kilometers</option>
                        <option value={10000}>10 kilometers</option>
                        <option value={20000}>20 kilometers</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Cluster Mode */}
                <div>
                  <label className="block text-sm font-semibold text-[#660708] mb-3 ml-1">
                    Display Mode
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { val: 'none' as const, label: 'All Items' },
                      { val: 'city' as const, label: 'By City' },
                      { val: 'pin' as const, label: 'By PIN' },
                      { val: 'geo' as const, label: 'By Area' },
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        onClick={() => {
                          setClusterMode(val);
                          if (setSelectedClusterItems && val === 'none') {
                            setSelectedClusterItems(null);
                          }
                        }}
                        className={`p-4 rounded-xl font-medium text-sm transition-all duration-300 ${clusterMode === val
                            ? 'bg-gradient-to-br from-[#E5383B] to-[#BA181B] text-white shadow-lg scale-105'
                            : 'bg-white/80 border-2 border-[#B1A7A6]/30 text-[#161A1D] hover:border-[#E5383B]/50 hover:scale-105'
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Filters Summary */}
                {activeFiltersCount > 0 && (
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#E5383B]/10 via-[#BA181B]/10 to-[#660708]/10 rounded-2xl border border-[#E5383B]/20">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#E5383B]" />
                      <span className="font-semibold text-[#660708]">
                        {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setPinCodeFilter('');
                        setCategoryFilter('');
                        setNearbyEnabled(false);
                        setClusterMode('none');
                        setMinPrice(0);
                        setMaxPrice(1000000);
                        setSortBy('newest');
                        if (setSelectedClusterItems) {
                          setSelectedClusterItems(null);
                        }
                      }}
                      className="px-4 py-2 bg-white hover:bg-[#E5383B]/10 rounded-xl text-sm font-medium text-[#660708] transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSection;