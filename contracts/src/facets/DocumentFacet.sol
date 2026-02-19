// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/LibAppStorage.sol";

/**
 * @title DocumentFacet
 * @notice Manages document hash storage and verification on-chain
 * @dev Stores only hashes, not actual documents (cost-effective & secure)
 */
contract DocumentFacet {
    event DocumentRegistered(
        bytes32 indexed documentHash,
        address indexed uploader,
        LibAppStorage.DocumentType docType,
        string metadataURI
    );
    
    event DocumentLinkedToEscrow(bytes32 indexed documentHash, uint256 indexed escrowId);
    event DocumentLinkedToInvoice(bytes32 indexed documentHash, uint256 indexed invoiceId);
    event DocumentVerified(bytes32 indexed documentHash, address indexed verifier);

    /**
     * @notice Register a document hash on-chain
     * @param _documentHash SHA-256 hash of the document
     * @param _metadataURI IPFS CID or database reference (e.g., "db:12345" or "ipfs:Qm...")
     * @param _docType Type of document (Contract, Invoice, etc.)
     */
    function registerDocument(
        bytes32 _documentHash,
        string memory _metadataURI,
        LibAppStorage.DocumentType _docType
    ) external returns (bytes32) {
        LibAppStorage.AppStorage storage s = LibAppStorage.appStorage();
        
        require(_documentHash != bytes32(0), "Invalid document hash");
        require(bytes(_metadataURI).length > 0, "Metadata URI required");
        require(s.documents[_documentHash].timestamp == 0, "Document already registered");
        
        LibAppStorage.DocumentRecord storage doc = s.documents[_documentHash];
        doc.documentHash = _documentHash;
        doc.metadataURI = _metadataURI;
        doc.uploader = msg.sender;
        doc.timestamp = block.timestamp;
        doc.docType = _docType;
        doc.verified = false;
        
        s.userDocuments[msg.sender].push(_documentHash);
        s.totalDocuments++;
        
        emit DocumentRegistered(_documentHash, msg.sender, _docType, _metadataURI);
        
        return _documentHash;
    }

    /**
     * @notice Verify a document exists on-chain and matches the hash
     * @param _documentHash Hash to verify
     * @return exists Whether document is registered
     * @return uploader Address that uploaded the document
     * @return timestamp When it was registered
     */
    function verifyDocument(bytes32 _documentHash) 
        external 
        view 
        returns (bool exists, address uploader, uint256 timestamp) 
    {
        LibAppStorage.AppStorage storage s = LibAppStorage.appStorage();
        LibAppStorage.DocumentRecord storage doc = s.documents[_documentHash];
        
        return (
            doc.timestamp > 0,
            doc.uploader,
            doc.timestamp
        );
    }

    /**
     * @notice Link document to an escrow contract
     * @param _documentHash Document hash to link
     * @param _escrowId Escrow ID to link to
     */
    function linkDocumentToEscrow(bytes32 _documentHash, uint256 _escrowId) external {
        LibAppStorage.AppStorage storage s = LibAppStorage.appStorage();
        
        require(s.documents[_documentHash].timestamp > 0, "Document not found");
        require(s.escrows[_escrowId].id > 0, "Escrow not found");
        
        LibAppStorage.Escrow storage escrow = s.escrows[_escrowId];
        require(
            msg.sender == escrow.importer || 
            msg.sender == escrow.exporter || 
            msg.sender == escrow.arbitrator,
            "Not authorized"
        );
        
        s.documents[_documentHash].linkedEscrowId = _escrowId;
        s.escrowDocuments[_escrowId].push(_documentHash);
        
        emit DocumentLinkedToEscrow(_documentHash, _escrowId);
    }

    /**
     * @notice Link document to an invoice
     * @param _documentHash Document hash to link
     * @param _invoiceId Invoice ID to link to
     */
    function linkDocumentToInvoice(bytes32 _documentHash, uint256 _invoiceId) external {
        LibAppStorage.AppStorage storage s = LibAppStorage.appStorage();
        
        require(s.documents[_documentHash].timestamp > 0, "Document not found");
        require(s.invoices[_invoiceId].id > 0, "Invoice not found");
        
        LibAppStorage.Invoice storage invoice = s.invoices[_invoiceId];
        require(
            msg.sender == invoice.payer || msg.sender == invoice.payee,
            "Not authorized"
        );
        
        s.documents[_documentHash].linkedInvoiceId = _invoiceId;
        s.invoiceDocuments[_invoiceId].push(_documentHash);
        
        emit DocumentLinkedToInvoice(_documentHash, _invoiceId);
    }

    /**
     * @notice Mark a document as verified (only by authorized parties)
     * @param _documentHash Document to verify
     * @dev Can only be called by:
     * - Document uploader
     * - Arbitrator of linked escrow
     * - Payer/Payee of linked invoice
     */
    function markDocumentVerified(bytes32 _documentHash) external {
        LibAppStorage.AppStorage storage s = LibAppStorage.appStorage();
        LibAppStorage.DocumentRecord storage doc = s.documents[_documentHash];
        
        require(doc.timestamp > 0, "Document not found");
        
        bool authorized = false;
        
        // Check if caller is the document uploader
        if (msg.sender == doc.uploader) {
            authorized = true;
        }
        
        // Check if caller is arbitrator of linked escrow
        if (!authorized && doc.linkedEscrowId > 0) {
            LibAppStorage.Escrow storage escrow = s.escrows[doc.linkedEscrowId];
            if (msg.sender == escrow.arbitrator || 
                msg.sender == escrow.importer || 
                msg.sender == escrow.exporter) {
                authorized = true;
            }
        }
        
        // Check if caller is payer/payee of linked invoice
        if (!authorized && doc.linkedInvoiceId > 0) {
            LibAppStorage.Invoice storage invoice = s.invoices[doc.linkedInvoiceId];
            if (msg.sender == invoice.payer || msg.sender == invoice.payee) {
                authorized = true;
            }
        }
        
        require(authorized, "Not authorized to verify document");
        
        doc.verified = true;
        
        emit DocumentVerified(_documentHash, msg.sender);
    }

    /**
     * @notice Get document information
     * @param _documentHash Document hash to query
     */
    function getDocument(bytes32 _documentHash) 
        external 
        view 
        returns (
            bytes32 documentHash,
            string memory metadataURI,
            address uploader,
            uint256 timestamp,
            LibAppStorage.DocumentType docType,
            uint256 linkedEscrowId,
            uint256 linkedInvoiceId,
            bool verified
        ) 
    {
        LibAppStorage.AppStorage storage s = LibAppStorage.appStorage();
        LibAppStorage.DocumentRecord storage doc = s.documents[_documentHash];
        
        return (
            doc.documentHash,
            doc.metadataURI,
            doc.uploader,
            doc.timestamp,
            doc.docType,
            doc.linkedEscrowId,
            doc.linkedInvoiceId,
            doc.verified
        );
    }

    /**
     * @notice Get all documents uploaded by a user
     * @param _user User address
     */
    function getUserDocuments(address _user) external view returns (bytes32[] memory) {
        LibAppStorage.AppStorage storage s = LibAppStorage.appStorage();
        return s.userDocuments[_user];
    }

    /**
     * @notice Get all documents linked to an escrow
     * @param _escrowId Escrow ID
     */
    function getEscrowDocuments(uint256 _escrowId) external view returns (bytes32[] memory) {
        LibAppStorage.AppStorage storage s = LibAppStorage.appStorage();
        return s.escrowDocuments[_escrowId];
    }

    /**
     * @notice Get all documents linked to an invoice
     * @param _invoiceId Invoice ID
     */
    function getInvoiceDocuments(uint256 _invoiceId) external view returns (bytes32[] memory) {
        LibAppStorage.AppStorage storage s = LibAppStorage.appStorage();
        return s.invoiceDocuments[_invoiceId];
    }

    /**
     * @notice Get total registered documents
     */
    function getTotalDocuments() external view returns (uint256) {
        LibAppStorage.AppStorage storage s = LibAppStorage.appStorage();
        return s.totalDocuments;
    }

    /**
     * @notice Batch verify multiple documents
     * @param _documentHashes Array of document hashes to verify
     * @return results Array of verification results
     */
    function batchVerifyDocuments(bytes32[] memory _documentHashes) 
        external 
        view 
        returns (bool[] memory results) 
    {
        LibAppStorage.AppStorage storage s = LibAppStorage.appStorage();
        results = new bool[](_documentHashes.length);
        
        for (uint256 i = 0; i < _documentHashes.length; i++) {
            results[i] = s.documents[_documentHashes[i]].timestamp > 0;
        }
        
        return results;
    }
}
