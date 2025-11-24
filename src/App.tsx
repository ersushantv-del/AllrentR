import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationBanner } from "./components/NotificationBanner";
import AboutPage from "./pages/AboutPage";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Listings from "./pages/Listings";
import SubmitListing from "./pages/SubmitListing";
import AIListing from "./pages/AIListing";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogManagement from "./pages/BlogManagement";
import AdEditor from "./pages/AdEditor";
import TermsManagement from "./pages/TermsManagement";
import TopProfilesManagement from "./pages/TopProfilesManagement";
import InfluencerPartnersManagement from "./pages/InfluencerPartnersManagement";
import Leaderboard from "./pages/Leaderboard";
import LeaderboardManagement from "./pages/LeaderboardManagement";
import NotificationManagement from "./pages/NotificationManagement";
import NotFound from "./pages/NotFound";
import CouponManagement from "./pages/CouponManagement";
import PackageManagement from "./pages/PackageManagement";
import ElevenLabsWidget from "./components/ElevenLabsWidget";
import OAuthCallback from "./components/OAuthCallback";
import Inbox from "./pages/Inbox";
import TermsAndConditionPage from "./pages/Terms&Condition";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <NotificationBanner />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/submit-listing" element={<SubmitListing />} />
            <Route path="/submit-listing-ai" element={<AIListing />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/blogs" element={<BlogManagement />} />
            <Route path="/admin/ad-editor" element={<AdEditor />} />
            <Route path="/admin/terms" element={<TermsManagement />} />
            <Route path="/admin/top-profiles" element={<TopProfilesManagement />} />
            <Route path="/admin/influencer-partners" element={<InfluencerPartnersManagement />} />
            <Route path="/admin/leaderboard" element={<LeaderboardManagement />} />
            <Route path="/admin/notifications" element={<NotificationManagement />} />
            <Route path="/admin/coupons" element={<CouponManagement />} />
            <Route path="/manage-packages" element={<PackageManagement />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/blog" element={<Blog />} />

            <Route path="/terms-and-conditions" element={<TermsAndConditionPage />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ElevenLabsWidget />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
