import { Facebook, Twitter, Linkedin, Link2, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ShareButtonsProps {
    url: string;
    title: string;
}

export const ShareButtons = ({ url, title }: ShareButtonsProps) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const [canShare, setCanShare] = useState(false);

    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            setCanShare(true);
        }
    }, []);

    const handleNativeShare = async () => {
        try {
            await navigator.share({
                title: title,
                text: `Check out this listing: ${title}`,
                url: url,
            });
        } catch (err) {
            console.error("Error sharing:", err);
        }
    };

    const shareLinks = [
        {
            name: "WhatsApp",
            icon: (
                <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
            ),
            href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
            color: "hover:bg-[#25D366]/10 hover:text-[#25D366]",
        },
        {
            name: "Twitter",
            icon: <Twitter className="w-4 h-4" />,
            href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
            color: "hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]",
        },
        {
            name: "Facebook",
            icon: <Facebook className="w-4 h-4" />,
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            color: "hover:bg-[#1877F2]/10 hover:text-[#1877F2]",
        },
        {
            name: "LinkedIn",
            icon: <Linkedin className="w-4 h-4" />,
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            color: "hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]",
        },
    ];

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(url);
            toast({
                title: "Link copied",
                description: "The link has been copied to your clipboard.",
            });
        } catch (err) {
            console.error("Failed to copy:", err);
            toast({
                title: "Failed to copy",
                description: "Could not copy link to clipboard.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-2">Share:</span>

            {canShare && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNativeShare}
                    className="rounded-full hover:bg-gray-100 text-muted-foreground"
                    title="Share via..."
                >
                    <Share2 className="w-4 h-4" />
                </Button>
            )}

            {shareLinks.map((link) => (
                <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-full transition-colors ${link.color} text-muted-foreground flex items-center justify-center`}
                    title={`Share on ${link.name}`}
                    onClick={(e) => {
                        // Prevent default if href is invalid or empty
                        if (!link.href) e.preventDefault();
                    }}
                >
                    {link.icon}
                </a>
            ))}
            <Button
                variant="ghost"
                size="icon"
                onClick={copyToClipboard}
                className="rounded-full hover:bg-gray-100 text-muted-foreground"
                title="Copy Link"
            >
                <Link2 className="w-4 h-4" />
            </Button>
        </div>
    );
};
