import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send, Bot, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ImageUpload';
import Groq from "groq-sdk";
import { motion } from 'framer-motion';
import ngeohash from 'ngeohash';

// Initialize Groq API
// NOTE: In a real app, you should proxy this through a backend to hide the key
const API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

const extractJSON = (str: string) => {
  if (!str) return null;
  let firstOpen = str.indexOf('{');
  let firstArray = str.indexOf('[');

  if (firstOpen === -1 && firstArray === -1) return null;

  let start = -1;
  if (firstOpen !== -1 && (firstArray === -1 || firstOpen < firstArray)) {
    start = firstOpen;
  } else {
    start = firstArray;
  }

  let bracketCount = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < str.length; i++) {
    const char = str[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{' || char === '[') {
        bracketCount++;
      } else if (char === '}' || char === ']') {
        bracketCount--;
        if (bracketCount === 0) {
          const jsonStr = str.substring(start, i + 1);
          try {
            return JSON.parse(jsonStr);
          } catch (e) {
            console.error("Failed to parse extracted JSON:", e);
            return null;
          }
        }
      }
    }
  }
  return null;
};

const AIListing = () => {
  const navigate = useNavigate();
  const { user, authReady } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [initialDescription, setInitialDescription] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [extractedData, setExtractedData] = useState<any>({});
  const [isComplete, setIsComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authReady && !user) navigate('/login');
  }, [authReady, user, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const groq = new Groq({ apiKey: API_KEY, dangerouslyAllowBrowser: true });

  const fetchImageAsBase64 = async (url: string): Promise<{ base64Data: string, mimeType: string }> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Extract mime type and base64 data
        // Format: data:image/jpeg;base64,/9j/4AAQSkZJRg...
        const matches = base64String.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          resolve({
            mimeType: matches[1],
            base64Data: matches[2]
          });
        } else {
          reject(new Error("Invalid base64 string"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleInitialSubmit = async () => {
    if (images.length === 0) {
      toast({ title: "Please upload at least one image", variant: "destructive" });
      return;
    }
    if (!initialDescription) {
      toast({ title: "Please provide a description", variant: "destructive" });
      return;
    }
    if (!API_KEY) {
      toast({ title: "Groq API Key missing", description: "Please check your .env file and restart the server.", variant: "destructive" });
      return;
    }

    setAnalyzing(true);

    try {
      const { base64Data, mimeType } = await fetchImageAsBase64(images[0]);

      // Common prompt structure
      const systemPrompt = `
        You are an AI assistant helping a user list an item for rent or sale on a marketplace.
        Your goal is to extract the following information to populate a listing form:
        - product_name (string)
        - description (string, enhanced version of user input)
        - category (one of: electronics, vehicles, furniture, tools, sports, books, clothing, other)
        - product_type (one of: rent, sale, both)
        - rent_price (number, the price amount. If rent, per day. If sale, total price)
        - pin_code (string, 6 digits)
        - address (string)
        - phone (string)

        If any critical information is missing (especially price, location/pin_code, phone, product type), ask the user for it in a conversational way.
        
        Return your response in this JSON format (do not use markdown code blocks, just raw JSON):
        {
          "extracted_data": {
            "product_name": "...",
            "description": "...",
            "category": "one of: electronics, vehicles, furniture, tools, sports, books, clothing, other",
            "product_type": "one of: rent, sale, both",
            "rent_price": 0,
            "pin_code": "...",
            "address": "...",
            "phone": "..."
          },
          "next_question": "Your question here if info is missing, else null",
          "is_complete": boolean (true if all necessary info is gathered)
        }
        IMPORTANT: 'rent_price' must be a number (e.g. 500). Do not include currency symbols or text. If the user says "500 per day", rent_price is 500.
      `;

      let text = "";

      try {
        console.log("Attempting vision analysis with llama-3.2-90b-vision-preview...");
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: systemPrompt + `\nUser Description: "${initialDescription}"` },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
              ]
            }
          ],
          model: "llama-3.2-90b-vision-preview",
          temperature: 0.5,
          max_tokens: 1024,
        });
        text = completion.choices[0]?.message?.content || "";
      } catch (visionError: any) {
        console.error("Vision model failed:", visionError);
        console.log("Falling back to text-only analysis with llama-3.3-70b-versatile...");

        toast({
          title: "Image Analysis Failed",
          description: "Could not analyze image. Proceeding with text description only.",
          variant: "default"
        });

        // Fallback to text-only model
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: `User Description: "${initialDescription}"`
            }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.5,
          max_tokens: 1024,
          response_format: { type: "json_object" }
        });
        text = completion.choices[0]?.message?.content || "";
      }

      console.log("AI Response:", text);

      // Parse JSON
      const data = extractJSON(text);
      if (data) {
        setExtractedData(data.extracted_data);
        setMessages([
          { role: 'user', text: initialDescription },
          { role: 'model', text: data.next_question || "Great! I have all the information. Please review the details below." }
        ]);
        setIsComplete(data.is_complete);
      } else {
        console.error("Failed to parse JSON from:", text);
        throw new Error("AI response was not in the expected format.");
      }

    } catch (error: any) {
      console.error("AI Error:", error);
      toast({
        title: "AI Analysis Failed",
        description: error.message || "Could not analyze the listing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentInput.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, text: currentInput }];
    setMessages(newMessages);
    setCurrentInput('');
    setAnalyzing(true);

    try {
      // Construct history for context
      const prompt = `
        You are an AI assistant helping a user list an item.
        
        Current Extracted Data: ${JSON.stringify(extractedData)}
        
        The user just said: "${currentInput}"
        
        Update the extracted data based on the new input.
        If information is still missing (price, pin_code, phone, address, product_type), ask for it.
        IMPORTANT: 'rent_price' should be the price amount. If rent, per day. If sale, total price.
        
        Return JSON:
        {
          "extracted_data": { ...updated fields... },
          "next_question": "...",
          "is_complete": boolean
        }
        IMPORTANT: 'rent_price' must be a number. Do not include currency symbols.
      `;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 1024,
        response_format: { type: "json_object" }
      });

      const text = completion.choices[0]?.message?.content || "";

      const data = extractJSON(text);
      if (data) {
        setExtractedData((prev: any) => ({ ...prev, ...data.extracted_data }));
        setMessages([
          ...newMessages,
          { role: 'model', text: data.next_question || "Great! I have all the information. Ready to list?" }
        ]);
        setIsComplete(data.is_complete);
      }
    } catch (error: any) {
      console.error("Chat Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process your response.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      // Geocode logic similar to SubmitListing
      const geocodeWithNominatim = async (query: string) => {
        try {
          const url = new URL('https://nominatim.openstreetmap.org/search');
          url.searchParams.set('q', query);
          url.searchParams.set('format', 'json');
          url.searchParams.set('limit', '1');
          const res = await fetch(url.toString());
          const data = await res.json();
          if (data && data.length > 0) {
            return { lat: Number(data[0].lat), lon: Number(data[0].lon), ...data[0].address };
          }
          return null;
        } catch { return null; }
      };

      let geo = await geocodeWithNominatim(`${extractedData.address}, ${extractedData.pin_code}`);
      if (!geo && extractedData.pin_code) {
        geo = await geocodeWithNominatim(`${extractedData.pin_code}, India`);
      }

      const listingData = {
        owner_user_id: user.id,
        product_name: extractedData.product_name,
        description: extractedData.description,
        images: images,
        rent_price: Number(String(extractedData.rent_price).replace(/[^0-9.]/g, '')) || 0,
        pin_code: extractedData.pin_code,
        product_type: ['rent', 'sale', 'both'].includes(extractedData.product_type?.toLowerCase())
          ? extractedData.product_type.toLowerCase()
          : 'rent',
        category: ['electronics', 'vehicles', 'furniture', 'tools', 'sports', 'books', 'clothing', 'other'].includes(extractedData.category?.toLowerCase())
          ? extractedData.category.toLowerCase()
          : 'other',
        phone: extractedData.phone,
        address: extractedData.address,
        payment_transaction: 'AI_LISTING',
        listing_type: 'free', // Default to free for AI flow for now
        original_price: 0,
        discount_amount: 0,
        final_price: 0,
        latitude: geo?.lat || 0,
        longitude: geo?.lon || 0,
        city: geo?.city || extractedData.address, // Fallback
        state: geo?.state || '',
        geohash: geo ? ngeohash.encode(geo.lat, geo.lon, 9) : ''
      };

      const { error } = await supabase.from('listings').insert([listingData]);
      if (error) throw error;

      toast({ title: "Listing Created Successfully!", description: "Your AI-assisted listing is live." });
      navigate('/profile');

    } catch (error) {
      console.error("Submission Error:", error);
      toast({ title: "Submission Failed", description: "Could not create listing.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
              AI Smart Listing
            </h1>
            <p className="text-muted-foreground">
              Upload a photo and let our AI handle the details.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Upload & Chat */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="font-semibold mb-4">1. Upload Product Image</h2>
                <ImageUpload
                  userId={user?.id || ''}
                  currentImages={images}
                  onImagesUploaded={setImages}
                  maxImages={5}
                />
              </Card>

              {images.length > 0 && messages.length === 0 && (
                <Card className="p-6">
                  <h2 className="font-semibold mb-4">2. Tell us a bit about it</h2>
                  <Textarea
                    placeholder="e.g. I want to rent out my DSLR camera. It's a Canon EOS 1500D, barely used."
                    value={initialDescription}
                    onChange={(e) => setInitialDescription(e.target.value)}
                    className="mb-4"
                  />
                  <Button
                    onClick={handleInitialSubmit}
                    disabled={analyzing || !initialDescription}
                    className="w-full"
                  >
                    {analyzing ? <Loader2 className="animate-spin mr-2" /> : <Bot className="mr-2" />}
                    Analyze with AI
                  </Button>
                </Card>
              )}

              {messages.length > 0 && (
                <Card className="p-6 h-[500px] flex flex-col">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" /> AI Assistant
                  </h2>
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2" ref={scrollRef}>
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-none'
                          : 'bg-secondary text-secondary-foreground rounded-tl-none'
                          }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {analyzing && (
                      <div className="flex justify-start">
                        <div className="bg-secondary p-3 rounded-lg rounded-tl-none">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleChatSubmit} className="flex gap-2">
                    <Input
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder="Type your answer..."
                      disabled={analyzing || isComplete}
                    />
                    <Button type="submit" disabled={analyzing || isComplete || !currentInput.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </Card>
              )}
            </div>

            {/* Right Column: Live Preview */}
            <div className="space-y-6">
              <Card className="p-6 bg-secondary/10 border-primary/20">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" /> Live Listing Preview
                </h2>
                <div className="space-y-4">
                  <div className="aspect-video bg-secondary rounded-lg overflow-hidden">
                    {images[0] ? (
                      <img src={images[0]} alt="Product" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground">Product Name</Label>
                    <div className="font-medium text-lg">{extractedData.product_name || '---'}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs uppercase text-muted-foreground">Price (₹)</Label>
                      <Input
                        type="number"
                        value={extractedData.rent_price || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, rent_price: e.target.value })}
                        className="h-8 mt-1"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs uppercase text-muted-foreground">Type</Label>
                      <div className="font-medium capitalize">{extractedData.product_type || '---'}</div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Description</Label>
                    <div className="text-sm text-muted-foreground line-clamp-4">
                      {extractedData.description || '---'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs uppercase text-muted-foreground">Location</Label>
                      <div className="text-sm">{extractedData.address || '---'}</div>
                    </div>
                    <div>
                      <Label className="text-xs uppercase text-muted-foreground">Phone</Label>
                      <div className="text-sm">{extractedData.phone || '---'}</div>
                    </div>
                  </div>

                  {isComplete && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="pt-4"
                    >
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
                        onClick={handleFinalSubmit}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : "Confirm & Publish Listing"}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIListing;
