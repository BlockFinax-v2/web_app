import { ReactNode, useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  BarChart3, 
  Briefcase, 
  FileText, 
  ShieldAlert, 
  Wallet, 
  Menu, 
  Bell, 
  Search,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Landmark
} from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/trade-finance", label: "Trade Finance", icon: Briefcase },
  { href: "/hedge", label: "FX Hedge", icon: ShieldAlert },
  { href: "/treasury", label: "Treasury", icon: Landmark },
];

export function MainLayout({ children }: MainLayoutProps) {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const { wallet, lockWallet } = useWallet();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive check
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 1024 && window.innerWidth >= 768) {
        setSidebarCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setSidebarCollapsed(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!isSidebarCollapsed && (
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground hidden md:block">
              BlockFinaX
            </span>
          </Link>
        )}
        {isSidebarCollapsed && (
           <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30 mx-auto">
             <ShieldCheck className="h-5 w-5 text-primary" />
           </div>
        )}
        
        {/* Only show collapse toggle on Desktop/Tablet, not Mobile Sheet */}
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 ml-auto text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary/15 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-colors", 
                  isActive ? "text-primary" : "group-hover:text-foreground"
                )} />
                
                {!isSidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                
                {/* Active Indicator Line */}
                {isActive && !isSidebarCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile / Settings Area */}
      <div className="p-4 border-t border-border mt-auto">
        <div className={cn(
          "flex items-center gap-3",
          isSidebarCollapsed ? "justify-center flex-col" : "justify-between"
        )}>
          {/* Theme Toggle */}
           <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
          {/* Logout */}
          <Button 
            variant="ghost" 
            size={isSidebarCollapsed ? "icon" : "sm"}
            className={cn("text-red-500 hover:text-red-400 hover:bg-red-500/10", !isSidebarCollapsed && "w-full justify-start gap-2")}
            onClick={() => {
              lockWallet();
              setLocation("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            {!isSidebarCollapsed && <span>Disconnect</span>}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-background text-foreground flex overflow-hidden">
      
      {/* Desktop / Tablet Persistent Sidebar */}
      {!isMobile && (
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out hidden md:block",
            isSidebarCollapsed ? "w-20" : "w-64"
          )}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Main Content Area */}
      <div 
        className={cn(
          "flex-1 flex flex-col h-full transition-all duration-300 ease-in-out",
          !isMobile && (isSidebarCollapsed ? "md:ml-20" : "md:ml-64")
        )}
      >
        {/* Top Header (Mobile Hamburger & Global Search) */}
        <header className="h-16 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 bg-background/80 backdrop-blur-md border-b border-border">
          
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Hamburger Menu */}
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden text-foreground">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 bg-card border-r border-border">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
            )}

            {/* Global Search (Hidden on very small screens) */}
            <div className="relative hidden sm:block max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search PGAs, invoices, contracts..." 
                className="w-full h-9 pl-9 pr-4 bg-muted/50 border border-transparent focus:border-primary/50 focus:bg-background rounded-full text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
             <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="text-muted-foreground hover:text-foreground scale-90 sm:scale-100"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
             <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
               <Bell className="h-5 w-5" />
               <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
             </Button>

            {/* Wallet Mini-Profile */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium leading-none">
                   {wallet?.name || "My Wallet"}
                </span>
                <span className="text-xs text-muted-foreground mt-1 font-mono">
                  {wallet?.address ? `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}` : "Not Connected"}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-blue-500 border-2 border-background shadow-sm"></div>
            </div>
          </div>
        </header>

        {/* Page Content Rendering */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background/50">
          {children}
        </main>

      </div>
    </div>
  );
}
