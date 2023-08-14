import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { expect } from "chai";
import { tradeModuleAbi } from "../eth-momentum-bot/src/abis/tradeModule";

describe("SetToken Rebalancing", function () {
  let accounts: Signer[];
  let setToken: Contract;
  let tradeModule: Contract;
  let accountAddress: string;

  const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const TRADE_MODULE_ADDRESS = "0xFaAB3F8f3678f68AA0d307B66e71b636F82C28BF"; // Replace with actual TradeModule address
  const setTokenAddress = "0x93e70429f3493e5584291093a61530485ff566de";
  beforeEach(async function () {
    accounts = await ethers.getSigners();
    accountAddress = await accounts[0].getAddress();
    setToken = await ethers.getContractAt(
      "ISetToken",
      setTokenAddress,
      accounts[0]
    );
    tradeModule = new ethers.Contract(
      TRADE_MODULE_ADDRESS,
      tradeModuleAbi,
      accounts[0]
    );
  });

  function getNewComposition(trendScore: number): [number, number] {
    if (trendScore === 1.0) {
      return [100, 0];
    } else if ([-0.5, 0, 0.5].includes(trendScore)) {
      return [50, 50];
    } else if (trendScore === 1) {
      return [0, 100];
    } else {
      return [50, 50]; // Default case
    }
  }
  it("should initialize TradeModule for SetToken", async function () {
    // Assuming you've already set up your contract objects and signer

    // Check if the sender is the manager of the SetToken
    const manager = await setToken.manager();
    if (accountAddress !== manager) {
      throw new Error(
        "Signer is not the manager of the SetToken. Cannot initialize the TradeModule."
      );
    }

    // Initialize TradeModule for the SetToken
    const tx = await tradeModule.initialize(setTokenAddress);
    const receipt = await tx.wait();
    console.log(
      "TradeModule initialized for SetToken. Transaction Hash:",
      receipt.transactionHash
    );
  });
  it("should rebalance SetToken based on trend score", async function () {
    console.log("Starting rebalancing based on trend score...");

    const trendScore = 0.5;
    console.log(`Given trend score: ${trendScore}`);

    const [desiredUSDCPercentage, desiredWETHPercentage] =
      getNewComposition(trendScore);
    console.log(
      `Desired Composition - USDC: ${desiredUSDCPercentage}%, WETH: ${desiredWETHPercentage}%`
    );

    // 1. Fetch the Current Composition
    const currentWETHUnits = await setToken.getTotalComponentRealUnits(
      WETH_ADDRESS
    );
    const currentUSDCUnits = await setToken.getTotalComponentRealUnits(
      USDC_ADDRESS
    );
    const totalUnits = currentWETHUnits.add(currentUSDCUnits);
    const currentWETHPercentage = (currentWETHUnits / totalUnits) * 100;
    const currentUSDCPercentage = (currentUSDCUnits / totalUnits) * 100;
    console.log(
      `Current Composition - USDC: ${currentUSDCPercentage.toFixed(
        2
      )}%, WETH: ${currentWETHPercentage.toFixed(2)}%`
    );

    // 2. Calculate the Difference
    const wethDifferencePercentage =
      desiredWETHPercentage - currentWETHPercentage;
    const usdcDifferencePercentage =
      desiredUSDCPercentage - currentUSDCPercentage;
    console.log(
      `Difference to be adjusted - USDC: ${usdcDifferencePercentage.toFixed(
        2
      )}%, WETH: ${wethDifferencePercentage.toFixed(2)}%`
    );

    // Check if the differences are greater than 5% before executing the trade
    if (
      Math.abs(wethDifferencePercentage) < 5 &&
      Math.abs(usdcDifferencePercentage) < 5
    ) {
      console.log(
        "Difference in composition is less than 5%. No rebalancing required."
      );
      return;
    }

    const totalSupply = await setToken.totalSupply();
    console.log("Total Supply:", totalSupply.toString());
    const wethTradeAmount = (totalSupply * wethDifferencePercentage) / 100;
    const usdcTradeAmount = (totalSupply * usdcDifferencePercentage) / 100;
    console.log(
      `Trade Amounts - USDC: ${usdcTradeAmount}, WETH: ${wethTradeAmount}`
    );

    const exchangeName = "BalancerV2ExchangeAdapter";
    const minReceiveQuantity = 0;
    const data = ethers.utils.hexlify([]);

    // Check if we need to trade WETH
    if (wethDifferencePercentage > 5) {
      console.log("Executing trade: Selling WETH to buy USDC...");
      const tx = await tradeModule.trade(
        setToken.address,
        exchangeName,
        WETH_ADDRESS,
        wethTradeAmount,
        USDC_ADDRESS,
        minReceiveQuantity,
        data,
        { gasLimit: 8000000 }
      );
      const receipt = await tx.wait();
      console.log("Rebalance Transaction:", receipt.transactionHash);
    } else if (wethDifferencePercentage < -5) {
      console.log("Executing trade: Buying WETH by selling USDC...");

      const tx = await tradeModule.trade(
        setToken.address,
        exchangeName,
        USDC_ADDRESS,
        -usdcTradeAmount,
        WETH_ADDRESS,
        minReceiveQuantity,
        data,
        { gasLimit: 8000000 }
      );
      const receipt = await tx.wait();
      console.log("Rebalance Transaction:", receipt.transactionHash);
    }

    const newWETHUnits = await setToken.getTotalComponentRealUnits(
      WETH_ADDRESS
    );
    const newUSDCUnits = await setToken.getTotalComponentRealUnits(
      USDC_ADDRESS
    );
    const newTotalUnits = newWETHUnits.add(newUSDCUnits);
    const newWETHPercentage = (newWETHUnits / newTotalUnits) * 100;
    const newUSDCPercentage = (newUSDCUnits / newTotalUnits) * 100;
    console.log(
      `New Composition after Rebalancing - USDC: ${newUSDCPercentage.toFixed(
        2
      )}%, WETH: ${newWETHPercentage.toFixed(2)}%`
    );
  });

  // Add more tests as necessary, for example:
  // - Test rebalancing with different trend scores.
  // - Test rebalancing edge cases.
  // - Test error scenarios, like when trying to trade more than the available amount.
});
