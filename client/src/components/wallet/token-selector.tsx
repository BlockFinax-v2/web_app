import { useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type AssetInfo = {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
};

interface TokenSelectorProps {
  assets: AssetInfo[];
  selectedSymbol: string;
  onSelect: (tokenSymbol: string) => void;
}

function getTokenColor(symbol: string) {
    switch (symbol.toUpperCase()) {
      case "ETH": return "bg-blue-500";
      case "USDC": return "bg-blue-600";
      case "USDT": return "bg-emerald-500";
      case "BTC": return "bg-orange-500";
      case "BNB": return "bg-yellow-500";
      case "MATIC": return "bg-purple-500";
      case "AVAX": return "bg-red-500";
      default: return "bg-zinc-700";
    }
}

export function TokenSelector({ assets, selectedSymbol, onSelect }: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const selectedAsset = assets.find((asset) => asset.symbol === selectedSymbol) || assets[0];

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    setOpen(false);
  };

  const filteredAssets = assets.filter(a => 
    a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between rounded-xl bg-background/50 h-10 px-3 flex items-center hover:bg-background/80 transition-colors"
        >
          {selectedAsset ? (
            <div className="flex items-center gap-2 overflow-hidden">
               <div className={cn("w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-[9px] shrink-0", getTokenColor(selectedAsset.symbol))}>
                  {selectedAsset.symbol.slice(0, 2)}
               </div>
               <span className="truncate font-semibold text-foreground">{selectedAsset.symbol}</span>
            </div>
          ) : (
            "Select token"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[400px] p-0 bg-zinc-950 border-zinc-800 text-zinc-50 rounded-2xl overflow-hidden gap-0 max-h-[85vh]">
        <DialogHeader className="p-4 border-b border-zinc-900 relative">
          <DialogTitle className="text-center text-lg font-semibold text-zinc-50">Select a token</DialogTitle>
          <button 
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search tokens..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
        </div>

        <div className="px-5 py-2">
           <span className="text-xs font-semibold text-zinc-400">Your Assets</span>
        </div>

        <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
          {filteredAssets.length === 0 ? (
             <div className="py-8 text-center text-zinc-500 text-sm">No tokens found.</div>
          ) : (
            filteredAssets.map((asset) => (
              <button
                key={asset.symbol}
                onClick={() => handleSelect(asset.symbol)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition-colors text-left group relative"
              >
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner", getTokenColor(asset.symbol))}>
                  <span className="text-sm font-bold text-white uppercase">{asset.symbol.slice(0,2)}</span>
                </div>
                
                <div className="flex-1 overflow-hidden flex flex-col justify-center">
                  <p className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    {asset.symbol}
                    {selectedSymbol === asset.symbol && <Check className="h-4 w-4 text-blue-500" />}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{asset.name}</p>
                </div>

                <div className="text-right flex flex-col justify-center">
                  <span className="font-semibold text-sm text-zinc-200">{asset.balance}</span>
                  {hasValue(asset.usdValue) && (
                    <span className="text-xs text-zinc-500">{asset.usdValue}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function hasValue(usdStr: string) {
    return usdStr && usdStr !== '$0.00' && usdStr !== '$--' && usdStr !== '0.00';
}
