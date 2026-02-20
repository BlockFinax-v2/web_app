// Dummy stub — no real blockchain integration
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Props { isOpen: boolean; onClose: () => void; address?: string; networkId?: number; }
export function SendModal({ isOpen, onClose }: Props) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const { toast } = useToast();

  const handleSend = () => {
    toast({ title: 'Transaction Simulated', description: `Demo: ${amount} sent to ${to.slice(0, 8)}... (no real blockchain)` });
    setTo(''); setAmount(''); onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Send Assets</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Recipient Address</Label>
            <Input placeholder="0x..." value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Amount (USDC)</Label>
            <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleSend} disabled={!to || !amount}>Send (Demo)</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
