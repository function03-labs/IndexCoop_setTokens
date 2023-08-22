// src/rebalancer.ts

import { ethers } from "ethers";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const INFURA_API_KEY = process.env.INFURA_API_KEY!;
const COINDESK_API_ENDPOINT = process.env.COINDESK_API_ENDPOINT!;

const provider = new ethers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_API_KEY}`
);
export const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

async function fetchTrendScore(): Promise<number | null> {
  try {
    const response = await axios.get(COINDESK_API_ENDPOINT);
    return response.data.trend_score; // Adjust this based on actual API response structure
  } catch (error) {
    console.error("Error fetching trend score:", error);
    return null;
  }
}
function getNewComposition(trendScore: number): [string, string] {
  if (trendScore === 1.0) {
    return ["100%", "0%"];
  } else if ([-0.5, 0, 0.5].includes(trendScore)) {
    return ["50%", "50%"];
  } else if (trendScore === 1) {
    return ["0%", "100%"];
  } else {
    return ["50%", "50%"]; // Default case
  }
}

async function rebalance(): Promise<void> {
  const trendScore = await fetchTrendScore();

  if (trendScore === null) return;

  const [wethPercentage, usdcPercentage] = getNewComposition(trendScore);
  await rebalanceSetToken(wethPercentage, usdcPercentage);
}

// Execute the rebalancing logic
rebalance();
