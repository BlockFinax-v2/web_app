import { useState } from 'react';
import { Globe, MoreVertical, X, Check, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Mock Networks for UI 
const POPULAR_NETWORKS = [
  { id: 1, name: 'Ethereum Mainnet', symbol: 'ETH', icon: 'bg-blue-500' },
  { id: 59144, name: 'Linea Mainnet', symbol: 'ETH', icon: 'bg-cyan-500' },
  { id: 56, name: 'BNB Chain', symbol: 'BNB', icon: 'bg-yellow-500' },
  { id: 8453, name: 'Base', symbol: 'ETH', icon: 'bg-blue-600', sub: 'base-mainnet.infura.io' },
  { id: 43114, name: 'C-Chain', symbol: 'AVAX', icon: 'bg-red-500' },
];

const CUSTOM_NETWORKS = [
  { id: 4202, name: 'Lisk Sepolia', symbol: 'ETH', icon: 'bg-muted' },
  { id: 84532, name: 'Base Sepolia', symbol: 'ETH', icon: 'bg-muted' },
  { id: 11155111, name: 'Sepolia', symbol: 'ETH', icon: 'bg-muted' },
];

interface Props { 
  selectedNetworkId?: number; 
  onNetworkChange?: (id: number) => void; 
}

export function NetworkSelector({ selectedNetworkId = 1, onNetworkChange }: Props) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("popular");

  // Determine active network
  const current = [...POPULAR_NETWORKS, ...CUSTOM_NETWORKS].find(n => n.id === selectedNetworkId) || POPULAR_NETWORKS[0];

  const handleSelect = (id: number) => {
    onNetworkChange?.(id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 hover:bg-muted/50 px-3 py-1.5 rounded-full transition-colors border border-border/50 bg-background shadow-sm group">
          <Globe className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="text-sm font-semibold text-foreground">{current.name}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground ml-1">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] p-0 bg-card/95 border-border/50 text-foreground rounded-2xl overflow-hidden gap-0">
        <DialogHeader className="p-4 border-b border-border/50 relative">
          <DialogTitle className="text-center text-lg font-semibold text-foreground">Select a network</DialogTitle>
          <button 
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="px-4 pt-2">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-background/50 border border-border/50 rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border transition-colors"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 border-b border-border/50">
            <TabsList className="bg-transparent h-auto p-0 w-full justify-start gap-6 rounded-none">
              <TabsTrigger 
                value="popular" 
                className={cn(
                  "px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground hover:text-foreground font-semibold transition-all shadow-none",
                )}
              >
                Popular
              </TabsTrigger>
              <TabsTrigger 
                value="custom" 
                className={cn(
                  "px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground hover:text-foreground font-semibold transition-all shadow-none",
                )}
              >
                Custom networks
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2">
            <TabsContent value="popular" className="m-0 focus-visible:outline-none">
              <div className="flex flex-col gap-1">
                <button 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-transparent border border-border flex items-center justify-center shrink-0">
                     <Globe className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-foreground">All popular networks</p>
                  </div>
                </button>

                {POPULAR_NETWORKS.map((network) => (
                  <button 
                    key={network.id}
                    onClick={() => handleSelect(network.id)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group relative"
                  >
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-inner", network.icon)}>
                      <span className="text-[10px] font-bold text-white uppercase">{network.symbol.slice(0,1)}</span>
                    </div>
                    <div className="flex-1 overflow-hidden flex flex-col justify-center">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        {network.name}
                        {selectedNetworkId === network.id && <Check className="h-3.5 w-3.5 text-blue-500" />}
                      </p>
                      {network.sub && <p className="text-xs text-muted-foreground truncate">{network.sub}</p>}
                    </div>
                    <div className="shrink-0 text-muted-foreground hover:text-foreground p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="m-0 focus-visible:outline-none">
              <div className="flex flex-col gap-1">
                 {CUSTOM_NETWORKS.map((network) => (
                    <button 
                      key={network.id}
                      onClick={() => handleSelect(network.id)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group relative"
                    >
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-border text-foreground font-bold", network.icon)}>
                         {network.name.slice(0,1).toUpperCase()}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                          {network.name}
                          {selectedNetworkId === network.id && <Check className="h-3.5 w-3.5 text-blue-500" />}
                        </p>
                      </div>
                      <div className="shrink-0 text-muted-foreground hover:text-foreground p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </div>
                    </button>
                 ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
