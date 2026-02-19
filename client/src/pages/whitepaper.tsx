import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Whitepaper() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/website">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              Back to Website
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center min-h-[70vh]">
          <Card className="max-w-2xl w-full">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
              </div>
              
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Whitepaper Coming Soon
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                We're preparing comprehensive documentation about BlockFinaX's trade finance platform and blockchain innovation.
              </p>

              <div className="text-sm text-muted-foreground">
                Stay tuned for updates
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
