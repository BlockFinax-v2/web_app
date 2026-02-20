import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
  { id: 4202, name: 'Lisk Sepolia', symbol: 'ETH', icon: 'bg-zinc-800' },
  { id: 84532, name: 'Base Sepolia', symbol: 'ETH', icon: 'bg-zinc-800' },
  { id: 11155111, name: 'Sepolia', symbol: 'ETH', icon: 'bg-zinc-800' },
];

interface Props { 
  selectedNetworkId?: number; 
  onNetworkChange?: (id: number) => void; 
}

export function NetworkSelector({ selectedNetworkId = 84532, onNetworkChange }: Props) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("popular");

  // Determine active network
  const current = [...POPULAR_NETWORKS, ...CUSTOM_NETWORKS].find(n => n.id === selectedNetworkId) || CUSTOM_NETWORKS[1];

  const handleSelect = (id: number) => {
    onNetworkChange?.(id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 hover:bg-muted/50 px-3 py-1.5 rounded-full transition-colors border border-border/50 bg-background shadow-sm group">
          <Globe className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="text-sm font-semibold">{current.name}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground ml-1">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] p-0 bg-zinc-950 border-zinc-800 text-zinc-50 rounded-2xl overflow-hidden gap-0">
        <DialogHeader className="p-4 border-b border-zinc-900 relative">
          <DialogTitle className="text-center text-lg font-semibold text-zinc-50">Select a network</DialogTitle>
          <button 
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="px-4 pt-2">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 border-b border-zinc-900">
            <TabsList className="bg-transparent h-auto p-0 w-full justify-start gap-6 rounded-none">
              <TabsTrigger 
                value="popular" 
                className={cn(
                  "px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-zinc-50 text-zinc-400 hover:text-zinc-200 font-semibold transition-all shadow-none",
                )}
              >
                Popular
              </TabsTrigger>
              <TabsTrigger 
                value="custom" 
                className={cn(
                  "px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-zinc-50 text-zinc-400 hover:text-zinc-200 font-semibold transition-all shadow-none",
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
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-transparent border border-zinc-700 flex items-center justify-center shrink-0">
                     <Globe className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-zinc-200">All popular networks</p>
                  </div>
                </button>

                {POPULAR_NETWORKS.map((network) => (
                  <button 
                    key={network.id}
                    onClick={() => handleSelect(network.id)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition-colors text-left group relative"
                  >
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-inner", network.icon)}>
                      <span className="text-[10px] font-bold text-white uppercase">{network.symbol.slice(0,1)}</span>
                    </div>
                    <div className="flex-1 overflow-hidden flex flex-col justify-center">
                      <p className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        {network.name}
                        {selectedNetworkId === network.id && <Check className="h-3.5 w-3.5 text-blue-500" />}
                      </p>
                      {network.sub && <p className="text-xs text-zinc-500 truncate">{network.sub}</p>}
                    </div>
                    <div className="shrink-0 text-zinc-600 hover:text-zinc-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition-colors text-left group relative"
                    >
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-zinc-800 text-zinc-400 font-bold", network.icon)}>
                         {network.name.slice(0,1).toUpperCase()}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                          {network.name}
                          {selectedNetworkId === network.id && <Check className="h-3.5 w-3.5 text-blue-500" />}
                        </p>
                      </div>
                      <div className="shrink-0 text-zinc-600 hover:text-zinc-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
