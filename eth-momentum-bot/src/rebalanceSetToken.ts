import { ethers } from "ethers";
import { wallet } from "./rebalancer";
import setTokenABI from "./abis/setToken.json";
import { tradeModuleAbi } from "./abis/tradeModule";

const setTokenAddress = "0x93e70429f3493e5584291093a61530485ff566de";
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"; // Placeholder, replace if needed
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // Placeholder, replace if needed
const TRADE_MODULE_ADDRESS = "0xFaAB3F8f3678f68AA0d307B66e71b636F82C28BF"; // Replace with actual TradeModule address

const provider = new ethers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_API_KEY}`
);

const tradeModuleContract = new ethers.Contract(
  TRADE_MODULE_ADDRESS,
  tradeModuleAbi,
  wallet
);

const setTokenContract = new ethers.Contract(
  setTokenAddress,
  setTokenABI,
  wallet
);

function getNewComposition(trendScore: number): [number, number] {
  if (trendScore === 1.0) {
    return [1, 0];
  } else if ([-0.5, 0, 0.5].includes(trendScore)) {
    return [0.5, 0.5];
  } else if (trendScore === 1) {
    return [0, 1];
  } else {
    return [0.5, 0.5]; // Default case
  }
}
async function rebalanceSetToken(trendScore: number): Promise<void> {
  const [usdcPercentage, wethPercentage] = getNewComposition(trendScore);

  // Convert percentages to quantities
  const totalSupply = await setTokenContract.totalSupply();
  const usdcQuantity = ethers.parseUnits(
    (totalSupply * (usdcPercentage / 100)).toString(),
    "8"
  ); // Adjust "usdcDecimals" to the correct number of decimals for USDC
  const wethQuantity = ethers.parseUnits(
    (totalSupply * (wethPercentage / 100)).toString(),
    "18"
  ); // Adjust "ethDecimals" to the correct number of decimals for WETH

  // Define trade parameters
  const exchangeName = "0X"; // Replace with the desired exchange name
  const minReceiveQuantity = 0; // Define a value or logic for minimum receive quantity if needed
  const data = ethers.hexlify(ethers.toUtf8Bytes("0x")); // Any additional data required for the trade

  // Execute trade based on the new composition
  if (usdcPercentage > wethPercentage) {
    // This means we're selling WETH to buy USDC
    const tx = await tradeModuleContract.trade(
      setTokenAddress,
      exchangeName,
      WETH_ADDRESS,
      wethQuantity,
      USDC_ADDRESS,
      minReceiveQuantity,
      data
    );
    await tx.wait();
  } else if (wethPercentage > usdcPercentage) {
    // This means we're selling USDC to buy WETH
    const tx = await tradeModuleContract.trade(
      setTokenAddress,
      exchangeName,
      USDC_ADDRESS,
      usdcQuantity,
      WETH_ADDRESS,
      minReceiveQuantity,
      data
    );
    await tx.wait();
  }
  // If both percentages are equal, no trade is required.
}

export default rebalanceSetToken;
