import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, Send, X, Image as ImageIcon, Zap, DollarSign, Phone, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { uploadToObjectStorage } from "@/lib/storage";
import { useLocation } from "wouter";

interface Message {
  id: string;
  text: string;
  role: "user" | "assistant";
  timestamp: number;
  aiAnalysis?: {
    identifiedItems: string[];
    suggestedPrice: number;
    suggestedPriceMin: number;
    suggestedPriceMax: number;
    recommendedLoadSize: string;
    confidence: number;
  };
}

export function BookingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: "initial",
    text: "👋 Hi! I'm your UpTend AI assistant. I can help you:\n\n• Get instant quotes from photos\n• Learn about our services & pricing\n• Book a job\n• Answer any questions\n\nHow can I help you today?",
    role: "assistant",
    timestamp: Date.now(),
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() && uploadedPhotos.length === 0) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      text: textToSend || (uploadedPhotos.length > 0 ? "[Photo sent]" : ""),
      role: "user",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const photosToSend = [...uploadedPhotos];
    setUploadedPhotos([]);
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/chatbot/message", {
        message: textToSend,
        context: {
          history: messages.map((m) => ({
            role: m.role,
            content: m.text,
          })),
        },
        photoUrls: photosToSend.length > 0 ? photosToSend : undefined,
        serviceType: "junk_removal",
      });

      const data = await response.json();
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-reply`,
        text: data.reply,
        role: "assistant",
        timestamp: Date.now(),
        aiAnalysis: data.aiAnalysis,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, {
        id: `msg-${Date.now()}-error`,
        text: "Sorry, I encountered an error. Please try again or call us at (407) 338-3342.",
        role: "assistant",
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const result = await uploadToObjectStorage(file);
        return result.url;
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedPhotos((prev) => [...prev, ...urls]);

      toast({
        title: "Photos uploaded!",
        description: `${urls.length} photo(s) uploaded. Send a message to get your AI quote.`,
      });
    } catch (error: any) {
      console.error("Photo upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "quote":
        handleSend("I'd like to get a quote for junk removal. What do you need from me?");
        break;
      case "pricing":
        handleSend("Can you tell me about your pricing and services?");
        break;
      case "book":
        setLocation("/book");
        setIsOpen(false);
        break;
      case "call":
        window.location.href = "tel:4073383342";
        break;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50" data-testid="container-chat-widget">
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-[380px] max-w-[calc(100vw-2rem)] max-h-[600px] shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-primary text-primary-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold">UpTend AI Assistant</span>
                  <p className="text-xs text-primary-foreground/80">Powered by GPT-4</p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsOpen(false)}
                data-testid="button-chat-close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Actions (only show on first open) */}
          {messages.length === 1 && (
            <div className="p-3 border-b bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 text-xs flex flex-col items-center gap-1"
                  onClick={() => handleQuickAction("quote")}
                >
                  <Zap className="w-4 h-4" />
                  <span>Get Quote</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 text-xs flex flex-col items-center gap-1"
                  onClick={() => handleQuickAction("pricing")}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>See Pricing</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 text-xs flex flex-col items-center gap-1"
                  onClick={() => handleQuickAction("book")}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Book Now</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 text-xs flex flex-col items-center gap-1"
                  onClick={() => handleQuickAction("call")}
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Us</span>
                </Button>
              </div>
            </div>
          )}

          <div
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30"
            data-testid="container-chat-messages"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-card border text-card-foreground rounded-bl-none"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* AI Analysis Result */}
                  {msg.aiAnalysis && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="font-semibold text-sm text-green-900 dark:text-green-100 mb-2">
                        ✓ AI Quote Generated
                      </p>
                      <div className="space-y-1 text-xs">
                        <p><strong>Items:</strong> {msg.aiAnalysis.identifiedItems.slice(0, 3).join(", ")}{msg.aiAnalysis.identifiedItems.length > 3 ? "..." : ""}</p>
                        <p><strong>Load Size:</strong> {msg.aiAnalysis.recommendedLoadSize}</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          ${msg.aiAnalysis.suggestedPriceMin} - ${msg.aiAnalysis.suggestedPriceMax}
                        </p>
                        <p className="text-xs text-muted-foreground">Confidence: {(msg.aiAnalysis.confidence * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card border text-card-foreground rounded-lg rounded-bl-none px-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-card-foreground/50 animate-bounce" />
                    <div
                      className="w-2 h-2 rounded-full bg-card-foreground/50 animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-card-foreground/50 animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Photo Preview */}
          {uploadedPhotos.length > 0 && (
            <div className="px-4 py-2 border-t bg-muted/50">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {uploadedPhotos.length} photo(s) ready to send
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 text-xs"
                  onClick={() => setUploadedPhotos([])}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          <div className="border-t p-4 bg-background">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={isLoading || isUploadingPhoto}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploadingPhoto}
                title="Upload photos for AI quote"
              >
                {isUploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </Button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    handleSend();
                  }
                }}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                data-testid="input-chat-message"
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={isLoading || (!input.trim() && uploadedPhotos.length === 0)}
                data-testid="button-chat-send"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Powered by AI • Instant quotes from photos
            </p>
          </div>
        </Card>
      )}

      <Button
        size="lg"
        className="rounded-full h-14 w-14 shadow-lg hover:scale-110 transition-transform"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="button-chat-open"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </Button>
    </div>
  );
}
