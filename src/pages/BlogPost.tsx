import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, ArrowLeft, ExternalLink, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { SEOHead } from "@/components/SEOHead";
import { Blog } from "@/hooks/useBlogs";
import { BlogComments } from "@/components/BlogComments";

// Helper function to calculate reading time
const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

// Helper function to decode HTML entities (fixes issue where tags show as text)
const decodeHtml = (html: string): string => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [suggestedBlogs, setSuggestedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('id', id)
          .eq('published', true)
          .single();

        if (error) throw error;
        setBlog(data);

        // Fetch suggested blogs (same category, excluding current)
        const { data: suggested } = await supabase
          .from('blogs')
          .select('*')
          .eq('published', true)
          .eq('category', data.category)
          .neq('id', id)
          .limit(3);

        setSuggestedBlogs(suggested || []);
      } catch (error) {
        console.error('Error fetching blog:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  // Calculate reading time
  const readingTime = useMemo(() => {
    if (!blog) return null;
    if (blog.reading_time) return blog.reading_time;
    return calculateReadingTime(blog.content);
  }, [blog]);

  // Get base URL for canonical and OG URLs
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://allrent-r.vercel.app';
  const blogUrl = blog ? `${baseUrl}/blog/${blog.id}` : '';

  // Prepare SEO data
  const seoTitle = blog?.seo_title || blog?.title || '';
  const seoDescription = blog?.meta_description || blog?.description || '';
  const seoImage = blog?.og_image || blog?.image_url || '';
  const seoKeywords = blog?.meta_keywords || (blog?.tags ? blog.tags.join(', ') : '');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5F3F4] to-white">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-20">
          <div className="max-w-4xl mx-auto animate-pulse">
            <div className="h-96 bg-[#D3D3D3] rounded-3xl mb-8" />
            <div className="h-8 bg-[#D3D3D3] rounded w-3/4 mb-4" />
            <div className="h-4 bg-[#D3D3D3] rounded w-1/2 mb-8" />
            <div className="space-y-3">
              <div className="h-4 bg-[#D3D3D3] rounded" />
              <div className="h-4 bg-[#D3D3D3] rounded" />
              <div className="h-4 bg-[#D3D3D3] rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5F3F4] to-white">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-20 text-center">
          <h1 className="text-3xl font-bold text-[#161A1D] mb-4">Blog not found</h1>
          <Button onClick={() => navigate('/blog')} className="bg-gradient-to-r from-[#E5383B] to-[#BA181B] hover:from-[#BA181B] hover:to-[#660708]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blogs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F3F4] to-white">
      {blog && (
        <SEOHead
          title={seoTitle}
          description={seoDescription}
          image={seoImage}
          url={blogUrl}
          type="article"
          siteName="AllRentr - P2P Rental Marketplace India"
          author={blog.author_name || undefined}
          publishedTime={blog.created_at}
          modifiedTime={blog.updated_at}
          section={blog.category}
          tags={blog.tags || []}
          keywords={seoKeywords}
          canonicalUrl={blogUrl}
        />
      )}
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E5383B]/5 via-transparent to-[#BA181B]/5" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Button
              onClick={() => navigate('/blog')}
              variant="ghost"
              className="mb-8 text-[#660708] hover:text-[#E5383B] hover:bg-[#E5383B]/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to all blogs
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Blog Content */}
      <div className="container mx-auto px-4 pb-20">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          {/* Featured Image */}
          {blog.image_url && (
            <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden mb-8 shadow-[0_8px_30px_rgba(229,56,59,0.15)]">
              <img
                src={blog.image_url}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B090A]/60 via-transparent to-transparent" />
            </div>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <Badge className="bg-gradient-to-r from-[#E5383B] to-[#BA181B] text-white border-0">
              {blog.category}
            </Badge>
            <div className="flex items-center gap-2 text-[#660708]/70">
              <Calendar className="w-4 h-4" />
              <time className="text-sm" dateTime={blog.created_at}>
                {new Date(blog.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </div>
            {readingTime && (
              <div className="flex items-center gap-2 text-[#660708]/70">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{readingTime} min read</span>
              </div>
            )}
            {blog.author_name && (
              <div className="text-sm text-[#660708]/70">
                By <span className="font-semibold">{blog.author_name}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-[#161A1D] mb-6 leading-tight">
            {blog.title}
          </h1>

          {/* Description */}
          <p className="text-xl text-[#660708]/80 leading-relaxed mb-8 font-medium">
            {blog.description}
          </p>

          {/* Divider */}
          <div className="w-20 h-1 bg-gradient-to-r from-[#E5383B] to-[#BA181B] rounded-full mb-8" />

          {/* Content */}
          <article className="prose prose-lg max-w-none">
            <div
              className="text-[#161A1D]/90 leading-relaxed"
              style={{ fontSize: '1.125rem', lineHeight: '1.75' }}
              dangerouslySetInnerHTML={{ __html: decodeHtml(blog.content) }}
            />
          </article>

          {/* Reference Link */}
          {blog.reference_url && (
            <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-[#E5383B]/5 to-[#BA181B]/5 border border-[#E5383B]/20">
              <p className="text-sm font-semibold text-[#161A1D] mb-3">
                📚 Additional Resources
              </p>
              <a
                href={blog.reference_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#E5383B] hover:text-[#BA181B] transition-colors font-medium group"
              >
                Read more at source
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          )}

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-[#161A1D] mb-3">Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {blog.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-[#F5F3F4] text-[#660708] border-[#E5383B]/20"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Blogs */}
          {suggestedBlogs.length > 0 && (
            <div className="mt-16 pt-8 border-t border-[#D3D3D3]">
              <h2 className="text-2xl font-bold text-[#161A1D] mb-6">
                More from {blog.category}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {suggestedBlogs.map((suggestedBlog) => (
                  <Card
                    key={suggestedBlog.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/blog/${suggestedBlog.id}`)}
                  >
                    {suggestedBlog.image_url && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={suggestedBlog.image_url}
                          alt={suggestedBlog.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <Badge className="mb-2 bg-gradient-to-r from-[#E5383B] to-[#BA181B] text-white border-0">
                        {suggestedBlog.category}
                      </Badge>
                      <h3 className="font-bold text-[#161A1D] line-clamp-2 mb-2">
                        {suggestedBlog.title}
                      </h3>
                      <p className="text-sm text-[#660708]/70 line-clamp-2">
                        {suggestedBlog.description}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <BlogComments blogId={blog.id} />

          {/* Back Button */}
          <div className="mt-12 pt-8 border-t border-[#D3D3D3]">
            <Button
              onClick={() => navigate('/blog')}
              className="bg-gradient-to-r from-[#E5383B] to-[#BA181B] hover:from-[#BA181B] hover:to-[#660708] text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to all blogs
            </Button>
          </div>
        </motion.article>
      </div>
    </div>
  );
};

export default BlogPost;
