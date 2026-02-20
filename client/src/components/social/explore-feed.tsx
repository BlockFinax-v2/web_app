import { useState } from "react";
import { Heart, MessageSquare, Share2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mock Data
const POSTS = [
  {
    id: 1,
    author: {
      name: "Acme Logistics",
      avatar: "",
      handle: "@acme_logistics"
    },
    content: "We just completed a 50-container shipment of electronics from Shenzhen to Rotterdam! Secured with a Letter of Credit via BlockFinaX. Smooth, trustless, and fast. 🚢⚡️ #TradeFinance #Logistics",
    image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3",
    likes: 124,
    comments: 18,
    time: "2h ago"
  },
  {
    id: 2,
    author: {
      name: "Global Agritech",
      avatar: "",
      handle: "@global_agri"
    },
    content: "Looking for financing partners for our upcoming soybean export contract ($2.4M). We have a strong track record and verified collateral. Reach out if interested in high-yield short term trade finance! 🌾💸",
    likes: 89,
    comments: 24,
    time: "5h ago"
  }
];

export function ExploreFeed() {
  const [posts, setPosts] = useState(POSTS);

  return (
    <div className="h-full overflow-y-auto bg-muted/20 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Explore</h1>
          <Button variant="outline" size="sm" className="rounded-full">
            Create Post
          </Button>
        </div>

        {/* Upload/Create Post Input Area */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50 mb-8 flex gap-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Input 
              placeholder="Share an update, request financing, or post a deal..." 
              className="bg-muted/50 border-transparent rounded-full mb-3"
            />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground rounded-full h-8 px-3">
                📷 Photo
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground rounded-full h-8 px-3">
                🎥 Video
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground rounded-full h-8 px-3">
                📄 Document
              </Button>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {posts.map(post => (
            <div key={post.id} className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
              <div className="p-4">
                {/* Post Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback>{post.author.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm leading-none">{post.author.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{post.author.handle} • {post.time}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                {/* Post Content */}
                <p className="text-sm mb-4 leading-relaxed">{post.content}</p>
                
                {/* Optional Image */}
                {post.image && (
                  <div className="rounded-lg overflow-hidden mb-4 bg-muted">
                    <img src={post.image} alt="Post attachment" className="w-full h-auto object-cover max-h-[300px]" />
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center gap-6 border-t border-border pt-3">
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors">
                    <Heart className="h-5 w-5" />
                    <span className="text-xs font-medium">{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors">
                    <MessageSquare className="h-5 w-5" />
                    <span className="text-xs font-medium">{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-green-500 transition-colors ml-auto">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
