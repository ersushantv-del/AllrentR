import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Video, Loader2, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ReviewMediaUploadProps {
    onMediaUploaded: (urls: string[]) => void;
    userId: string;
}

export const ReviewMediaUpload = ({ onMediaUploaded, userId }: ReviewMediaUploadProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const checkVideoDuration = (file: File): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!file.type.startsWith('video/')) return resolve(true);

            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                if (video.duration > 20) {
                    toast({
                        title: "Video too long",
                        description: "Video must be 20 seconds or less",
                        variant: "destructive",
                    });
                    resolve(false);
                } else {
                    resolve(true);
                }
            };
            video.src = URL.createObjectURL(file);
        });
    };

    const uploadFiles = async (files: File[]) => {
        if (files.length === 0) return;

        // Initial validation for the batch
        const hasVideo = files.some(f => f.type.startsWith('video/'));
        const hasImage = files.some(f => f.type.startsWith('image/'));

        if (hasVideo && hasImage) {
            toast({
                title: "Invalid selection",
                description: "Cannot upload both images and video at the same time",
                variant: "destructive",
            });
            return;
        }

        if (hasVideo) {
            if (mediaType === 'image' || mediaUrls.length > 0) {
                toast({
                    title: "Invalid selection",
                    description: "Cannot upload a video when images are selected",
                    variant: "destructive",
                });
                return;
            }
            if (files.length > 1) {
                toast({
                    title: "Limit reached",
                    description: "You can only upload 1 video",
                    variant: "destructive",
                });
                return;
            }
        }

        if (hasImage) {
            if (mediaType === 'video') {
                toast({
                    title: "Invalid selection",
                    description: "Cannot upload images when a video is selected",
                    variant: "destructive",
                });
                return;
            }
            if (mediaUrls.length + files.length > 5) {
                toast({
                    title: "Limit reached",
                    description: `You can only upload up to 5 images. You have ${mediaUrls.length} and selected ${files.length}.`,
                    variant: "destructive",
                });
                return;
            }
        }

        setIsUploading(true);
        const newUrls: string[] = [];
        let currentMediaType = mediaType;

        try {
            for (const file of files) {
                // Size validation
                if (file.type.startsWith('image/') && file.size > 5 * 1024 * 1024) {
                    toast({
                        title: "File too large",
                        description: `${file.name} exceeds 5MB limit`,
                        variant: "destructive",
                    });
                    continue;
                }
                if (file.type.startsWith('video/') && file.size > 50 * 1024 * 1024) {
                    toast({
                        title: "File too large",
                        description: `${file.name} exceeds 50MB limit`,
                        variant: "destructive",
                    });
                    continue;
                }

                // Duration validation for video
                if (file.type.startsWith('video/')) {
                    const isValidDuration = await checkVideoDuration(file);
                    if (!isValidDuration) continue;
                }

                if (!currentMediaType) {
                    currentMediaType = file.type.startsWith('video/') ? 'video' : 'image';
                    setMediaType(currentMediaType);
                }

                const fileExt = file.name.split('.').pop();
                const fileName = `reviews/${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('listing-images')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('listing-images')
                    .getPublicUrl(fileName);

                newUrls.push(publicUrl);
            }

            const updatedUrls = [...mediaUrls, ...newUrls];
            setMediaUrls(updatedUrls);
            onMediaUploaded(updatedUrls);

            if (newUrls.length > 0) {
                toast({
                    title: "Success",
                    description: "Media uploaded successfully",
                });
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast({
                title: "Upload failed",
                description: "Failed to upload media. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        uploadFiles(files);
    }, [mediaType, mediaUrls]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        uploadFiles(files);
        e.target.value = '';
    };

    const handleRemove = (index: number) => {
        const newUrls = mediaUrls.filter((_, i) => i !== index);
        setMediaUrls(newUrls);
        onMediaUploaded(newUrls);
        if (newUrls.length === 0) {
            setMediaType(null);
        }
    };

    return (
        <div className="space-y-4">
            {mediaUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {mediaUrls.map((url, index) => (
                        <div key={index} className="relative rounded-lg overflow-hidden border-2 border-border aspect-square bg-black/5">
                            {mediaType === 'video' ? (
                                <video
                                    src={url}
                                    className="w-full h-full object-cover"
                                    controls
                                />
                            ) : (
                                <img
                                    src={url}
                                    alt={`Review media ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {((mediaType === 'image' && mediaUrls.length < 5) || !mediaType) && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        "relative border-2 border-dashed rounded-lg p-6 transition-all duration-300",
                        isDragging ? "border-primary bg-primary/5 scale-105" : "border-border hover:border-primary/50",
                        isUploading && "opacity-50 pointer-events-none"
                    )}
                >
                    <input
                        type="file"
                        accept="image/*,video/*"
                        multiple={!mediaType || mediaType === 'image'}
                        onChange={handleFileInput}
                        disabled={isUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                        {isUploading ? (
                            <>
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                <p className="text-sm text-muted-foreground">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <Upload className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground mb-1">
                                        Upload Photos or Video
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Up to 5 photos OR 1 video (max 20s)
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <ImageIcon className="w-3 h-3" />
                                        <span>Photos</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Video className="w-3 h-3" />
                                        <span>Video</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
