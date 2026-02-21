import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, Share2, Wallet } from 'lucide-react';
import QRCode from 'qrcode';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export function ReceiveModal({ isOpen, onClose, address }: ReceiveModalProps) {
  const { toast } = useToast();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && address) {
      QRCode.toDataURL(address, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a',    // slate-900
          light: '#ffffff'
        }
      })
      .then(setQrCodeDataUrl)
      .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [isOpen, address]);

  const copyAddress = async () => {
    try {
      if (!address) return;
      await navigator.clipboard.writeText(address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard"
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy address"
      });
    }
  };

  const shareAddress = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Wallet Address',
        text: `Here is my wallet address: ${address}`,
      }).catch(console.error);
    } else {
      copyAddress();
    }
  };

  if (!address) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm bg-card/95 border-border/50">
        <DialogHeader className="text-center sm:text-center flex flex-col items-center pt-2">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2 shadow-inner">
            <Wallet className="w-6 h-6 text-blue-500" />
          </div>
          <DialogTitle className="text-2xl font-bold">Receive Funds</DialogTitle>
          <DialogDescription className="text-sm mt-1">
            Scan the QR code or copy the address below to receive tokens on the supported network.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          {/* QR Code Container */}
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-border/50 transition-all hover:scale-105 duration-300">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="Wallet Address QR Code" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 animate-pulse bg-slate-100 rounded-xl" />
            )}
          </div>

          <div className="w-full space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
              Your Wallet Address
            </div>
            <div 
              className="relative group cursor-pointer" 
              onClick={copyAddress}
            >
              <div className="w-full p-4 pr-12 bg-muted/50 hover:bg-muted/80 border border-primary/10 rounded-xl font-mono text-sm break-all transition-colors">
                {address}
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors">
                <Copy className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full pt-2">
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-semibold"
              onClick={copyAddress}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Address
            </Button>
            <Button 
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all font-semibold"
              onClick={shareAddress}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
