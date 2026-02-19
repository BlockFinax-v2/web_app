import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, Clock } from "lucide-react";

export default function Marketplace() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-card to-card/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                B2B Trade Partner Marketplace
              </h1>
              <p className="text-sm text-muted-foreground">Discover reliable trading partners in high-value commodity trades</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <Card className="bg-card border-border">
          <CardContent className="pt-12 pb-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3">Coming Soon</h2>
            <p className="text-muted-foreground text-lg mb-6">
              The B2B Trade Partner Marketplace is currently under development. We're building a powerful platform to connect African SMEs with global trade partners.
            </p>
            <div className="flex flex-wrap gap-3 justify-center text-sm text-muted-foreground/70">
              <span className="bg-muted/50 rounded-full px-4 py-1.5">Business Discovery</span>
              <span className="bg-muted/50 rounded-full px-4 py-1.5">Product Listings</span>
              <span className="bg-muted/50 rounded-full px-4 py-1.5">RFQ System</span>
              <span className="bg-muted/50 rounded-full px-4 py-1.5">Trade Corridors</span>
              <span className="bg-muted/50 rounded-full px-4 py-1.5">Reputation System</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
