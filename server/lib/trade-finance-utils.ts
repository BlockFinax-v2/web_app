/**
 * Trade Finance Utility Functions
 * 
 * Handles certificate generation and financial formatting for trade finance.
 */

/**
 * Generate URDG 758-compliant Trade Finance Guarantee Certificate
 * Following ICC URDG 758 model form structure
 */
export function generateURDG758Certificate(params: {
  request: any;
  certificateType: 'draft' | 'final';
  version?: number;
  executionDetails?: {
    draftCreatedAt?: Date;
    sellerApprovedAt?: Date;
    feePaidAt?: Date;
    feeTxHash?: string;
    feeDue?: string;
    finalizedAt?: Date;
    treasuryAddress?: string;
  };
}): string {
  const { request, certificateType, version = 1, executionDetails } = params;
  const isDraft = certificateType === 'draft';
  const currentDate = new Date().toISOString().split('T')[0];
  
  const certificate = `[BlockFinaX Treasury Pool]

IRREVOCABLE TRADE FINANCE GUARANTEE

═══════════════════════════════════════════════════════════════════════

To: ${request.sellerAddress}

Date: ${currentDate}

───────────────────────────────────────────────────────────────────────

– TYPE OF GUARANTEE: Performance Guarantee (Goods-as-Collateral Trade Finance Guarantee)
– GUARANTEE NO.: ${request.requestId}
– THE GUARANTOR: BlockFinaX Treasury Pool
   Pool Contract Address: [Treasury Pool Smart Contract]
   Place of Issue: Base Sepolia Blockchain Network
   Status: ${isDraft ? 'DRAFT - Subject to Seller Approval and Fee Payment' : 'FINAL - ACTIVE AND ENFORCEABLE'}
   
– THE APPLICANT (Principal/Buyer):
   Company: ${request.buyerCompany || 'Not Provided'}
   Registration: ${request.buyerRegistration || 'Not Provided'}
   Country: ${request.buyerCountry || 'Not Provided'}
   Contact: ${request.buyerContact || 'Not Provided'}
   Email: ${request.buyerEmail || 'Not Provided'}
   Phone: ${request.buyerPhone || 'Not Provided'}
   Wallet Address: ${request.buyerAddress}
   Application Date: ${request.createdAt?.toISOString().split('T')[0] || currentDate}
   
– THE BENEFICIARY (Seller):
   Company: ${request.sellerCompany || 'Not Provided'}
   Registration: ${request.sellerRegistration || 'Not Provided'}
   Country: ${request.sellerCountry || 'Not Provided'}
   Contact: ${request.sellerContact || 'Not Provided'}
   Email: ${request.sellerEmail || 'Not Provided'}
   Phone: ${request.sellerPhone || 'Not Provided'}
   Wallet Address: ${request.sellerAddress}
   
– THE UNDERLYING RELATIONSHIP: The Applicant's payment obligation in respect of
   Trade Description: ${request.tradeDescription || 'Not Provided'}
   Goods Description: ${request.goodsDescription || 'Not Provided'}
   Delivery Terms: ${request.deliveryTerms || 'To be determined'}
   
– GUARANTEE AMOUNT AND CURRENCY: 
   USD ${request.requestedAmount} (${numberToWords(request.requestedAmount)} UNITED STATES DOLLARS) in USDC Stablecoin
   
– COLLATERAL SECURITY:
   USD ${request.collateralAmount || '0.00'} deposited in blockchain escrow by Applicant
   Percentage: ${request.collateralAmount ? ((parseFloat(request.collateralAmount) / parseFloat(request.requestedAmount)) * 100).toFixed(2) : '0'}%
   Escrow Status: ${isDraft ? 'To be secured upon final issuance' : 'SECURED AND VERIFIED'}
   
– ANY DOCUMENT REQUIRED IN SUPPORT OF THE DEMAND FOR PAYMENT:
   1. Beneficiary's signed demand for payment (cryptographic wallet signature required)
   2. Beneficiary's statement indicating in what respect the Applicant is in breach
   3. Supporting commercial documents as applicable (invoices, bills of lading, etc.)
   
– LANGUAGE OF ANY REQUIRED DOCUMENTS: English
   
– FORM OF PRESENTATION: Electronic presentation via BlockFinaX Platform
   Document verification: Cryptographic hash verification on blockchain
   Platform submission required with digital signatures
   
– PLACE FOR PRESENTATION: BlockFinaX Platform
   Blockchain Network: Base Sepolia
   Smart Contract Verification: Required
   Platform URL: [Application Interface]
   
– EXPIRY: ${request.expiryDate || 'Upon completion of all contractual obligations'}
   Latest date for presentation: ${request.expiryDate || 'To be determined'}
   
– THE PARTY LIABLE FOR THE PAYMENT OF ANY CHARGES: 
   Issuance Fee (1% of guarantee amount): Applicant
   Blockchain Transaction Fees: Applicant
   Document Handling Fees (if applicable): Beneficiary

───────────────────────────────────────────────────────────────────────

GUARANTEE UNDERTAKING

As Guarantor, we hereby irrevocably undertake to pay the Beneficiary any amount 
up to the Guarantee Amount upon presentation of the Beneficiary's complying 
demand, in the form of presentation indicated above, supported by such other 
documents as may be listed above and in any event by the Beneficiary's statement, 
whether in the demand itself or in a separate signed document accompanying or 
identifying the demand, indicating in what respect the Applicant is in breach of 
its obligations under the Underlying Relationship.

Any demand under this Guarantee must be received by us on or before Expiry at 
the Place for presentation indicated above.

Payment under this guarantee will be automatically executed through smart contract 
technology and transferred in USDC stablecoin to the Beneficiary's wallet address 
within twenty-four (24) hours of demand verification and document compliance review.

───────────────────────────────────────────────────────────────────────

THIS GUARANTEE IS SUBJECT TO THE UNIFORM RULES FOR DEMAND GUARANTEES (URDG) 
2010 REVISION, ICC PUBLICATION NO. 758, EXCEPT TO THE EXTENT THAT THE TERMS OF 
THIS GUARANTEE EXPRESSLY PROVIDE OTHERWISE.

───────────────────────────────────────────────────────────────────────
${isDraft ? `
${!executionDetails ? `
⚠️ DRAFT STATUS:
This is a DRAFT certificate subject to:
1. Seller/Beneficiary review and approval
2. Payment of 1% issuance fee (${request.feeDue || calculateFee(request.requestedAmount)} USDC) by Applicant
3. Final issuance by Treasury Pool

This draft does not constitute a binding guarantee until all conditions are met.
` : ''} 
` : `
EXECUTION AND ACTIVATION DETAILS:
═══════════════════════════════════════════════════════════════════════

APPROVAL HISTORY:
✓ Draft Created: ${executionDetails?.draftCreatedAt?.toISOString().split('T')[0] || 'N/A'}
✓ Seller/Beneficiary Approved: ${executionDetails?.sellerApprovedAt?.toISOString().split('T')[0] || 'N/A'}
✓ Issuance Fee Paid: ${executionDetails?.feePaidAt?.toISOString().split('T')[0] || 'N/A'}
✓ Final Certificate Issued: ${executionDetails?.finalizedAt?.toISOString().split('T')[0] || currentDate}

FEE PAYMENT VERIFICATION:
- Fee Amount Paid: ${executionDetails?.feeDue || '0.00'} USDC
- Payment Transaction: ${executionDetails?.feeTxHash || 'N/A'}
- Payment Date: ${executionDetails?.feePaidAt?.toISOString().split('T')[0] || 'N/A'}
- Payment Status: CONFIRMED AND VERIFIED
- Fee Distribution: 60% to Treasury Stakers, 40% to Treasury Reserve

GUARANTEE ACTIVATION:
- Activation Date: ${executionDetails?.finalizedAt?.toISOString().split('T')[0] || currentDate}
- Guarantee Status: ACTIVE AND ENFORCEABLE
- Collateral Status: SECURED AND VERIFIED
- Smart Contract: DEPLOYED AND ACTIVE

✓ LEGAL EFFECT:
This guarantee is now legally binding on all parties. The Beneficiary may present
a complying demand at any time before the expiry date. The Guarantor is obligated
to honor complying demands in accordance with ICC URDG 758.

═══════════════════════════════════════════════════════════════════════
`}

BLOCKCHAIN VERIFICATION:
Network: Base Sepolia
Guarantee Reference: ${request.requestId}
${isDraft ? 'Treasury Wallet: [To be signed upon finalization]' : `Treasury Wallet: ${executionDetails?.treasuryAddress || 'N/A'}`}
Certificate Version: ${version}
${!isDraft && executionDetails?.feeTxHash ? `Issuance Transaction: ${executionDetails.feeTxHash}` : ''}

───────────────────────────────────────────────────────────────────────

EXECUTION

FOR AND ON BEHALF OF BLOCKFINAX TREASURY POOL

${isDraft ? '[Authorized Signature - Pending Final Issuance]' : 'Authorized Signature (Cryptographic)'}
${isDraft ? 'Treasury Wallet: [Pending]' : `Treasury Multi-Signature Wallet: ${executionDetails?.treasuryAddress || 'N/A'}`}
Date of ${isDraft ? 'Draft Creation' : 'Execution'}: ${currentDate}

═══════════════════════════════════════════════════════════════════════
`;

  return certificate;
}

/**
 * Helper function to calculate 1% fee
 */
export function calculateFee(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return (num * 0.01).toFixed(2);
}

/**
 * Helper function to convert numbers to words (handles decimal currency amounts)
 */
export function numberToWords(num: string | number): string {
  const amount = typeof num === 'string' ? parseFloat(num) : num;
  const units = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  
  // Split into dollars and cents
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);
  
  function convertWholeNumber(n: number): string {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const tensDigit = Math.floor(n / 10);
      const onesDigit = n % 10;
      return tens[tensDigit] + (onesDigit !== 0 ? ' ' + units[onesDigit] : '');
    }
    if (n < 1000) {
      const hundredsDigit = Math.floor(n / 100);
      const remainder = n % 100;
      return units[hundredsDigit] + ' HUNDRED' + (remainder !== 0 ? ' AND ' + convertWholeNumber(remainder) : '');
    }
    if (n < 1000000) {
      const thousands = Math.floor(n / 1000);
      const remainder = n % 1000;
      return convertWholeNumber(thousands) + ' THOUSAND' + (remainder !== 0 ? ' ' + convertWholeNumber(remainder) : '');
    }
    return n.toString(); // Fallback for very large numbers
  }
  
  const dollarWords = dollars === 0 ? 'ZERO' : convertWholeNumber(dollars);
  
  if (cents === 0) {
    return dollarWords;
  } else {
    const centsWords = convertWholeNumber(cents);
    return `${dollarWords} AND ${centsWords}/100`;
  }
}
