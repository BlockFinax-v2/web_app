import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { EnhancedWalletOverview } from '@/components/wallet/wallet-dashboard';
import { useWallet } from '@/hooks/use-wallet';
import { Download, Upload, Shield, Copy, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Wallet() {
  const [, setLocation] = useLocation();
  const { isUnlocked, settings, walletExists, isLoading, wallet } = useWallet();
  const selectedNetworkId = settings.selectedNetworkId;
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading) {
      if (!walletExists()) {
        setLocation('/create-wallet');
      } else if (!isUnlocked) {
        setLocation('/unlock-wallet');
      }
    }
  }, [isUnlocked, walletExists, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-lg font-semibold animate-pulse">Loading BlockFinaX...</div>
      </div>
    );
  }

  if (!walletExists() || !isUnlocked) {
    return null; // Will redirect
  }

  return (
    <div className="h-full flex flex-col items-center bg-muted/10 overflow-y-auto w-full">
      <div className="w-full max-w-md p-4 sm:p-6 space-y-6 pb-24">
      
      <EnhancedWalletOverview 
        address={wallet?.address || ""}
        networkId={selectedNetworkId}
        onTabChange={() => {}}
      />
      
      </div>
    </div>
  );
}
