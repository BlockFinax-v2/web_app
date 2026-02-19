const hre = require("hardhat");

// Helper function to wait between deployments
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log("🚀 Deploying BlockFinaX Diamond (EIP-2535) Contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  
  // Deploy DiamondCutFacet
  console.log("📦 Deploying DiamondCutFacet...");
  const DiamondCutFacet = await hre.ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy();
  await diamondCutFacet.waitForDeployment();
  const diamondCutAddress = await diamondCutFacet.getAddress();
  console.log("✅ DiamondCutFacet:", diamondCutAddress);
  await wait(3000); // Wait 3 seconds

  // Deploy Diamond
  console.log("\n📦 Deploying Diamond...");
  const Diamond = await hre.ethers.getContractFactory("Diamond");
  const diamond = await Diamond.deploy(deployer.address, diamondCutAddress, USDC_ADDRESS);
  await diamond.waitForDeployment();
  const diamondAddress = await diamond.getAddress();
  console.log("✅ Diamond:", diamondAddress);
  await wait(3000); // Wait 3 seconds

  // Deploy DiamondLoupeFacet
  console.log("\n📦 Deploying DiamondLoupeFacet...");
  const DiamondLoupeFacet = await hre.ethers.getContractFactory("DiamondLoupeFacet");
  const loupeFacet = await DiamondLoupeFacet.deploy();
  await loupeFacet.waitForDeployment();
  const loupeAddress = await loupeFacet.getAddress();
  console.log("✅ DiamondLoupeFacet:", loupeAddress);
  await wait(3000); // Wait 3 seconds

  // Deploy LiquidityPoolFacet
  console.log("\n📦 Deploying LiquidityPoolFacet...");
  const LiquidityPoolFacet = await hre.ethers.getContractFactory("LiquidityPoolFacet");
  const poolFacet = await LiquidityPoolFacet.deploy();
  await poolFacet.waitForDeployment();
  const poolAddress = await poolFacet.getAddress();
  console.log("✅ LiquidityPoolFacet:", poolAddress);
  await wait(3000); // Wait 3 seconds

  // Deploy GovernanceFacet
  console.log("\n📦 Deploying GovernanceFacet...");
  const GovernanceFacet = await hre.ethers.getContractFactory("GovernanceFacet");
  const govFacet = await GovernanceFacet.deploy();
  await govFacet.waitForDeployment();
  const govAddress = await govFacet.getAddress();
  console.log("✅ GovernanceFacet:", govAddress);
  await wait(3000); // Wait 3 seconds

  // Deploy EscrowFacet
  console.log("\n📦 Deploying EscrowFacet...");
  const EscrowFacet = await hre.ethers.getContractFactory("EscrowFacet");
  const escrowFacet = await EscrowFacet.deploy();
  await escrowFacet.waitForDeployment();
  const escrowAddress = await escrowFacet.getAddress();
  console.log("✅ EscrowFacet:", escrowAddress);
  await wait(3000); // Wait 3 seconds

  // Deploy InvoiceFacet
  console.log("\n📦 Deploying InvoiceFacet...");
  const InvoiceFacet = await hre.ethers.getContractFactory("InvoiceFacet");
  const invoiceFacet = await InvoiceFacet.deploy();
  await invoiceFacet.waitForDeployment();
  const invoiceAddress = await invoiceFacet.getAddress();
  console.log("✅ InvoiceFacet:", invoiceAddress);
  await wait(3000); // Wait 3 seconds

  // Deploy DocumentFacet
  console.log("\n📦 Deploying DocumentFacet...");
  const DocumentFacet = await hre.ethers.getContractFactory("DocumentFacet");
  const documentFacet = await DocumentFacet.deploy();
  await documentFacet.waitForDeployment();
  const documentAddress = await documentFacet.getAddress();
  console.log("✅ DocumentFacet:", documentAddress);
  await wait(3000); // Wait 3 seconds

  // Prepare function selectors for each facet
  const loupeSelectors = [
    loupeFacet.interface.getFunction("facets").selector,
    loupeFacet.interface.getFunction("facetFunctionSelectors").selector,
    loupeFacet.interface.getFunction("facetAddresses").selector,
    loupeFacet.interface.getFunction("facetAddress").selector,
  ];

  const poolSelectors = [
    poolFacet.interface.getFunction("stake").selector,
    poolFacet.interface.getFunction("unstake").selector,
    poolFacet.interface.getFunction("getStake").selector,
    poolFacet.interface.getFunction("getPoolStats").selector,
    poolFacet.interface.getFunction("getStakers").selector,
    poolFacet.interface.getFunction("distributeRewards").selector,
  ];

  const govSelectors = [
    govFacet.interface.getFunction("createRequest").selector,
    govFacet.interface.getFunction("vote").selector,
    govFacet.interface.getFunction("releaseFunds").selector,
    govFacet.interface.getFunction("getRequest").selector,
    govFacet.interface.getFunction("getGovernanceStats").selector,
  ];

  const escrowSelectors = [
    escrowFacet.interface.getFunction("createEscrow").selector,
    escrowFacet.interface.getFunction("addSubWallet").selector,
    escrowFacet.interface.getFunction("completeMilestone").selector,
    escrowFacet.interface.getFunction("releaseMilestonePayment").selector,
    escrowFacet.interface.getFunction("raiseDispute").selector,
    escrowFacet.interface.getFunction("resolveDispute").selector,
    escrowFacet.interface.getFunction("getEscrowDetails").selector,
    escrowFacet.interface.getFunction("getMilestone").selector,
    escrowFacet.interface.getFunction("getMilestones").selector,
    escrowFacet.interface.getFunction("getSubWallets").selector,
    escrowFacet.interface.getFunction("hasPermission").selector,
    escrowFacet.interface.getFunction("getEscrowStats").selector,
  ];

  const invoiceSelectors = [
    invoiceFacet.interface.getFunction("createInvoice").selector,
    invoiceFacet.interface.getFunction("payInvoice").selector,
    invoiceFacet.interface.getFunction("markInvoiceViewed").selector,
    invoiceFacet.interface.getFunction("cancelInvoice").selector,
    invoiceFacet.interface.getFunction("getInvoice").selector,
    invoiceFacet.interface.getFunction("getInvoiceByNumber").selector,
    invoiceFacet.interface.getFunction("updateOverdueStatus").selector,
    invoiceFacet.interface.getFunction("isOverdue").selector,
    invoiceFacet.interface.getFunction("getInvoiceStats").selector,
  ];

  const documentSelectors = [
    documentFacet.interface.getFunction("registerDocument").selector,
    documentFacet.interface.getFunction("verifyDocument").selector,
    documentFacet.interface.getFunction("linkDocumentToEscrow").selector,
    documentFacet.interface.getFunction("linkDocumentToInvoice").selector,
    documentFacet.interface.getFunction("markDocumentVerified").selector,
    documentFacet.interface.getFunction("getDocument").selector,
    documentFacet.interface.getFunction("getUserDocuments").selector,
    documentFacet.interface.getFunction("getEscrowDocuments").selector,
    documentFacet.interface.getFunction("getInvoiceDocuments").selector,
    documentFacet.interface.getFunction("getTotalDocuments").selector,
    documentFacet.interface.getFunction("batchVerifyDocuments").selector,
  ];

  // Add facets to diamond
  console.log("\n🔗 Adding facets to Diamond...");
  const diamondCutInterface = new hre.ethers.Interface([
    "function diamondCut((address,uint8,bytes4[])[],address,bytes)"
  ]);

  const facetCuts = [
    {
      facetAddress: loupeAddress,
      action: 0, // Add
      functionSelectors: loupeSelectors
    },
    {
      facetAddress: poolAddress,
      action: 0, // Add
      functionSelectors: poolSelectors
    },
    {
      facetAddress: govAddress,
      action: 0, // Add
      functionSelectors: govSelectors
    },
    {
      facetAddress: escrowAddress,
      action: 0, // Add
      functionSelectors: escrowSelectors
    },
    {
      facetAddress: invoiceAddress,
      action: 0, // Add
      functionSelectors: invoiceSelectors
    },
    {
      facetAddress: documentAddress,
      action: 0, // Add
      functionSelectors: documentSelectors
    }
  ];

  const diamondCut = await hre.ethers.getContractAt("DiamondCutFacet", diamondAddress);
  const tx = await diamondCut.diamondCut(facetCuts, hre.ethers.ZeroAddress, "0x");
  await tx.wait();
  console.log("✅ All facets added to Diamond");

  // Print deployment summary
  console.log("\n" + "=".repeat(70));
  console.log("📋 BLOCKFINAX DIAMOND DEPLOYMENT SUMMARY");
  console.log("=".repeat(70));
  console.log("Network:", hre.network.name);
  console.log("Diamond Standard:", "EIP-2535");
  console.log("\n🔷 Main Contract:");
  console.log("  Diamond:", diamondAddress);
  console.log("\n🔧 Facets:");
  console.log("  DiamondCutFacet:", diamondCutAddress);
  console.log("  DiamondLoupeFacet:", loupeAddress);
  console.log("  LiquidityPoolFacet:", poolAddress);
  console.log("  GovernanceFacet:", govAddress);
  console.log("  EscrowFacet:", escrowAddress);
  console.log("  InvoiceFacet:", invoiceAddress);
  console.log("  DocumentFacet:", documentAddress);
  console.log("\n⚙️  Configuration:");
  console.log("  USDC Token:", USDC_ADDRESS);
  console.log("  Deployer:", deployer.address);
  console.log("  Minimum Stake: 100 USDC");
  console.log("  Approval Threshold: 60%");
  console.log("=".repeat(70));

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    standard: "EIP-2535 Diamond",
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    diamond: diamondAddress,
    facets: {
      diamondCut: diamondCutAddress,
      diamondLoupe: loupeAddress,
      liquidityPool: poolAddress,
      governance: govAddress,
      escrow: escrowAddress,
      invoice: invoiceAddress,
      document: documentAddress
    },
    config: {
      usdcToken: USDC_ADDRESS,
      minimumStake: "100000000", // 100 USDC (6 decimals)
      approvalThreshold: 60
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  const filename = `deployments-diamond-${hre.network.name}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to ${filename}`);

  // Verification commands
  console.log("\n📝 Verify contracts on Basescan:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${diamondCutAddress}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${diamondAddress} ${deployer.address} ${diamondCutAddress} ${USDC_ADDRESS}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${loupeAddress}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${poolAddress}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${govAddress}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${escrowAddress}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${invoiceAddress}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${documentAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
