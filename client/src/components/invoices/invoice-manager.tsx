import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Send, 
  Calendar as CalendarIcon, 
  DollarSign, 
  FileText, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
export type Invoice = any;
export type InvoiceItem = any;

interface InvoiceManagerProps {
  walletAddress: string;
}

// Form schemas
const invoiceFormSchema = z.object({
  recipientAddress: z.string().min(1, "Recipient address is required"),
  recipientEmail: z.string().email().optional().or(z.literal("")),
  recipientName: z.string().optional(),
  title: z.string().min(1, "Invoice title is required"),
  description: z.string().optional(),
  dueDate: z.date(),
  currency: z.string().default("USDC"),
  taxRate: z.number().min(0).max(100).default(0),
  discountRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  paymentAddress: z.string().optional(),
});

const itemFormSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;
type ItemFormData = z.infer<typeof itemFormSchema>;

export function InvoiceManager({ walletAddress }: InvoiceManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("sent");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [items, setItems] = useState<Array<ItemFormData & { totalPrice: number }>>([]);

  // Fetch full invoice details with items
  const { data: selectedInvoiceDetails } = useQuery<Invoice & { items?: InvoiceItem[] }>({
    queryKey: [`/api/invoices/${selectedInvoiceId}`],
    enabled: !!selectedInvoiceId,
  });

  // Fetch sent invoices
  const { data: sentInvoices = [], isLoading: loadingSent } = useQuery<Invoice[]>({
    queryKey: [`/api/invoices/sender/${walletAddress}`],
    enabled: !!walletAddress && activeTab === "sent",
  });

  // Fetch received invoices
  const { data: receivedInvoices = [], isLoading: loadingReceived } = useQuery<Invoice[]>({
    queryKey: [`/api/invoices/recipient/${walletAddress}`],
    enabled: !!walletAddress && activeTab === "received",
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/invoices', data),
    onSuccess: () => {
      toast({ title: "Success", description: "Invoice created successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/sender/${walletAddress}`] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create invoice",
        variant: "destructive" 
      });
    },
  });

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/invoices/${id}`, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Invoice updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/sender/${walletAddress}`] });
      setEditingInvoice(null);
      resetForm();
    },
  });

  // Pay invoice mutation
  const payInvoiceMutation = useMutation({
    mutationFn: ({ id, paymentData }: { id: number; paymentData: any }) =>
      apiRequest('POST', `/api/invoices/${id}/pay`, paymentData),
    onSuccess: () => {
      toast({ title: "Success", description: "Payment recorded successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/recipient/${walletAddress}`] });
    },
  });

  // Send reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: (invoiceId: number) =>
      apiRequest('POST', `/api/invoices/${invoiceId}/remind`),
    onSuccess: () => {
      toast({ title: "Success", description: "Reminder sent successfully" });
    },
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      recipientAddress: "",
      recipientEmail: "",
      recipientName: "",
      title: "",
      description: "",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      currency: "USDC",
      taxRate: 0,
      discountRate: 0,
      notes: "",
      terms: "",
      paymentAddress: walletAddress,
    },
  });

  const resetForm = () => {
    form.reset();
    setItems([]);
    setEditingInvoice(null);
  };

  const addItem = () => {
    const newItem = {
      itemName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = (subtotal * (form.watch('taxRate') || 0)) / 100;
    const discountAmount = (subtotal * (form.watch('discountRate') || 0)) / 100;
    const total = subtotal + taxAmount - discountAmount;
    
    return { subtotal, taxAmount, discountAmount, total };
  };

  const onSubmit = (data: InvoiceFormData) => {
    const { subtotal, taxAmount, discountAmount, total } = calculateTotals();
    
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the invoice",
        variant: "destructive"
      });
      return;
    }

    const invoiceData = {
      ...data,
      senderAddress: walletAddress,
      subtotal: subtotal.toString(),
      taxAmount: taxAmount.toString(),
      discountAmount: discountAmount.toString(),
      totalAmount: total.toString(),
      items: items.map((item, index) => ({
        ...item,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        totalPrice: item.totalPrice.toString(),
        sortOrder: index,
      })),
    };

    if (editingInvoice) {
      updateInvoiceMutation.mutate({ id: editingInvoice.id, data: invoiceData });
    } else {
      createInvoiceMutation.mutate(invoiceData);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "secondary", icon: FileText },
      sent: { color: "default", icon: Send },
      viewed: { color: "default", icon: Eye },
      paid: { color: "default", icon: CheckCircle },
      overdue: { color: "destructive", icon: AlertCircle },
      cancelled: { color: "secondary", icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.color as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const copyInvoiceNumber = (invoiceNumber: string) => {
    navigator.clipboard.writeText(invoiceNumber);
    toast({ title: "Copied", description: "Invoice number copied to clipboard" });
  };

  const downloadInvoicePDF = async () => {
    if (!selectedInvoiceDetails) return;

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text('INVOICE', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Invoice #${selectedInvoiceDetails.invoiceNumber}`, 105, 28, { align: 'center' });
      
      // Status
      doc.setFontSize(9);
      doc.text(`Status: ${selectedInvoiceDetails.status.toUpperCase()}`, 105, 34, { align: 'center' });

      // From/To Section
      let yPos = 50;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('From:', 20, yPos);
      doc.text('To:', 120, yPos);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      yPos += 6;
      doc.text(selectedInvoiceDetails.senderAddress.substring(0, 42), 20, yPos);
      doc.text(selectedInvoiceDetails.recipientName || selectedInvoiceDetails.recipientAddress.substring(0, 42), 120, yPos);
      
      if (selectedInvoiceDetails.recipientEmail) {
        yPos += 6;
        doc.text(selectedInvoiceDetails.recipientEmail, 120, yPos);
      }

      // Invoice Details
      yPos += 15;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(selectedInvoiceDetails.title, 20, yPos);
      
      if (selectedInvoiceDetails.description) {
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const splitDesc = doc.splitTextToSize(selectedInvoiceDetails.description, 170);
        doc.text(splitDesc, 20, yPos);
        yPos += splitDesc.length * 5;
      }

      // Items Table
      if (selectedInvoiceDetails.items && selectedInvoiceDetails.items.length > 0) {
        yPos += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Item', 20, yPos);
        doc.text('Qty', 110, yPos);
        doc.text('Price', 140, yPos);
        doc.text('Total', 170, yPos);
        
        yPos += 2;
        doc.line(20, yPos, 190, yPos);
        
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        
        selectedInvoiceDetails.items.forEach((item: any) => {
          doc.text(item.itemName, 20, yPos);
          doc.text(item.quantity.toString(), 110, yPos);
          doc.text(`${parseFloat(item.unitPrice).toFixed(2)}`, 140, yPos);
          doc.text(`${parseFloat(item.totalPrice).toFixed(2)}`, 170, yPos);
          yPos += 7;
        });
        
        yPos += 3;
      } else {
        yPos += 15;
      }

      // Totals
      doc.line(140, yPos, 190, yPos);
      yPos += 7;
      
      doc.text('Subtotal:', 140, yPos);
      doc.text(`${parseFloat(selectedInvoiceDetails.subtotal).toFixed(2)} ${selectedInvoiceDetails.currency}`, 170, yPos);
      yPos += 6;
      
      if (parseFloat(selectedInvoiceDetails.taxAmount || '0') > 0) {
        doc.text('Tax:', 140, yPos);
        doc.text(`${parseFloat(selectedInvoiceDetails.taxAmount || '0').toFixed(2)} ${selectedInvoiceDetails.currency}`, 170, yPos);
        yPos += 6;
      }
      
      if (parseFloat(selectedInvoiceDetails.discountAmount || '0') > 0) {
        doc.text('Discount:', 140, yPos);
        doc.text(`-${parseFloat(selectedInvoiceDetails.discountAmount || '0').toFixed(2)} ${selectedInvoiceDetails.currency}`, 170, yPos);
        yPos += 6;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Total:', 140, yPos);
      doc.text(`${parseFloat(selectedInvoiceDetails.totalAmount).toFixed(2)} ${selectedInvoiceDetails.currency}`, 170, yPos);
      
      // Due Date
      yPos += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Due Date: ${format(new Date(selectedInvoiceDetails.dueDate), "PPP")}`, 20, yPos);

      // Notes and Terms
      if (selectedInvoiceDetails.notes) {
        yPos += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', 20, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const splitNotes = doc.splitTextToSize(selectedInvoiceDetails.notes, 170);
        doc.text(splitNotes, 20, yPos);
        yPos += splitNotes.length * 5;
      }

      if (selectedInvoiceDetails.terms) {
        yPos += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Terms:', 20, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const splitTerms = doc.splitTextToSize(selectedInvoiceDetails.terms, 170);
        doc.text(splitTerms, 20, yPos);
      }

      // Save PDF
      doc.save(`Invoice-${selectedInvoiceDetails.invoiceNumber}.pdf`);
      
      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invoice Management</h2>
          <p className="text-muted-foreground">
            Create, send, and manage smart invoices with crypto payments
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingInvoice ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
              <DialogDescription>
                Fill in the invoice details and add line items
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recipientAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="0x..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="recipientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="recipientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Invoice for services..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional details about the invoice..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Invoice Items Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Invoice Items</h3>
                    <Button type="button" variant="outline" onClick={addItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                  
                  {items.length > 0 && (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Input
                                  value={item.itemName}
                                  onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                                  placeholder="Item name"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={item.description}
                                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                                  placeholder="Description"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.01"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.01"
                                />
                              </TableCell>
                              <TableCell>
                                {item.totalPrice.toFixed(2)} USDC
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Totals Section */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="discountRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Invoice Summary */}
                {items.length > 0 && (
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{totals.subtotal.toFixed(2)} USDC</span>
                    </div>
                    {totals.taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Tax ({form.watch('taxRate')}%):</span>
                        <span>{totals.taxAmount.toFixed(2)} USDC</span>
                      </div>
                    )}
                    {totals.discountAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Discount ({form.watch('discountRate')}%):</span>
                        <span>-{totals.discountAmount.toFixed(2)} USDC</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>{totals.total.toFixed(2)} USDC</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Additional notes..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Terms & Conditions</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Payment terms..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
                  >
                    {editingInvoice ? "Update Invoice" : "Create Invoice"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="sent">Sent Invoices</TabsTrigger>
          <TabsTrigger value="received">Received Invoices</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Sent Invoices
              </CardTitle>
              <CardDescription>
                Invoices you've sent to clients and partners
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSent ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : sentInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No invoices sent</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first invoice.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentInvoices.map((invoice: Invoice) => (
                    <div key={invoice.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{invoice.title}</h3>
                            {getStatusBadge(invoice.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Invoice #{invoice.invoiceNumber}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="ml-2 h-4 w-4 p-0"
                              onClick={() => copyInvoiceNumber(invoice.invoiceNumber)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </p>
                          <p className="text-sm">
                            To: {invoice.recipientName || invoice.recipientAddress}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Due: {format(new Date(invoice.dueDate), "PPP")}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-semibold">
                              {parseFloat(invoice.totalAmount).toFixed(2)} {invoice.currency}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => sendReminderMutation.mutate(invoice.id)}
                              disabled={invoice.status === 'paid' || sendReminderMutation.isPending}
                            >
                              <Clock className="mr-1 h-3 w-3" />
                              Remind
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedInvoiceId(invoice.id)}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="received" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Received Invoices
              </CardTitle>
              <CardDescription>
                Invoices you've received from vendors and service providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingReceived ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : receivedInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No invoices received</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Invoices sent to your address will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedInvoices.map((invoice: Invoice) => (
                    <div key={invoice.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{invoice.title}</h3>
                            {getStatusBadge(invoice.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Invoice #{invoice.invoiceNumber}
                          </p>
                          <p className="text-sm">
                            From: {invoice.senderAddress}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Due: {format(new Date(invoice.dueDate), "PPP")}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-semibold">
                              {parseFloat(invoice.totalAmount).toFixed(2)} {invoice.currency}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {invoice.status !== 'paid' && (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => {
                                  // TODO: Implement payment flow
                                  toast({
                                    title: "Payment Flow",
                                    description: "Payment integration will be implemented next",
                                  });
                                }}
                              >
                                <DollarSign className="mr-1 h-3 w-3" />
                                Pay Now
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedInvoiceId(invoice.id)}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice View Dialog */}
      <Dialog open={!!selectedInvoiceId} onOpenChange={(open) => !open && setSelectedInvoiceId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Invoice Details</span>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadInvoicePDF}
                disabled={!selectedInvoiceDetails}
              >
                <FileText className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </DialogTitle>
            <DialogDescription>
              View complete invoice information
            </DialogDescription>
          </DialogHeader>
          {selectedInvoiceDetails && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="flex items-start justify-between pb-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold">{selectedInvoiceDetails.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Invoice #{selectedInvoiceDetails.invoiceNumber}
                  </p>
                </div>
                {getStatusBadge(selectedInvoiceDetails.status)}
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">From</h4>
                  <p className="text-sm">{selectedInvoiceDetails.senderAddress}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">To</h4>
                  <p className="text-sm">{selectedInvoiceDetails.recipientName || selectedInvoiceDetails.recipientAddress}</p>
                  {selectedInvoiceDetails.recipientEmail && (
                    <p className="text-sm text-muted-foreground">{selectedInvoiceDetails.recipientEmail}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedInvoiceDetails.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm">{selectedInvoiceDetails.description}</p>
                </div>
              )}

              {/* Invoice Items */}
              {selectedInvoiceDetails.items && selectedInvoiceDetails.items.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Items</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-semibold text-sm">Item</th>
                          <th className="text-center p-3 font-semibold text-sm">Qty</th>
                          <th className="text-right p-3 font-semibold text-sm">Price</th>
                          <th className="text-right p-3 font-semibold text-sm">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoiceDetails.items.map((item: any, index: number) => (
                          <tr key={index} className="border-t">
                            <td className="p-3">
                              <div className="font-medium">{item.itemName}</div>
                              {item.description && (
                                <div className="text-sm text-muted-foreground">{item.description}</div>
                              )}
                            </td>
                            <td className="text-center p-3">{item.quantity}</td>
                            <td className="text-right p-3">{parseFloat(item.unitPrice).toFixed(2)}</td>
                            <td className="text-right p-3 font-semibold">{parseFloat(item.totalPrice).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Amount Details */}
              <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm">Subtotal</span>
                  <span className="text-sm">{parseFloat(selectedInvoiceDetails.subtotal).toFixed(2)} {selectedInvoiceDetails.currency}</span>
                </div>
                {parseFloat(selectedInvoiceDetails.taxAmount || '0') > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm">Tax</span>
                    <span className="text-sm">{parseFloat(selectedInvoiceDetails.taxAmount || '0').toFixed(2)} {selectedInvoiceDetails.currency}</span>
                  </div>
                )}
                {parseFloat(selectedInvoiceDetails.discountAmount || '0') > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm">Discount</span>
                    <span className="text-sm">-{parseFloat(selectedInvoiceDetails.discountAmount || '0').toFixed(2)} {selectedInvoiceDetails.currency}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-semibold">
                  <span>Total</span>
                  <span>{parseFloat(selectedInvoiceDetails.totalAmount).toFixed(2)} {selectedInvoiceDetails.currency}</span>
                </div>
              </div>

              {/* Due Date */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Due: {format(new Date(selectedInvoiceDetails.dueDate), "PPP")}
                </span>
              </div>

              {/* Notes and Terms */}
              {selectedInvoiceDetails.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedInvoiceDetails.notes}</p>
                </div>
              )}
              {selectedInvoiceDetails.terms && (
                <div>
                  <h4 className="font-semibold mb-2">Terms</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedInvoiceDetails.terms}</p>
                </div>
              )}

              {/* Payment Information */}
              {selectedInvoiceDetails.status === 'paid' && selectedInvoiceDetails.paymentTxHash && (
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Payment Received
                  </h4>
                  <p className="text-sm">
                    Transaction: {selectedInvoiceDetails.paymentTxHash}
                  </p>
                  {selectedInvoiceDetails.paidAt && (
                    <p className="text-sm text-muted-foreground">
                      Paid on: {format(new Date(selectedInvoiceDetails.paidAt), "PPP")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}