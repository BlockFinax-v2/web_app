export const PROGRESS_STEPS = [
    "Applied",
    "Offers Received",
    "Offer Accepted",
    "Documents Verified",
    "Goods Shipped",
    "Delivery Confirmed",
    "Payment Complete",
];

export const FINANCING_TYPE_LABELS: Record<string, string> = {
    letter_of_credit: "Letter of Credit (LC)",
    bank_guarantee: "Bank Guarantee (BG)",
    invoice_discounting: "Invoice Discounting",
    invoice_factoring: "Invoice Factoring",
    supply_chain_finance: "Supply Chain Finance",
    pre_export_finance: "Pre-Export Finance",
    post_import_finance: "Post-Import Finance",
    trade_credit_insurance: "Trade Credit Insurance",
    forfaiting: "Forfaiting",
    documentary_collection: "Documentary Collection",
    warehouse_receipt_finance: "Warehouse Receipt Finance",
    purchase_order_finance: "Purchase Order Finance",
};

export const FINANCING_TYPE_DESCRIPTIONS: Record<string, string> = {
    letter_of_credit: "Bank-issued guarantee of payment to the seller upon presentation of compliant shipping documents.",
    bank_guarantee: "Bank commitment to cover a loss if the buyer fails to fulfill contractual obligations.",
    invoice_discounting: "Advance cash against unpaid invoices while retaining control of your sales ledger.",
    invoice_factoring: "Sell your receivables to a factor who collects payment from your buyers directly.",
    supply_chain_finance: "Buyer-led financing that lets suppliers get early payment on approved invoices.",
    pre_export_finance: "Working capital loan to fund production and preparation of goods before export.",
    post_import_finance: "Short-term financing for importers to pay suppliers while awaiting resale proceeds.",
    trade_credit_insurance: "Insurance policy protecting against buyer non-payment due to insolvency or political risk.",
    forfaiting: "Purchase of medium/long-term receivables at a discount, transferring all risk to the forfaiter.",
    documentary_collection: "Bank-intermediated exchange of shipping documents against payment or acceptance.",
    warehouse_receipt_finance: "Loan secured against commodities stored in a certified warehouse.",
    purchase_order_finance: "Funding to pay suppliers based on confirmed purchase orders from creditworthy buyers.",
};

export function getProgressIndex(status: string): number {
    const map: Record<string, number> = {
        pending_draft: 0,
        draft_sent_to_seller: 0,
        seller_approved: 1,
        offers_received: 1,
        offer_accepted: 2,
        awaiting_fee_payment: 2,
        fee_paid: 3,
        documents_verified: 3,
        approved: 3,
        goods_shipped: 4,
        bol_uploaded: 4,
        buyer_payment_uploaded: 4,
        seller_payment_confirmed: 4,
        seller_bol_uploaded: 4,
        delivery_confirmed: 5,
        buyer_confirmed_delivery: 5,
        payment_complete: 6,
        completed: 6,
        seller_confirmed_payment: 6,
    };
    return map[status] ?? 0;
}

export function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        pending_draft: "Application Submitted",
        draft_sent_to_seller: "Sent to Seller",
        seller_approved: "Seller Approved",
        seller_rejected: "Seller Rejected",
        offers_received: "Offers Available",
        offer_accepted: "Offer Accepted",
        awaiting_fee_payment: "Awaiting Fee",
        fee_paid: "Fee Paid",
        approved: "Approved",
        documents_verified: "Docs Verified",
        goods_shipped: "Goods Shipped",
        bol_uploaded: "BoL Uploaded",
        buyer_payment_uploaded: "Payment Sent",
        seller_payment_confirmed: "Payment Confirmed",
        seller_bol_uploaded: "Shipped",
        delivery_confirmed: "Delivered",
        buyer_confirmed_delivery: "Delivery Confirmed",
        payment_complete: "Complete",
        completed: "Complete",
        seller_confirmed_payment: "Payment Confirmed",
    };
    return labels[status] || status.replace(/_/g, " ").toUpperCase();
}

export function getStatusColor(status: string): string {
    if (status.includes("rejected") || status.includes("cancelled")) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    if (status.includes("complete") || status.includes("confirmed")) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (status.includes("approved") || status.includes("accepted")) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
}

export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export async function computeHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}
