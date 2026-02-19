// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library LibAppStorage {
    bytes32 constant APP_STORAGE_POSITION = keccak256("blockfinax.app.storage");

    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 votingPower;
        bool active;
    }

    struct TradeFinanceRequest {
        string requestId;
        address buyer;
        address seller;
        uint256 requestedAmount;
        string tradeDescription;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 createdAt;
        RequestStatus status;
        bool fundsReleased;
        // Trade Finance fields
        uint256 issuanceFee;
        bool issuanceFeePaid;
        uint256 cashCollateral; // Small collateral (5-10%)
        uint256 paymentDueDate;
    }

    enum RequestStatus { Pending, Approved, Rejected, Funded, Completed, Defaulted, Claimed }
    
    struct GoodsDetails {
        string goodsType; // sugar, electronics, etc.
        uint256 quantity;
        string unit; // tons, pieces, etc.
        uint256 totalValue;
        uint256 marketPrice;
        bool inspected;
        bool insured;
        string billOfLadingHash;
        string billOfLadingNumber;
    }
    
    struct DeliveryProof {
        string billOfLadingHash;
        string trackingNumber;
        string logisticsProvider;
        uint256 deliveryDate;
        string inspectionReportHash;
        bool verified;
        address verifiedBy;
        uint256 verifiedAt;
    }
    
    struct GuaranteeClaim {
        string requestId;
        address seller;
        uint256 claimAmount;
        string claimReason;
        uint256 claimedAt;
        ClaimStatus status;
        uint256 paidAmount;
        uint256 paidAt;
    }
    
    enum ClaimStatus { Pending, UnderReview, Approved, Rejected, Paid }

    struct Milestone {
        string title;
        string description;
        uint256 amount;
        uint256 dueDate;
        MilestoneStatus status;
        bool released;
    }

    enum MilestoneStatus { Pending, Completed, Released }

    struct Escrow {
        uint256 id;
        address importer;
        address exporter;
        address arbitrator;
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 arbitratorFee;
        uint256 deadline;
        address tokenAddress;
        EscrowStatus status;
        DisputeStatus disputeStatus;
        string description;
        string termsHash;
        Milestone[] milestones;
        address[] subWallets;
        mapping(address => bool) isSubWallet;
        mapping(address => string) subWalletRole;
        mapping(address => string[]) subWalletPermissions;
    }

    enum EscrowStatus { Created, Funded, InProgress, Completed, Disputed, Refunded }
    enum DisputeStatus { None, Raised, InArbitration, Resolved }

    struct Invoice {
        uint256 id;
        string invoiceNumber;
        address payer;
        address payee;
        uint256 amount;
        address tokenAddress;
        uint256 dueDate;
        InvoiceStatus status;
        uint256 paidAt;
        string description;
        string termsHash;
    }

    enum InvoiceStatus { Draft, Sent, Viewed, Paid, Overdue, Cancelled }

    struct DocumentRecord {
        bytes32 documentHash;
        string metadataURI; // IPFS CID or database reference
        address uploader;
        uint256 timestamp;
        DocumentType docType;
        uint256 linkedEscrowId; // 0 if not linked
        uint256 linkedInvoiceId; // 0 if not linked
        bool verified;
    }

    enum DocumentType { Contract, Invoice, ProofOfDelivery, LegalDocument, Specification, ComplianceCert, Other }

    struct AppStorage {
        // Liquidity Pool Storage
        address usdcToken;
        mapping(address => Stake) stakes;
        address[] stakers;
        uint256 totalStaked;
        uint256 totalLPs;
        uint256 minimumStake;

        // Governance Storage
        mapping(string => TradeFinanceRequest) requests;
        mapping(string => mapping(address => bool)) hasVoted;
        string[] requestIds;
        uint256 totalRequests;
        uint256 totalFunded;
        uint256 approvalThreshold;

        // Trade Finance Storage
        mapping(string => GoodsDetails) goodsDetails; // requestId -> goods
        mapping(string => DeliveryProof) deliveryProofs; // requestId -> proof
        mapping(string => GuaranteeClaim) claims; // requestId -> claim
        uint256 totalIssuanceFeesCollected;
        uint256 totalGuaranteesIssued;
        uint256 totalDefaultsClaimed;

        // Escrow Storage
        mapping(uint256 => Escrow) escrows;
        uint256 escrowCounter;
        uint256 totalEscrows;
        uint256 activeEscrows;

        // Invoice Storage
        mapping(uint256 => Invoice) invoices;
        mapping(string => uint256) invoiceNumberToId;
        uint256 invoiceCounter;
        uint256 totalInvoices;

        // Document Storage
        mapping(bytes32 => DocumentRecord) documents; // hash -> document
        mapping(address => bytes32[]) userDocuments; // user -> their document hashes
        mapping(uint256 => bytes32[]) escrowDocuments; // escrow -> linked documents
        mapping(uint256 => bytes32[]) invoiceDocuments; // invoice -> linked documents
        uint256 totalDocuments;
    }

    function appStorage() internal pure returns (AppStorage storage s) {
        bytes32 position = APP_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
