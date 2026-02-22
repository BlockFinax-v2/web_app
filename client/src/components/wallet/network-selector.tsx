import { useState } from "react";
import { Globe, MoreVertical, X, Check, Search, Plus, ChevronLeft } from "lucide-react";
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
  { id: 1135, name: 'Lisk', symbol: 'ETH', icon: 'bg-cyan-500' },
  { id: 8453, name: 'Base', symbol: 'ETH', icon: 'bg-blue-600', sub: 'base-mainnet.infura.io' },
  { id: 11155111, name: 'Sepolia', symbol: 'ETH', icon: 'bg-muted' },
  { id: 4202, name: 'Lisk Sepolia', symbol: 'ETH', icon: 'bg-muted' },
  { id: 84532, name: 'Base Sepolia', symbol: 'ETH', icon: 'bg-muted' },
];

const ADDITIONAL_NETWORKS = [
  { id: 9001, name: 'HyperEVM', symbol: 'EVM', icon: 'bg-emerald-400' },
  { id: 9002, name: 'MegaETH', symbol: 'METH', icon: 'bg-slate-300 text-black' },
  { id: 9003, name: 'Monad', symbol: 'MONAD', icon: 'bg-indigo-500' },
];

const EXTRA_NETWORKS = [
  { id: 42161, name: 'Arbitrum One', symbol: 'ETH', icon: 'bg-blue-400 text-white' },
  { id: 10, name: 'OP Mainnet', symbol: 'ETH', icon: 'bg-red-500 text-white' },
  { id: 137, name: 'Polygon Mainnet', symbol: 'MATIC', icon: 'bg-purple-500 text-white' },
  { id: 43114, name: 'Avalanche C-Chain', symbol: 'AVAX', icon: 'bg-red-600 text-white' },
  { id: 56, name: 'BNB Smart Chain', symbol: 'BNB', icon: 'bg-yellow-500 text-white' },
  { id: 59144, name: 'Linea', symbol: 'ETH', icon: 'bg-gray-800 text-white' },
];

const CUSTOM_NETWORKS: typeof POPULAR_NETWORKS = [];

interface Props { 
  selectedNetworkId?: number; 
  onNetworkChange?: (id: number) => void; 
}

export function NetworkSelector({ selectedNetworkId = 1, onNetworkChange }: Props) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("popular");
  const [isAddingNetwork, setIsAddingNetwork] = useState(false);
  const [showAllNetworks, setShowAllNetworks] = useState(false);

  const [addedNetworkIds, setAddedNetworkIds] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('blockfinax.wallet.addedNetworks') || '[]'); } catch { return []; }
  });

  const ALL_EXTRAS = [...ADDITIONAL_NETWORKS, ...EXTRA_NETWORKS];
  const activeExtras = ALL_EXTRAS.filter(n => addedNetworkIds.includes(n.id));
  const inactiveExtras = ALL_EXTRAS.filter(n => !addedNetworkIds.includes(n.id));

  // Determine active network
  const current = [...POPULAR_NETWORKS, ...ALL_EXTRAS, ...CUSTOM_NETWORKS].find(n => n.id === selectedNetworkId) || POPULAR_NETWORKS[0];

  const handleSelect = (id: number) => {
    if (ALL_EXTRAS.some(n => n.id === id)) {
      if (!addedNetworkIds.includes(id)) {
        const updated = [...addedNetworkIds, id];
        setAddedNetworkIds(updated);
        localStorage.setItem('blockfinax.wallet.addedNetworks', JSON.stringify(updated));
      }
    }
    onNetworkChange?.(id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        setIsAddingNetwork(false);
      }
    }}>
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
          {isAddingNetwork ? (
            <>
              <button 
                onClick={() => setIsAddingNetwork(false)}
                className="absolute left-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <DialogTitle className="text-center text-lg font-semibold text-foreground">Add network</DialogTitle>
            </>
          ) : (
            <DialogTitle className="text-center text-lg font-semibold text-foreground">Select a network</DialogTitle>
          )}
        </DialogHeader>

        {isAddingNetwork ? (
          <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Network name</label>
                <input 
                  type="text" 
                  placeholder="Enter network name" 
                  className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Default RPC URL</label>
                <input 
                  type="text" 
                  placeholder="Add a URL" 
                  className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Chain ID</label>
                <input 
                  type="text" 
                  placeholder="Enter Chain ID" 
                  className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Currency symbol</label>
                <input 
                  type="text" 
                  placeholder="Enter symbol" 
                  className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Block explorer URL</label>
                <input 
                  type="text" 
                  placeholder="Add a URL" 
                  className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border transition-colors"
                />
              </div>
            </div>
            
            <div className="pt-2">
              <button 
                className="w-full bg-muted/50 hover:bg-muted text-muted-foreground font-semibold py-3 rounded-xl transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
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

                    <button 
                      onClick={() => setShowAllNetworks(prev => !prev)}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer text-left group w-full"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-transparent border border-border flex items-center justify-center shrink-0">
                           <Globe className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-medium text-foreground">Explore more networks</p>
                        </div>
                      </div>
                      <ChevronLeft className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", showAllNetworks ? "-rotate-90" : "rotate-180")} />
                    </button>

                    {showAllNetworks && (
                      <div className="pl-4 pr-0 border-l border-border/50 ml-4 space-y-1 mb-2">
                        {inactiveExtras.map((network) => (
                           <button 
                             key={network.id}
                             onClick={() => handleSelect(network.id)}
                             className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors text-left group w-full relative"
                           >
                             <div className={cn("w-6 h-6 rounded flex items-center justify-center shrink-0 shadow-inner overflow-hidden", network.icon)}>
                               {network.name[0]}
                             </div>
                             <div className="flex-1 overflow-hidden">
                               <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                                 {network.name}
                               </p>
                             </div>
                             <div className="shrink-0 text-muted-foreground hover:text-foreground">
                               <Plus className="h-3 w-3" />
                             </div>
                           </button>
                        ))}
                      </div>
                    )}

                    {/* Rendering Added Extra Networks below popular gracefully */}
                    {activeExtras.map((network) => (
                      <button 
                        key={network.id}
                        onClick={() => handleSelect(network.id)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group relative"
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner overflow-hidden", network.icon)}>
                           {network.id === 9001 ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" fillOpacity="0.8"/><path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                           ) : network.id === 9002 ? (
                              <span className="text-xs font-bold uppercase tracking-tighter">M</span>
                           ) : (
                              <span className="text-xs font-bold uppercase tracking-tighter">{network.name.slice(0,2)}</span>
                           )}
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col justify-center">
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
                    
                    {inactiveExtras.filter(n => ADDITIONAL_NETWORKS.some(an => an.id === n.id)).length > 0 && (
                      <div className="pt-4 pb-2 px-2 flex items-center gap-2 text-muted-foreground">
                        <p className="text-sm font-semibold">Additional networks</p>
                        <div className="w-4 h-4 rounded-full border border-muted-foreground flex items-center justify-center cursor-help">
                          <span className="text-[10px]">i</span>
                        </div>
                      </div>
                    )}

                    {inactiveExtras.filter(n => ADDITIONAL_NETWORKS.some(an => an.id === n.id)).map((network) => (
                      <button 
                        key={network.id}
                        onClick={() => handleSelect(network.id)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group relative"
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner overflow-hidden", network.icon)}>
                           {network.id === 9001 ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" fillOpacity="0.8"/><path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                           ) : network.id === 9002 ? (
                              <span className="text-xs font-bold uppercase tracking-tighter">M</span>
                           ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-white/80"></div>
                           )}
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col justify-center">
                          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                            {network.name}
                            {selectedNetworkId === network.id && <Check className="h-3.5 w-3.5 text-blue-500" />}
                          </p>
                        </div>
                        <div className="shrink-0 text-muted-foreground hover:text-foreground p-1 transition-opacity">
                          <Plus className="h-4 w-4" />
                        </div>
                      </button>
                    ))}

                  </div>
                </TabsContent>

                <TabsContent value="custom" className="m-0 focus-visible:outline-none flex flex-col h-full">
                  <div className="flex flex-col gap-1 flex-1">
                     {CUSTOM_NETWORKS.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                          No custom networks added yet.
                        </div>
                     ) : (
                       CUSTOM_NETWORKS.map((network) => (
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
                       ))
                     )}
                  </div>
                  
                  <div className="pt-2 pb-1 sticky bottom-0 bg-card/95">
                    <button 
                      onClick={() => setIsAddingNetwork(true)}
                      className="w-full flex items-center justify-center gap-2 bg-muted/30 hover:bg-muted/50 text-foreground font-semibold py-3 rounded-xl transition-colors border border-border/50"
                    >
                      <Plus className="h-4 w-4" />
                      Add custom network
                    </button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
// Force HMR reload
