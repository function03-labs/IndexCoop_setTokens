import { ethers, chainlink } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { tradeModuleAbi } from "../eth-momentum-bot/src/abis/tradeModule";

describe("SetToken Rebalancing", async function () {
  let accounts: Signer[];
  let setToken: Contract;
  let tradeModule: Contract;
  let wethToken: Contract;
  let usdcToken: Contract;

  const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const TRADE_MODULE_ADDRESS = "0xFaAB3F8f3678f68AA0d307B66e71b636F82C28BF";

  const addresses = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "deployedAddresses.json"),
      "utf-8"
    )
  );
  const setTokenAddress = addresses.setTokenAddress;

  const getEthPrice = async (): Promise<number> => {
    const ethUsdAggr = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
    return (await chainlink.getLatestPrice(ethUsdAggr)).toNumber() / 1e8;
  };

  const getCurrentQuantities = async (): Promise<{
    weth: number;
    usdc: number;
  }> => {
    const wethQuantity = parseFloat(
      ethers.utils.formatUnits(
        await setToken.getDefaultPositionRealUnit(WETH_ADDRESS),
        18
      )
    );
    const usdcQuantity = parseFloat(
      ethers.utils.formatUnits(
        await setToken.getDefaultPositionRealUnit(USDC_ADDRESS),
        6
      )
    );
    return { weth: wethQuantity, usdc: usdcQuantity };
  };

  const logCurrentState = (
    wethQuantity: number,
    usdcQuantity: number,
    totalValue: number,
    totalSupply: number
  ) => {
    console.log(`Current WETH Quantity: ${wethQuantity} WETH`);
    console.log(`Current USDC Quantity: ${usdcQuantity} USDC`);
    console.log(`Total Portfolio Value: ${totalValue.toFixed(2)} USD`);
    console.log(`Total Supply: ${totalSupply} SetTokens`);
  };

  const executeTrade = async (
    isBuyingWeth: boolean,
    tradeAmount: number
  ): Promise<string> => {
    const exchangeName = "BalancerV2ExchangeAdapter";
    const minReceiveQuantity = 0;
    const data =
      "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019";
    let tradeTx;

    if (isBuyingWeth) {
      tradeTx = await tradeModule.trade(
        setToken.address,
        exchangeName,
        USDC_ADDRESS,
        parseInt(tradeAmount.toString()),
        WETH_ADDRESS,
        minReceiveQuantity,
        data,
        { gasLimit: 8000000 }
      );
    } else {
      tradeTx = await tradeModule.trade(
        setToken.address,
        exchangeName,
        WETH_ADDRESS,
        tradeAmount.toString(),
        USDC_ADDRESS,
        minReceiveQuantity,
        data,
        { gasLimit: 8000000 }
      );
    }

    const receipt = await tradeTx.wait();
    return receipt.transactionHash;
  };

  const getTotalPortfolioValue = async (
    wethQuantity: number,
    usdcQuantity: number,
    ethPrice: number
  ) => {
    const wethValue = wethQuantity * ethPrice;
    const usdcValue = usdcQuantity;
    return wethValue + usdcValue;
  };

  const isRebalanceRequired = (wethDifference: number, totalValue: number) => {
    return Math.abs(wethDifference) >= (5 / 100) * totalValue;
  };

  const getTradeAmount = async (wethDifference: number, ethPrice: number) => {
    console.log("WETH Difference:", wethDifference);
    // get quantities

    return wethDifference < 0
      ? (Math.abs(wethDifference) * 10 ** 18) / ethPrice
      : wethDifference * 10 ** 6;
  };

  const logHeader = (description: string) => {
    console.log("\n==========================");
    console.log(description);
    console.log("==========================\n");
  };
  beforeEach(async function () {
    accounts = await ethers.getSigners();
    setToken = await ethers.getContractAt("ISetToken", setTokenAddress);
    tradeModule = new ethers.Contract(
      TRADE_MODULE_ADDRESS,
      tradeModuleAbi,
      accounts[0]
    );
    wethToken = await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      WETH_ADDRESS
    );
    usdcToken = await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      USDC_ADDRESS
    );
  });

  function getNewComposition(trendScore: number): [number, number] {
    logHeader(`Fetching new composition for trend score: ${trendScore}`);
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

  describe("Approvals", function () {
    it("should approve TradeModule to spend WETH and USDC", async function () {
      const approveAmount = ethers.utils.parseUnits("1000", 18);

      await wethToken.approve(tradeModule.address, approveAmount);
      await usdcToken.approve(tradeModule.address, approveAmount);

      const wethAllowance = await wethToken.allowance(
        await accounts[0].getAddress(),
        tradeModule.address
      );
      const usdcAllowance = await usdcToken.allowance(
        await accounts[0].getAddress(),
        tradeModule.address
      );

      expect(wethAllowance).to.eq(approveAmount);
      expect(usdcAllowance).to.eq(approveAmount);
    });
  });

  describe("Initialization", function () {
    it("should initialize TradeModule for SetToken", async function () {
      const manager = await setToken.manager();
      expect(manager).to.eq(await accounts[0].getAddress());

      await tradeModule.initialize(setTokenAddress, {
        gasLimit: 8000000,
      });
    });
  });

  describe("Rebalancing", function () {
    it("should rebalance SetToken based on trend score equal to 1", async function () {
      logHeader("Rebalancing SetToken based on trend score");

      const trendScore = 1;
      const ethPrice = await getEthPrice();
      const { weth: wethQuantity, usdc: usdcQuantity } =
        await getCurrentQuantities();

      const wethValue = wethQuantity * ethPrice;
      const totalValue = await getTotalPortfolioValue(
        wethQuantity,
        usdcQuantity,
        ethPrice
      );
      const totalSupply = parseFloat(
        ethers.utils.formatUnits(await setToken.totalSupply(), 18)
      );

      logCurrentState(wethQuantity, usdcQuantity, totalValue, totalSupply);

      const [desiredUSDCPercentage, desiredWETHPercentage] =
        getNewComposition(trendScore);
      const desiredWETHValue = (desiredWETHPercentage / 100) * totalValue;
      const wethDifference = desiredWETHValue - wethValue;
      console.log(
        "desired USDC percentage: ",
        desiredUSDCPercentage,
        "desired WETH percentage: ",
        desiredWETHPercentage,
        "desired WETH value: ",
        desiredWETHValue,
        "weth value: ",
        wethValue,
        "total value: ",
        totalValue,
        "weth difference: ",
        wethDifference,
        "eth price: ",
        ethPrice,
        "weth quantity: ",
        wethQuantity,
        "usdc quantity: ",
        usdcQuantity,
        "total supply: ",
        totalSupply
      );

      if (!isRebalanceRequired(wethDifference, totalValue)) {
        console.log("No rebalancing required.");
        return;
      }
      const tradeAmount = await getTradeAmount(wethDifference, ethPrice);

      const tradeHash = await executeTrade(wethDifference > 0, tradeAmount);
      console.log("Rebalance Transaction:", tradeHash);

      const newWETHQuantity = parseFloat(
        ethers.utils.formatUnits(
          await setToken.getDefaultPositionRealUnit(WETH_ADDRESS),
          18
        )
      );

      // make sure current quantites is close to 0% WETH with 5% tolerance
      const { weth: wethQuantityNew, usdc: usdcQuantitynew } =
        await getCurrentQuantities();

      console.log(
        `New WETH Quantity: ${wethQuantityNew} WETH`,
        `New USDC Quantity: ${usdcQuantitynew} USDC`
      );
      // find total value and then find the percentage of weth
      const wethValueNew = wethQuantityNew * ethPrice;
      const totalValuenew = await getTotalPortfolioValue(
        wethValueNew,
        usdcQuantitynew,
        ethPrice
      );
      const wethPercentageNew = (wethValueNew / totalValuenew) * 100;
      expect(wethPercentageNew).to.be.closeTo(0, 5);
    });

    it("should rebalance SetToken based on trend score equal to 0", async function () {
      logHeader("Rebalancing SetToken based on trend score");

      const trendScore = 0;
      const ethPrice = await getEthPrice();
      const { weth: wethQuantity, usdc: usdcQuantity } =
        await getCurrentQuantities();

      const wethValue = wethQuantity * ethPrice;
      const totalValue = await getTotalPortfolioValue(
        wethQuantity,
        usdcQuantity,
        ethPrice
      );
      const totalSupply = parseFloat(
        ethers.utils.formatUnits(await setToken.totalSupply(), 18)
      );

      logCurrentState(wethQuantity, usdcQuantity, totalValue, totalSupply);

      const [desiredUSDCPercentage, desiredWETHPercentage] =
        getNewComposition(trendScore);
      const desiredWETHValue = (desiredWETHPercentage / 100) * totalValue;
      const wethDifference = desiredWETHValue - wethValue;

      if (!isRebalanceRequired(wethDifference, totalValue)) {
        console.log("No rebalancing required.");
        return;
      }
      const tradeAmount = getTradeAmount(wethDifference, ethPrice);

      const tradeHash = await executeTrade(wethDifference > 0, tradeAmount);
      console.log("Rebalance Transaction:", tradeHash);

      // make sure current quantites is close to 100% WETH with 5% tolerance
      const { weth: wethQuantityNew, usdc: usdcQuantitynew } =
        await getCurrentQuantities();

      console.log(
        `New WETH Quantity: ${wethQuantityNew} WETH`,
        `New USDC Quantity: ${usdcQuantitynew} USDC`
      );
      // find total value and then find the percentage of weth
      const wethValueNew = wethQuantityNew * ethPrice;
      const totalValuenew = await getTotalPortfolioValue(
        wethValueNew,
        usdcQuantitynew,
        ethPrice
      );
      const wethPercentageNew = (wethValueNew / totalValuenew) * 100;
      expect(wethPercentageNew).to.be.closeTo(100, 5);
    });
    // Check the rebalancing need based on trend score.
    it("should rebalance when trend score equals 1", async function () {
      // ... your code for the trend score = 1 case
    });

    it("should not rebalance when trend score is below a certain threshold", async function () {
      // Set a trend score below your rebalancing threshold.
      // Ensure no rebalancing action is taken.
      // ...
    });

    it("should handle low WETH or USDC quantities gracefully", async function () {
      // Set very low token balances and initiate rebalancing.
      // Check if the logic can handle such cases without issues.
      // ...
    });

    it("should abort rebalancing if oracle fails to provide ETH price", async function () {});

    it("should revert rebalancing if tradeModule fails", async function () {});

    it("should consume acceptable gas amounts during rebalancing", async function () {});
  });
});
