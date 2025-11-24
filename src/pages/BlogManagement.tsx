import { Navbar } from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useAdminBlogs,
  useCreateBlog,
  useUpdateBlog,
  useDeleteBlog,
  uploadBlogImage,
  Blog,
} from "@/hooks/useBlogs";
import { useState } from "react";
import { Pencil, Trash2, Plus, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { blogSchema } from "@/lib/validation";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";

const BlogManagement = () => {
  const { data: blogs, isLoading } = useAdminBlogs();
  const createBlog = useCreateBlog();
  const updateBlog = useUpdateBlog();
  const deleteBlog = useDeleteBlog();

  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    category: "",
    published: false,
    image_url: "",
    reference_url: "",
    tags: [] as string[],
    // SEO fields
    seo_title: "",
    meta_description: "",
    meta_keywords: "",
    og_image: "",
    author_name: "",
    reading_time: null as number | null,
  });
  const [tagInput, setTagInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setUploading(true);

    try {
      const url = await uploadBlogImage(file);
      setFormData((prev) => ({ ...prev, image_url: url }));
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate form data
      blogSchema.parse(formData);

      if (editingBlog) {
        await updateBlog.mutateAsync({ id: editingBlog.id, ...formData });
      } else {
        await createBlog.mutateAsync(formData);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        error.errors.forEach((err: any) => {
          toast.error(`${err.path.join(".")}: ${err.message}`);
        });
      } else {
        toast.error("Failed to save blog post");
      }
    }
  };
  const handleAddTags = () => {
    const newTags = tagInput
      .split(/[\n,]+/) // Split by newlines or commas
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    // If no line breaks, also split by double or extra spaces (for pasted single-line text)
    const finalTags = newTags
      .flatMap((tag) => tag.split(/\s{2,}/))
      .map((t) => t.trim())
      .filter(Boolean);

    if (finalTags.length > 0) {
      setFormData((prev) => ({
        ...prev,
        tags: Array.from(new Set([...prev.tags, ...finalTags])), // Avoid duplicates
      }));
      setTagInput("");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      category: "",
      published: false,
      image_url: "",
      reference_url: "",
      tags: [],
      // SEO fields
      seo_title: "",
      meta_description: "",
      meta_keywords: "",
      og_image: "",
      author_name: "",
      reading_time: null,
    });
    setImageFile(null);
    setEditingBlog(null);
    setTagInput("");
  };

  const decodeHtml = (html: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      description: blog.description,
      content: decodeHtml(blog.content),
      category: blog.category,
      published: blog.published,
      image_url: blog.image_url || "",
      reference_url: blog.reference_url || "",
      tags: blog.tags || [],
      // SEO fields
      seo_title: blog.seo_title || "",
      meta_description: blog.meta_description || "",
      meta_keywords: blog.meta_keywords || "",
      og_image: blog.og_image || "",
      author_name: blog.author_name || "",
      reading_time: blog.reading_time || null,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog?")) {
      await deleteBlog.mutateAsync(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-serif font-bold text-foreground mb-2">
                Blog Management
              </h1>
              <p className="text-muted-foreground">
                Create and manage blog posts
              </p>
            </div>

            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Blog Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingBlog ? "Edit Blog Post" : "Create New Blog Post"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingBlog
                      ? "Update the blog post details and save your changes"
                      : "Fill in the details to create a new blog post"}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter Your Desired Title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Short Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={2}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Content</Label>
                    <div className="mt-2">
                      <RichTextEditor
                        value={formData.content}
                        onChange={(content) =>
                          setFormData((prev) => ({
                            ...prev,
                            content: content,
                          }))
                        }
                        placeholder="Start Writing"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="image">Featured Image</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={uploading}
                      />
                      {formData.image_url && (
                        <ImageIcon className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    {formData.image_url && (
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="mt-2 w-full h-40 object-cover rounded"
                      />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="reference_url">
                      Reference URL (Optional)
                    </Label>
                    <Input
                      id="reference_url"
                      type="url"
                      placeholder="https://example.com/article"
                      value={formData.reference_url}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          reference_url: e.target.value,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Add a link to additional information or source
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <textarea
                          id="tags"
                          placeholder="Paste tags here — one per line or separated by commas"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onBlur={handleAddTags}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleAddTags();
                            }
                          }}
                          className="flex-1 min-h-[100px] resize-y border rounded-md p-2"
                        />
                        <Button type="button" onClick={handleAddTags}>
                          Add
                        </Button>
                      </div>

                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.tags.map((tag, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                            >
                              <span>{tag}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    tags: prev.tags.filter(
                                      (_, i) => i !== index
                                    ),
                                  }))
                                }
                                className="hover:text-destructive"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste or type tags — each new line, comma, or multiple
                      spaces will create a new tag.
                    </p>
                  </div>

                  {/* SEO Section */}
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="seo_title">
                          SEO Title (Optional)
                          <span className="text-xs text-muted-foreground ml-2">
                            - Defaults to title if empty
                          </span>
                        </Label>
                        <Input
                          id="seo_title"
                          value={formData.seo_title}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              seo_title: e.target.value,
                            }))
                          }
                          placeholder="SEO optimized title (max 200 chars)"
                          maxLength={200}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended: 50-60 characters for best SEO results
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="meta_description">
                          Meta Description (Optional)
                          <span className="text-xs text-muted-foreground ml-2">
                            - Defaults to description if empty
                          </span>
                        </Label>
                        <Textarea
                          id="meta_description"
                          value={formData.meta_description}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              meta_description: e.target.value,
                            }))
                          }
                          rows={2}
                          placeholder="SEO meta description (max 500 chars)"
                          maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended: 150-160 characters. This appears in search results.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Current length: {formData.meta_description.length}/500
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="meta_keywords">
                          Meta Keywords (Optional)
                        </Label>
                        <Input
                          id="meta_keywords"
                          value={formData.meta_keywords}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              meta_keywords: e.target.value,
                            }))
                          }
                          placeholder="Comma-separated keywords (e.g., rental, marketplace, India)"
                          maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Separate keywords with commas. Also auto-generated from tags if empty.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="og_image">
                          Open Graph Image URL (Optional)
                          <span className="text-xs text-muted-foreground ml-2">
                            - Defaults to featured image if empty
                          </span>
                        </Label>
                        <Input
                          id="og_image"
                          type="url"
                          value={formData.og_image}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              og_image: e.target.value,
                            }))
                          }
                          placeholder="https://example.com/og-image.jpg"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended size: 1200x630px. Used for social media sharing.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="author_name">Author Name (Optional)</Label>
                        <Input
                          id="author_name"
                          value={formData.author_name}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              author_name: e.target.value,
                            }))
                          }
                          placeholder="Author name"
                          maxLength={100}
                        />
                      </div>

                      <div>
                        <Label htmlFor="reading_time">
                          Reading Time (minutes) (Optional)
                          <span className="text-xs text-muted-foreground ml-2">
                            - Auto-calculated if empty
                          </span>
                        </Label>
                        <Input
                          id="reading_time"
                          type="number"
                          min="1"
                          value={formData.reading_time || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              reading_time: e.target.value
                                ? parseInt(e.target.value)
                                : null,
                            }))
                          }
                          placeholder="Estimated reading time in minutes"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Leave empty to auto-calculate from content length.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="published"
                      checked={formData.published}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, published: checked }))
                      }
                    />
                    <Label htmlFor="published">Publish immediately</Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      uploading || createBlog.isPending || updateBlog.isPending
                    }
                  >
                    {editingBlog ? "Update" : "Create"} Blog Post
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <p>Loading blogs...</p>
          ) : (
            <div className="grid gap-4">
              {blogs?.map((blog) => (
                <Card key={blog.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{blog.title}</CardTitle>
                        <CardDescription>
                          {blog.category} •{" "}
                          {new Date(blog.created_at).toLocaleDateString()}
                          {blog.published ? (
                            <span className="ml-2 text-green-600">
                              Published
                            </span>
                          ) : (
                            <span className="ml-2 text-yellow-600">Draft</span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(blog)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(blog.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {blog.image_url && (
                      <img
                        src={blog.image_url}
                        alt={blog.title}
                        className="w-full h-48 object-cover rounded mb-4"
                      />
                    )}
                    <p className="text-muted-foreground">{blog.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BlogManagement;
