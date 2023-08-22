import { ethers } from "hardhat";
import { Signer, Contract } from "ethers";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { DebtIssuanceModuleABI } from "../eth-momentum-bot/src/abis/debtIssuanceModule";
// import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

describe("DebtIssuanceModuleV2 Tests", function () {
  let accounts: Signer[];
  let setToken: Contract;
  let debtIssuanceModule: Contract;
  let wethToken: Contract;
  let usdcToken: Contract;
  const addresses = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "deployedAddresses.json"),
      "utf-8"
    )
  );
  const setTokenAddress = addresses.setTokenAddress;
  const debtIssuanceModuleAddress =
    "0xa0a98eb7af028be00d04e46e1316808a62a8fd59";

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    setToken = await ethers.getContractAt(
      "ISetToken",
      setTokenAddress,
      accounts[0]
    );
    debtIssuanceModule = await ethers.getContractAt(
      DebtIssuanceModuleABI,
      debtIssuanceModuleAddress,
      accounts[0]
    );
    wethToken = await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      WETH_ADDRESS,
      accounts[0]
    );
    usdcToken = await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      USDC_ADDRESS,
      accounts[0]
    );
  });

  const logHeader = (description: string) => {
    console.log("\n--------------------------");
    console.log(description);
    console.log("--------------------------\n");
  };

  const logBalances = async (
    description: string,
    address: string,
    wethToken: Contract,
    usdcToken: Contract
  ): Promise<void> => {
    const wethBalance = await wethToken.balanceOf(address);
    const usdcBalance = await usdcToken.balanceOf(address);
    const setBalance = await setToken.balanceOf(address);

    console.log(`\n${description}`);
    console.log(`WETH Balance: ${ethers.utils.formatEther(wethBalance)} WETH`);
    console.log(
      `USDC Balance: ${ethers.utils.formatUnits(usdcBalance, 6)} USDC`
    );
    console.log(
      `SetToken Balance: ${ethers.utils.formatEther(setBalance)} SET\n`
    );
  };

  it("should approve DebtIssuanceModule to spend WETH and USDC", async function () {
    logHeader("Approvals");
    await logBalances(
      "Balances before approval:",
      await accounts[0].getAddress(),
      wethToken,
      usdcToken
    );

    const approveAmount = ethers.utils.parseUnits("1000", 18); // Approving 1000 WETH and USDC

    // Approve DebtIssuanceModule for WETH
    await wethToken.approve(debtIssuanceModule.address, approveAmount);

    // Approve DebtIssuanceModule for USDC
    await usdcToken.approve(debtIssuanceModule.address, approveAmount);

    // Check approvals
    const wethAllowance = await wethToken.allowance(
      await accounts[0].getAddress(),
      debtIssuanceModule.address
    );
    const usdcAllowance = await usdcToken.allowance(
      await accounts[0].getAddress(),
      debtIssuanceModule.address
    );

    expect(wethAllowance).to.eq(approveAmount);
    expect(usdcAllowance).to.eq(approveAmount);
  });
  it("should initialize the DebtIssuanceModule for SetToken", async function () {
    const isModuleInitialized = await setToken.isInitializedModule(
      debtIssuanceModule.address
    );

    if (isModuleInitialized) {
      return "DebtIssuanceModule is already initialized for this SetToken.";
    }

    const tx = await debtIssuanceModule.initialize(
      setToken.address,
      0, // _maxManagerFee
      0, // _managerIssueFee
      0, // _managerRedeemFee
      await accounts[0].getAddress(), // _feeRecipient
      ethers.constants.AddressZero // _managerIssuanceHook, as Address(0) for no hook
    );
    await tx.wait();
    const isModuleInitializedAfter = await setToken.isInitializedModule(
      debtIssuanceModule.address
    );
    expect(isModuleInitializedAfter).to.be.true;
  });

  it("should issue SetTokens", async function () {
    logHeader("Issuing SetTokens");
    const initialBalance = await setToken.balanceOf(
      await accounts[0].getAddress()
    );
    const amountToIssue = ethers.utils.parseEther("10");
    await logBalances(
      "Balances before issuance:",
      await accounts[0].getAddress(),
      wethToken,
      usdcToken
    );

    await debtIssuanceModule.issue(
      setToken.address,
      amountToIssue,
      await accounts[0].getAddress(),
      {
        gasLimit: 8000000,
      }
    );

    await logBalances(
      "Balances after issuance:",
      await accounts[0].getAddress(),
      wethToken,
      usdcToken
    );

    const finalBalance = await setToken.balanceOf(
      await accounts[0].getAddress()
    );
    // console.log("Final Balance:", finalBalance.toString());
    expect(finalBalance.sub(initialBalance)).to.eq(amountToIssue);
  });

  it("should redeem SetTokens", async function () {
    logHeader("Redeeming SetTokens");
    const initialBalance = await setToken.balanceOf(
      await accounts[0].getAddress()
    );
    const amountToRedeem = ethers.utils.parseEther("0.5");
    await logBalances(
      "Balances before redemption:",
      await accounts[0].getAddress(),
      wethToken,
      usdcToken
    );

    await debtIssuanceModule.redeem(
      setToken.address,
      amountToRedeem,
      await accounts[0].getAddress()
    );
    await logBalances(
      "Balances after redemption:",
      await accounts[0].getAddress(),
      wethToken,
      usdcToken
    );

    const finalBalance = await setToken.balanceOf(
      await accounts[0].getAddress()
    );
    expect(initialBalance.sub(finalBalance)).to.eq(amountToRedeem);
  });

  it("should retrieve required component issuance units", async function () {
    const amount = ethers.utils.parseEther("1");
    const [componentAddresses, equityNotionals, debtNotionals] =
      await debtIssuanceModule.getRequiredComponentIssuanceUnits(
        setToken.address,
        amount
      );
    expect(componentAddresses).to.be.an("array");
    expect(equityNotionals).to.be.an("array");
    expect(debtNotionals).to.be.an("array");
  });

  it("should retrieve required component redemption units", async function () {
    const amount = ethers.utils.parseEther("1");
    const [componentAddresses, equityNotionals, debtNotionals] =
      await debtIssuanceModule.getRequiredComponentRedemptionUnits(
        setToken.address,
        amount
      );
    expect(componentAddresses).to.be.an("array");
    expect(equityNotionals).to.be.an("array");
    expect(debtNotionals).to.be.an("array");
  });
});
