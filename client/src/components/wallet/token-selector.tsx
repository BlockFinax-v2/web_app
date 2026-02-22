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

export function getTokenColor(symbol: string) {
    switch (symbol.toUpperCase()) {
      case "ETH": return "bg-blue-500";
      case "USDC": return "bg-blue-600";
      case "USDT": return "bg-emerald-500";
      case "DAI": return "bg-yellow-400 text-black";
      case "BTC": case "WBTC": return "bg-orange-500";
      case "BNB": return "bg-yellow-500";
      case "MATIC": return "bg-purple-500";
      case "AVAX": return "bg-red-500";
      case "LINK": return "bg-blue-700";
      case "UNI": return "bg-pink-500";
      case "WETH": return "bg-slate-800 text-white";
      case "ARB": return "bg-blue-400 text-white";
      case "OP": return "bg-red-600";
      case "SHIB": return "bg-orange-600";
      case "PEPE": return "bg-green-500";
      case "AAVE": return "bg-purple-600";
      case "CRV": return "bg-yellow-600";
      case "COMP": return "bg-green-600";
      case "MKR": return "bg-teal-600";
      case "FRAX": return "bg-neutral-800 text-white";
      case "LDO": return "bg-blue-300 text-black";
      case "SNX": return "bg-cyan-600";
      case "STETH": return "bg-blue-200 text-black";
      case "TON": return "bg-blue-500";
      case "DOT": return "bg-pink-600";
      case "TRX": return "bg-red-600";
      case "ADA": return "bg-blue-800 text-white";
      case "BCH": return "bg-green-500";
      case "XLM": return "bg-black text-white";
      case "NEAR": return "bg-black text-white";
      case "APT": return "bg-zinc-800 text-white";
      case "INJ": return "bg-cyan-400 text-black";
      case "FIL": return "bg-blue-400 text-white";
      case "ICP": return "bg-purple-500 text-white";
      case "RNDR": return "bg-red-800 text-white";
      case "TIA": return "bg-purple-400 text-white";
      default: return "bg-muted text-foreground border border-border";
    }
}

export function TokenIcon({ symbol, className = "w-10 h-10 text-sm" }: { symbol: string, className?: string }) {
  const [error, setError] = useState(false);
  const colorClass = getTokenColor(symbol);
  
  if (error) {
    return (
      <div className={cn("rounded-full flex items-center justify-center shrink-0 shadow-inner overflow-hidden", colorClass, className)}>
        <span className="font-bold text-white uppercase tracking-tighter" style={{ fontSize: '0.85em' }}>
          {symbol.slice(0, 2)}
        </span>
      </div>
    );
  }

  // CoinCap has an extremely reliable free tier assets endpoint for exact symbol matching
  const iconUrl = `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`;

  return (
    <div className={cn("rounded-full flex items-center justify-center shrink-0 shadow-inner overflow-hidden bg-background border border-border/50", className)}>
      <img 
        src={iconUrl} 
        alt={symbol} 
        className="w-[75%] h-[75%] object-contain"
        onError={() => setError(true)}
      />
    </div>
  );
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
                <TokenIcon symbol={selectedAsset.symbol} className="w-5 h-5 text-[9px]" />
                <span className="truncate font-semibold text-foreground">{selectedAsset.symbol}</span>
             </div>
          ) : (
            "Select token"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[400px] p-0 bg-card/95 border-border/50 text-foreground rounded-2xl overflow-hidden gap-0 max-h-[85vh]">
        <DialogHeader className="p-4 border-b border-border/50 relative">
          <DialogTitle className="text-center text-lg font-semibold text-foreground">Select a token</DialogTitle>
        </DialogHeader>

        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search tokens..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background/50 border border-border/50 rounded-lg pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border transition-colors"
            />
          </div>
        </div>

        <div className="px-5 py-2">
           <span className="text-xs font-semibold text-muted-foreground">Your Assets</span>
        </div>

        <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
          {filteredAssets.length === 0 ? (
             <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
               <p className="text-muted-foreground text-sm font-medium">Couldn't find this token.</p>
               <button className="text-blue-500 font-semibold text-sm hover:text-blue-400 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-full mt-2">
                 Import token
               </button>
             </div>
          ) : (
            filteredAssets.map((asset) => (
              <button
                key={asset.symbol}
                onClick={() => handleSelect(asset.symbol)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group relative"
              >
                <TokenIcon symbol={asset.symbol} />
                
                <div className="flex-1 overflow-hidden flex flex-col justify-center">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {asset.symbol}
                    {selectedSymbol === asset.symbol && <Check className="h-4 w-4 text-blue-500" />}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{asset.name}</p>
                </div>

                <div className="text-right flex flex-col justify-center">
                  <span className="font-semibold text-sm text-foreground">{asset.balance}</span>
                  {hasValue(asset.usdValue) && (
                    <span className="text-xs text-muted-foreground">{asset.usdValue}</span>
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

export function hasValue(usdStr: string) {
    return usdStr && usdStr !== '$0.00' && usdStr !== '$--' && usdStr !== '0.00';
}
