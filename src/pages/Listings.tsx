import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Navbar } from "@/components/Navbar";
import { RatingCard } from "@/components/RatingCard";
import { AdPopup } from "@/components/AdPopup";
import BannerCarousel from "@/components/BannerCarousel";
import FilterSection from "@/components/FilterSection";
import { useListings, incrementViews } from "@/hooks/useListings";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/hooks/useChat";
import { ChatWindow } from "@/components/ChatWindow";
import {
  MapPin,
  Eye,
  Star,
  Phone,
  User,
  Package,
  Tag,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Listings = () => {
  const navigate = useNavigate();
  const { listings, loading } = useListings("approved");
  const { user } = useAuth();
  const { getOrCreateConversation, joinConversation, conversations } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  const [pinCodeFilter, setPinCodeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [clusterMode, setClusterMode] = useState<"none" | "city" | "pin" | "geo">("none");
  const [selectedClusterItems, setSelectedClusterItems] = useState<any[] | null>(null);
  const [nearbyEnabled, setNearbyEnabled] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [radiusMeters, setRadiusMeters] = useState<number>(5000);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyListings, setNearbyListings] = useState<any[]>([]);
  const [distanceById, setDistanceById] = useState<Record<string, number>>({});
  const [chatOpen, setChatOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  // const [testLoading] = useState(true);

  const handleViewListing = (listing: any) => {
    incrementViews(listing.id);
    setSelectedListing(listing);
  };

  const handleStartChat = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to start a conversation with the owner",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }

    if (!selectedListing) return;

    // Check if user is the owner
    if (selectedListing.owner_user_id === user.id) {
      toast({
        title: "Cannot chat with yourself",
        description: "You cannot start a conversation for your own listing",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if conversation already exists
      let conversation: any = existingConversation;

      if (!conversation) {
        // Get or create conversation
        conversation = await getOrCreateConversation(
          selectedListing.id,
          selectedListing.owner_user_id
        );
      }

      if (conversation) {
        // Determine which user profile to load
        const isOwner = selectedListing.owner_user_id === user.id;

        // Try to get profile from existing conversation data first
        let profile = null;
        if (existingConversation?.other_user) {
          profile = existingConversation.other_user;
        } else {
          // Fallback: try to fetch profile, but handle errors gracefully
          const otherUserId = isOwner ? conversation.leaser_id : conversation.owner_id;
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', otherUserId)
              .maybeSingle();

            if (!error && data) {
              profile = data;
            }
          } catch (err) {
            console.error('Error fetching profile:', err);
          }
        }

        // Set profile or use defaults
        if (profile) {
          setOtherUserProfile(profile);
        } else {
          setOtherUserProfile({
            name: isOwner ? 'Leaser' : 'Owner',
            avatar_url: null
          });
        }

        setCurrentConversationId(conversation.id);
        joinConversation(conversation.id);
        setChatOpen(true);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      });
    }
  };

  // Find existing conversation for selected listing
  const existingConversation = useMemo(() => {
    if (!selectedListing || !user) return null;
    return conversations.find(
      conv => conv.listing_id === selectedListing.id &&
        (conv.owner_id === user.id || conv.leaser_id === user.id)
    );
  }, [conversations, selectedListing, user]);

  const debouncedSearch = useDebounce(searchQuery, 500);
  const debouncedPin = useDebounce(pinCodeFilter, 500);

  const baseFiltered = useMemo(() => {
    return listings.filter((listing) => {
      const matchesSearch =
        listing.product_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        listing.description.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesPinCode =
        debouncedPin === "" || listing.pin_code.includes(debouncedPin);
      const matchesCategory =
        categoryFilter === "" || listing.category === categoryFilter;
      return matchesSearch && matchesPinCode && matchesCategory;
    });
  }, [listings, debouncedSearch, debouncedPin, categoryFilter]);

  const nearbyFiltered = useMemo(() => {
    if (!nearbyEnabled) return [];
    return nearbyListings.filter((listing) => {
      const matchesSearch =
        listing.product_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (listing.description || "").toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesPinCode = debouncedPin === "" || (listing.pin_code || "").includes(debouncedPin);
      const matchesCategory = categoryFilter === "" || listing.category === categoryFilter;
      return matchesSearch && matchesPinCode && matchesCategory;
    }).sort((a, b) => (distanceById[a.id] || 0) - (distanceById[b.id] || 0));
  }, [nearbyEnabled, nearbyListings, debouncedSearch, debouncedPin, categoryFilter, distanceById]);

  // If a cluster is selected, show only those items
  const clusterFiltered = useMemo(() => {
    if (!selectedClusterItems || selectedClusterItems.length === 0) return null;
    return selectedClusterItems.filter((listing) => {
      const matchesSearch =
        listing.product_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (listing.description || "").toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesPinCode = debouncedPin === "" || (listing.pin_code || "").includes(debouncedPin);
      const matchesCategory = categoryFilter === "" || listing.category === categoryFilter;
      return matchesSearch && matchesPinCode && matchesCategory;
    });
  }, [selectedClusterItems, debouncedSearch, debouncedPin, categoryFilter]);

  const filteredListings = clusterFiltered !== null
    ? clusterFiltered
    : (nearbyEnabled ? nearbyFiltered : baseFiltered);

  // Haversine helper for fallback distance calculations
  const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch nearby listings via RPC then hydrate to full records
  useEffect(() => {
    const fetchNearby = async () => {
      if (!nearbyEnabled || userLat == null || userLng == null) {
        setNearbyListings([]);
        setDistanceById({});
        return;
      }
      setNearbyLoading(true);
      try {
        // Cast to any to allow calling custom RPC without generated types
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('get_nearby_listings', {
          user_lat: userLat,
          user_lng: userLng,
          radius_meters: radiusMeters
        });

        if (rpcError) {
          console.error('RPC error:', rpcError);
          throw rpcError;
        }

        const rpcRows: any[] = Array.isArray(rpcData) ? rpcData : [];
        console.log('RPC returned', rpcRows.length, 'nearby listings');

        if (rpcRows.length === 0) {
          // RPC returned empty - this is normal if no listings in radius or RPC not available
          // Silently fall through to client-side fallback
          console.log('RPC returned no results, using client-side fallback');
        } else {
          // RPC succeeded, process results
          const ids = rpcRows.map((r: any) => r.id);
          const distanceMap: Record<string, number> = {};
          rpcRows.forEach((r: any) => { distanceMap[r.id] = r.distance_meters; });
          setDistanceById(distanceMap);

          const { data: fullRows, error: selError } = await supabase
            .from('listings')
            .select('*')
            .in('id', ids);
          if (selError) throw selError;

          // Preserve RPC order by distance
          const orderIndex: Record<string, number> = {};
          ids.forEach((id: string, i: number) => { orderIndex[id] = i; });
          const ordered = (fullRows || []).slice().sort((a: any, b: any) => orderIndex[a.id] - orderIndex[b.id]);
          setNearbyListings(ordered);
          console.log('Nearby listings set from RPC:', ordered.length);
          setNearbyLoading(false);
          return; // Exit early if RPC succeeded
        }

      } catch (e) {
        console.warn('RPC error, using client-side fallback:', e);
      }

      // Fallback: compute nearby client-side from all approved listings
      // This runs if RPC returned empty or failed
      try {
        const candidates = listings.filter((l: any) =>
          typeof l.latitude === 'number' &&
          typeof l.longitude === 'number' &&
          !isNaN(l.latitude) &&
          !isNaN(l.longitude)
        );
        console.log('Fallback: found', candidates.length, 'listings with coordinates');

        if (candidates.length === 0) {
          console.warn('No listings with coordinates found');
          setNearbyListings([]);
          setDistanceById({});
          setNearbyLoading(false);
          return;
        }

        const distances: Record<string, number> = {};
        // Calculate distances for all candidates first
        candidates.forEach((l: any) => {
          const d = haversineMeters(userLat!, userLng!, l.latitude, l.longitude);
          distances[l.id] = d;
        });

        // Filter to within radius - respect the user's radius selection
        const within = candidates.filter((l: any) => {
          return distances[l.id] <= radiusMeters;
        }).sort((a: any, b: any) => (distances[a.id] || 0) - (distances[b.id] || 0));

        console.log('Fallback: found', within.length, 'listings within', radiusMeters, 'meters');
        console.log('User location:', userLat, userLng);
        console.log('Total candidates with coordinates:', candidates.length);
        console.log('Sample distances:', Object.entries(distances).slice(0, 5));

        // Only store distances for listings within radius
        const distanceMap: Record<string, number> = {};
        within.forEach((l: any) => {
          distanceMap[l.id] = distances[l.id];
        });
        setDistanceById(distanceMap);
        setNearbyListings(within);

        if (within.length === 0) {
          // Find the closest listing to suggest increasing radius
          const allSorted = candidates.sort((a: any, b: any) => (distances[a.id] || 0) - (distances[b.id] || 0));
          const closestDistance = allSorted.length > 0 ? distances[allSorted[0].id] : null;
          const closestKm = closestDistance ? (closestDistance / 1000).toFixed(1) : 'unknown';

          toast({
            title: 'No listings within radius',
            description: `No listings found within ${radiusMeters / 1000}km. ${closestDistance ? `Closest listing is ${closestKm}km away. ` : ''}Try increasing the radius.`,
          });
        }
      } catch (err) {
        console.error('Nearby fallback failed', err);
        setNearbyListings([]);
        setDistanceById({});
        toast({
          title: 'Error finding nearby listings',
          description: 'Unable to calculate nearby listings. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setNearbyLoading(false);
      }
    };
    fetchNearby();
  }, [nearbyEnabled, userLat, userLng, radiusMeters, listings]);

  // Client-side clusters derived from filtered listings
  const clusters = useMemo(() => {
    // console.log('Clusters useMemo triggered, clusterMode:', clusterMode, 'listings count:', listings.length);
    if (clusterMode === 'none') {
      // console.log('Cluster mode is none, returning empty');
      return [] as any[];
    }

    // Use base listings (not filtered) for clustering to ensure we have all data
    const sourceListings = listings.length > 0 ? listings : filteredListings;
    if (!sourceListings || sourceListings.length === 0) {
      // console.log('No listings available for clustering');
      return [] as any[];
    }

    // console.log('Computing clusters for', sourceListings.length, 'listings, mode:', clusterMode);

    if (clusterMode === 'city') {
      const map: Record<string, any[]> = {};
      sourceListings.forEach((l: any) => {
        const key = (l.city && l.city.trim()) || 'Unknown';
        if (!map[key]) map[key] = [];
        map[key].push(l);
      });
      const result = Object.entries(map).map(([key, items]) => ({
        key,
        label: key,
        count: (items as any[]).length,
        items: items as any[],
      })).sort((a, b) => b.count - a.count);
      // console.log('City clusters:', result.length);
      return result;
    }

    if (clusterMode === 'pin') {
      const map: Record<string, any[]> = {};
      sourceListings.forEach((l: any) => {
        const key = (l.pin_code && l.pin_code.trim()) || '—';
        if (!map[key]) map[key] = [];
        map[key].push(l);
      });
      const result = Object.entries(map).map(([key, items]) => ({
        key,
        label: `PIN ${key}`,
        count: (items as any[]).length,
        items: items as any[],
      })).sort((a, b) => b.count - a.count);
      // console.log('PIN clusters:', result.length);
      return result;
    }

    // geo clustering by coarse lat/lng grid (~1km). Uses 0.01 deg buckets as a simple approximation
    if (clusterMode === 'geo') {
      const grid: Record<string, any[]> = {};
      sourceListings.forEach((l: any) => {
        if (typeof l.latitude !== 'number' || typeof l.longitude !== 'number' ||
          isNaN(l.latitude) || isNaN(l.longitude)) return;
        const latBucket = Math.round(l.latitude * 100) / 100;
        const lngBucket = Math.round(l.longitude * 100) / 100;
        const key = `${latBucket.toFixed(2)},${lngBucket.toFixed(2)}`;
        if (!grid[key]) grid[key] = [];
        grid[key].push(l);
      });
      const result = Object.entries(grid).map(([key, items]) => ({
        key,
        label: key,
        count: (items as any[]).length,
        items: items as any[],
      })).sort((a, b) => b.count - a.count);
      // console.log('Geo clusters:', result.length);
      return result;
    }

    return [] as any[];
  }, [clusterMode, listings, filteredListings]);

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support location services.',
        variant: 'destructive',
      });
      return;
    }
    // Clear previous coordinates to ensure fresh location
    setUserLat(null);
    setUserLng(null);
    setNearbyListings([]);
    setDistanceById({});

    // console.log('Requesting location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // console.log('Location obtained:', pos.coords.latitude, pos.coords.longitude);
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setNearbyEnabled(true);
        toast({
          title: 'Location enabled',
          description: 'Showing listings near you',
        });
      },
      (err) => {
        console.error('Geolocation error:', err);
        setNearbyEnabled(false);
        toast({
          title: 'Unable to get location',
          description: err.message || 'Please enable location permissions in your browser.',
          variant: 'destructive',
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const categories = [
    { value: "", label: "All" },
    { value: "electronics", label: "Electronics" },
    { value: "vehicles", label: "Vehicles" },
    { value: "furniture", label: "Furniture" },
    { value: "tools", label: "Tools" },
    { value: "sports", label: "Sports" },
    { value: "books", label: "Books" },
    { value: "clothing", label: "Clothing" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F3F4] to-white relative">
      <Navbar />
      <AdPopup />

      {/* Decorative soft glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 left-10 w-72 h-72 bg-[#E5383B]/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-20 w-96 h-96 bg-[#BA181B]/10 rounded-full blur-3xl animate-float delay-2000" />
      </div>

      <div className="container mx-auto px-4 pt-28 pb-20 relative z-10">
        <div className="mb-16 text-center space-y-4 animate-fade-in">
          <h1 className="text-5xl font-serif font-bold text-[#161A1D]">
            Browse Premium Items
          </h1>
          <p className="text-lg text-[#660708]/70">
            Discover verified rentals from trusted owners near you
          </p>
          <div className="w-20 h-[3px] mx-auto bg-gradient-to-r from-[#E5383B] to-[#BA181B] rounded-full" />
        </div>

        <BannerCarousel />

        {/* Smart Filters Section */}
        <FilterSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          pinCodeFilter={pinCodeFilter}
          setPinCodeFilter={setPinCodeFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          categories={categories}
          nearbyEnabled={nearbyEnabled}
          setNearbyEnabled={setNearbyEnabled}
          requestLocation={requestLocation}
          radiusMeters={radiusMeters}
          setRadiusMeters={setRadiusMeters}
          clusterMode={clusterMode}
          setClusterMode={setClusterMode}
          setSelectedClusterItems={setSelectedClusterItems}
        />

        {/* Listings Section */}
        <div id="listings-section">
          {/* Show indicator when viewing cluster items */}
          {selectedClusterItems && selectedClusterItems.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#E5383B]/10 to-[#BA181B]/10 border border-[#E5383B]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#E5383B]" />
                <span className="text-sm font-semibold text-[#660708]">
                  Showing {filteredListings.length} items from selected cluster
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedClusterItems(null);
                  setSearchQuery('');
                  setPinCodeFilter('');
                  setCategoryFilter('');
                }}
                className="border-[#E5383B] text-[#E5383B] hover:bg-[#E5383B] hover:text-white"
              >
                Clear Filter
              </Button>
            </div>
          )}
          {(loading || (nearbyEnabled && nearbyLoading)) ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 py-10 animate-fade-in">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-sm animate-pulse"
                >
                  {/* Image skeleton */}
                  <div className="h-56 bg-gray-200 rounded animate-shimmer" />

                  {/* Content skeleton */}
                  <div className="p-6 space-y-4">
                    <div className="h-5 bg-gray-200 rounded w-3/4 animate-shimmer" />
                    <div className="h-3 bg-gray-200 rounded w-full animate-shimmer" />
                    <div className="h-3 bg-gray-200 rounded w-5/6 animate-shimmer" />

                    <div className="flex items-center justify-between mt-4">
                      <div className="h-3 bg-gray-200 rounded w-1/4 animate-shimmer" />
                      <div className="h-3 bg-gray-200 rounded w-1/6 animate-shimmer" />
                    </div>

                    <div className="h-9 bg-gray-200 rounded-xl mt-5 animate-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : (clusterMode !== 'none') ? (
            clusters.length === 0 ? (
              <div className="text-center py-20 animate-fade-in">
                <p className="text-xl text-[#660708]/70">
                  No clusters found. {listings.length === 0 ? 'No listings available.' : 'Try a different cluster mode or check if listings have location data.'}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                {clusters.map((cluster, index) => (
                  <Card
                    key={cluster.key}
                    className="group bg-white border border-[#E5E5E5] hover:border-[#E5383B]/50 hover:shadow-[0_8px_30px_rgba(229,56,59,0.15)] transition-all duration-500 rounded-2xl overflow-hidden"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-[#161A1D]">{cluster.label}</h3>
                        <span className="text-sm px-2 py-1 rounded-full bg-[#E5383B]/10 text-[#E5383B] font-semibold">{cluster.count}</span>
                      </div>
                      <p className="text-sm text-[#660708]/70">Popular items in this area</p>
                      <div className="grid grid-cols-3 gap-2">
                        {cluster.items.slice(0, 3).map((l: any) => (
                          <div key={l.id} className="aspect-video rounded-md overflow-hidden bg-[#F8F9FA]">
                            {l.images?.[0] ? (
                              <img src={l.images[0]} alt={l.product_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-[#BA181B]" /></div>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-[#E5383B] to-[#BA181B] hover:from-[#BA181B] hover:to-[#660708] text-white font-medium rounded-xl py-2 shadow-md transition-all duration-300"
                        onClick={() => {
                          // console.log('View items clicked for cluster:', cluster.key, 'Items:', cluster.items.length);
                          // Store the cluster items and exit cluster mode to show them
                          setSelectedClusterItems(cluster.items);
                          setClusterMode('none');
                          setNearbyEnabled(false); // Disable nearby when viewing cluster items
                          // Clear other filters to show all items from this cluster
                          setSearchQuery('');
                          setPinCodeFilter('');
                          setCategoryFilter('');
                          // Scroll to listings section
                          setTimeout(() => {
                            const listingsSection = document.getElementById('listings-section');
                            if (listingsSection) {
                              listingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 100);
                        }}
                      >
                        View {cluster.count} items
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-20 animate-fade-in">
              <p className="text-xl text-[#660708]/70">
                No listings found. Be the first to list an item!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredListings.map((listing, index) => (
                <Card
                  key={listing.id}
                  onClick={() => handleViewListing(listing)}
                  className="group bg-white border border-[#E5E5E5] hover:border-[#E5383B]/50 hover:shadow-[0_8px_30px_rgba(229,56,59,0.15)] transition-all duration-500 rounded-2xl overflow-hidden hover:-translate-y-2 cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Image Section */}
                  <div className="relative h-56 overflow-hidden">
                    {listing.images?.length > 0 ? (
                      <Carousel className="w-full h-full">
                        <CarouselContent>
                          {listing.images.map((image, i) => (
                            <CarouselItem key={i}>
                              <img
                                src={image}
                                alt={`${listing.product_name} - ${i + 1}`}
                                className="w-full h-56 object-cover transform group-hover:scale-105 transition-transform duration-700"
                              />
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition" />
                        <CarouselNext className="right-2 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition" />
                      </Carousel>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#F8F9FA]">
                        <Package className="w-16 h-16 text-[#BA181B]" />
                      </div>
                    )}

                    {/* Sale / Rent Tag */}
                    {listing.product_type && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-[#BA181B] to-[#E5383B] text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        {listing.product_type === "both"
                          ? "Rent & Sale"
                          : listing.product_type === "sale"
                            ? "For Sale"
                            : "For Rent"}
                      </div>
                    )}

                    {/* Price Tag */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md border border-[#E5383B]/20 text-[#E5383B] px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
                      ₹{listing.rent_price || 0}{listing.product_type === 'sale' ? '' : '/day'}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-[#161A1D] group-hover:text-[#E5383B] transition-colors duration-300 line-clamp-1">
                      {listing.product_name}
                    </h3>
                    <p className="text-sm text-[#660708]/70 leading-relaxed line-clamp-2">
                      {listing.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-[#A4161A]/70 mt-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-[#BA181B]" />
                        <span>
                          {listing.pin_code || listing.city || '—'}
                          {nearbyEnabled && distanceById[listing.id] != null && (
                            <span className="ml-2 text-xs text-[#660708]">
                              {(distanceById[listing.id] / 1000).toFixed(1)} km
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4 text-[#BA181B]" />
                          <span>{listing.views || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#E5383B]">
                          <Star className="w-4 h-4 fill-current" />
                          <span>{listing.rating?.toFixed(1) || "5.0"}</span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-[#E5383B] to-[#BA181B] hover:from-[#BA181B] hover:to-[#660708] text-white font-medium rounded-xl py-2 shadow-md transition-all duration-300">
                      Contact Owner
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={!!selectedListing}
        onOpenChange={() => setSelectedListing(null)}
      >
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto rounded-3xl border border-[#B1A7A6]/30 bg-gradient-to-br from-[#F5F3F4]/90 to-white/80 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.15)] transition-all duration-300">
          {selectedListing && (
            <>
              {/* Header */}
              <DialogHeader className="pb-4 border-b border-[#B1A7A6]/30">
                <DialogTitle className="text-3xl font-serif text-[#161A1D] tracking-wide">
                  {selectedListing.product_name}
                </DialogTitle>
                <div className="flex items-center gap-2 text-sm text-[#660708]/70 mt-1">
                  <User size={16} />
                  <span>{selectedListing.owner_name || "Unknown"}</span>
                </div>
              </DialogHeader>

              {/* Main Content */}
              <div className="grid md:grid-cols-2 gap-8 pt-6">
                {/* Left - Image Carousel */}
                <div className="space-y-4">
                  {selectedListing.images?.length > 0 ? (
                    <Carousel className="rounded-2xl overflow-hidden shadow-md">
                      <CarouselContent>
                        {selectedListing.images.map(
                          (image: string, index: number) => (
                            <CarouselItem key={index}>
                              <img
                                src={image}
                                alt={`${selectedListing.product_name}-${index + 1
                                  }`}
                                className="w-full h-[400px] object-cover transition-transform duration-500 hover:scale-105"
                              />
                            </CarouselItem>
                          )
                        )}
                      </CarouselContent>
                      <CarouselPrevious className="bg-white/80 hover:bg-white text-[#161A1D]" />
                      <CarouselNext className="bg-white/80 hover:bg-white text-[#161A1D]" />
                    </Carousel>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] bg-[#F5F3F4] rounded-2xl text-[#B1A7A6] text-sm">
                      No images available
                    </div>
                  )}
                </div>

                {/* Right - Details */}
                <div className="flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#161A1D]">
                        Description
                      </h3>
                      <p className="text-[#660708]/80 leading-relaxed">
                        {selectedListing.description ||
                          "No description provided."}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-[#161A1D]">
                        Pricing
                      </h3>
                      <p className="text-4xl font-bold text-[#E5383B]">
                        ₹{selectedListing.rent_price || 0}{selectedListing.product_type === 'sale' ? '' : '/day'}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-[#161A1D]">
                        Location
                      </h3>
                      <div className="flex items-center gap-2 text-[#660708]/80">
                        <MapPin size={16} />
                        <span>{selectedListing.address || "Not provided"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Chat Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-[#F5F3F4] to-[#D3D3D3]/40 border border-[#B1A7A6]/20 shadow-inner space-y-3">
                    <h3 className="font-semibold text-lg text-[#161A1D]">
                      Contact Owner
                    </h3>
                    <p className="text-sm text-[#660708]/70">
                      Start a conversation with the owner to discuss this listing
                    </p>
                    <Button
                      onClick={handleStartChat}
                      className="w-full bg-gradient-to-r from-[#E5383B] via-[#BA181B] to-[#660708] hover:opacity-90 text-white rounded-xl py-2 font-medium shadow-md transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={18} />
                      {existingConversation ? "Open Chat" : "Start Chat"}
                    </Button>
                    {existingConversation && (
                      <p className="text-xs text-[#660708]/60 text-center">
                        You have an existing conversation
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-[#B1A7A6]/30"></div>

              {/* Rating Section */}
              <div className="pb-2">
                <RatingCard
                  listingId={selectedListing.id}
                  currentUserId={user?.id}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-4xl p-0 border-0 bg-transparent" aria-describedby="chat-description">
          <DialogHeader className="sr-only">
            <DialogTitle>Chat with {otherUserProfile?.name || (selectedListing?.owner_user_id === user?.id ? "Leaser" : "Owner")}</DialogTitle>
            <DialogDescription id="chat-description">
              Start a conversation about {selectedListing?.product_name || 'this listing'}
            </DialogDescription>
          </DialogHeader>
          {currentConversationId && selectedListing && otherUserProfile && (
            <ChatWindow
              conversationId={currentConversationId}
              listingName={selectedListing.product_name}
              otherUserName={otherUserProfile.name || (selectedListing.owner_user_id === user?.id ? "Leaser" : "Owner")}
              otherUserAvatar={otherUserProfile.avatar_url}
              onClose={() => {
                setChatOpen(false);
                setCurrentConversationId(null);
                setOtherUserProfile(null);
              }}
              isOwner={selectedListing.owner_user_id === user?.id}
              contactRequestStatus={existingConversation?.contact_request_status}
              ownerPhone={selectedListing.phone}
            />
          )}
        </DialogContent>
      </Dialog>
      <style>{`
      @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -30px) scale(1.05); }
            66% { transform: translate(-20px, 20px) scale(0.95); }
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
      @keyframes shimmer {
        100% {
          transform: translateX(100%);
        }
      }
      .animate-shimmer {
        position: relative;
        overflow: hidden;
      }
      .animate-shimmer::after {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          rgba(
          255,
          255,
          255,
          0
        ) 0%,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.4) 50%,
          rgba(255, 255, 255, 0) 100%
        );
        animation: shimmer 1.5s infinite;
      }
      `}</style>
    </div>
  );
};

export default Listings;
