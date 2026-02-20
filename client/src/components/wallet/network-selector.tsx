// Dummy — no real blockchain integration
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';

const NETWORKS = [
  { id: 1, name: 'Ethereum Mainnet', symbol: 'ETH' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
];

interface Props { 
  selectedNetworkId?: number; 
  onNetworkChange?: (id: number) => void; 
  className?: string; 
}
export function NetworkSelector({ selectedNetworkId = 1, onNetworkChange, className }: Props) {
  const current = NETWORKS.find(n => n.id === selectedNetworkId) || NETWORKS[0];
  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Badge variant="outline" className="cursor-pointer">{current.name}</Badge>
    </div>
  );
}
