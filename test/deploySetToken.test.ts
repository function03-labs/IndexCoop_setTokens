import { ethers, waffle } from "hardhat";
import { Contract, Signer } from "ethers";
import { expect } from "chai";
import { createSetToken } from "../scripts/createSetToken"; // Adjust the path accordingly

describe("SetTokenCreator", function () {
  let deployer: Signer;
  let txReceipt: any;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    txReceipt = await createSetToken();
  });

  it("Should create a SetToken", async function () {
    console.log("============================================");
    console.log("Account being used:", await deployer.getAddress());
    console.log(
      "Account balance:",
      ethers.utils.formatEther(await deployer.getBalance()),
      "ETH"
    );
    console.log("============================================");
    const logs = txReceipt.events;
    if (!logs || logs.length === 0) {
      throw new Error("No logs found!");
    }

    const setTokenCreatedEvent = logs.find(
      (e: any) => e.event === "SetTokenCreated"
    );
    if (!setTokenCreatedEvent) {
      throw new Error("SetTokenCreated event not found!");
    }

    const setTokenAddress = setTokenCreatedEvent.args._setToken;
    console.log("SetToken Address:", setTokenAddress);

    expect(setTokenAddress).to.be.properAddress;
  });
});
