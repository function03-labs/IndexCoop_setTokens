import { ethers } from "hardhat";
import { Contract } from "ethers";

async function createSetToken(): Promise<void> {
  // const [deployer] = await ethers.getSigners();
  //impersonate an account
  const vitalik_address = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";
  const deployer = await ethers.getImpersonatedSigner(vitalik_address);

  //   use tenderly_setBalance to set the balance of the deployer account to 1 ETH

  const WALLETS = [deployer.address];

  // await ethers.provider.send("tenderly_addBalance", [
  //   WALLETS,
  //   ethers.utils.hexValue(ethers.utils.parseUnits("10", "ether").toHexString()),
  // ]);

  console.log("============================================");
  console.log("Account being used:", deployer.address);
  console.log(
    "Account balance:",
    ethers.utils.formatEther(await deployer.getBalance()),
    "ETH"
  );
  console.log("============================================");

  const setTokenCreatorAddress = "0x2758BF6Af0EC63f1710d3d7890e1C263a247B75E";
  console.log("SetTokenCreator Contract Address:", setTokenCreatorAddress);

  const setTokenCreatorABI = [
    {
      inputs: [
        {
          internalType: "contract IController",
          name: "_controller",
          type: "address",
        },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "_setToken",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "_manager",
          type: "address",
        },
        {
          indexed: false,
          internalType: "string",
          name: "_name",
          type: "string",
        },
        {
          indexed: false,
          internalType: "string",
          name: "_symbol",
          type: "string",
        },
      ],
      name: "SetTokenCreated",
      type: "event",
    },
    {
      inputs: [],
      name: "controller",
      outputs: [
        { internalType: "contract IController", name: "", type: "address" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address[]", name: "_components", type: "address[]" },
        { internalType: "int256[]", name: "_units", type: "int256[]" },
        { internalType: "address[]", name: "_modules", type: "address[]" },
        { internalType: "address", name: "_manager", type: "address" },
        { internalType: "string", name: "_name", type: "string" },
        { internalType: "string", name: "_symbol", type: "string" },
      ],
      name: "create",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

  const SetTokenCreator: Contract = new ethers.Contract(
    setTokenCreatorAddress,
    setTokenCreatorABI,
    deployer
  );

  console.log("Initializing components...");
  const components: string[] = [
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  ];
  console.log("Components:", components);

  const units: Array<string | number> = [
    ethers.utils.parseEther("1").toString(),
  ];
  console.log("Units for each component:", units);

  console.log("Setting up modules...");
  const modules: string[] = [
    "0xFaAB3F8f3678f68AA0d307B66e71b636F82C28BF", // TradeModule
    "0xa0a98EB7Af028BE00d04e46e1316808A62a8fd59", // DebtIssuanceModule
  ];
  console.log("Modules:", modules);

  const manager: string = deployer.address;
  console.log("SetToken manager address:", manager);

  const name: string = "$ETHMOM";
  const symbol: string = "ETHMOM";
  console.log("SetToken name:", name, ", Symbol:", symbol);

  console.log("============================================");
  console.log("Calling the create() function on SetTokenCreator...");
  const options = { gasLimit: 1000000 };

  const tx = await SetTokenCreator.create(
    components,
    units,
    modules,
    manager,
    name,
    symbol,
    options
  );
  console.log("Transaction Hash:", tx.hash);

  console.log("Waiting for transaction to be mined...");
  const receipt = await tx.wait();
  console.log("Transaction mined in block:", receipt.blockNumber);

  console.log("============================================");
  console.log("SetToken creation complete!");
}

createSetToken()
  .then(() => {
    console.log("Script executed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error encountered:", error);
    process.exit(1);
  });
