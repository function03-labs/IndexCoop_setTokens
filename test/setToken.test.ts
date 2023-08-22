import { ethers, waffle } from "hardhat";
import { Contract, Signer } from "ethers";
import { expect } from "chai";
import { SetToken } from "../contracts/setToken.sol";
import fs from "fs";
import path from "path";
describe("SetToken Contract", function () {
  let accounts: Signer[];
  let setToken: Contract;

  beforeEach(async function () {
    accounts = await ethers.getSigners();

    // Read the address from the JSON file
    const addresses = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "..", "deployedAddresses.json"),
        "utf-8"
      )
    );
    const setTokenAddress = addresses.setTokenAddress;

    // If you're testing the mainnet version, you can connect directly:
    setToken = await ethers.getContractAt(
      "ISetToken",
      setTokenAddress,
      accounts[0]
    );
  });

  it("should retrieve the manager address", async function () {
    const manager = await setToken.manager();
    console.log("Manager Address:", manager);
    expect(manager).to.be.equal(await accounts[0].getAddress());
  });
  it("should retrieve and log the enabled modules", async function () {
    const modules = await setToken.getModules();
    console.log("Enabled Modules:", modules);
    expect(modules).to.be.an("array");
  });

  it("should retrieve and log the positions", async function () {
    const positions = await setToken.getPositions();
    console.log("Positions:", positions);
    expect(positions).to.be.an("array");
  });

  it("should retrieve and log the components", async function () {
    const components = await setToken.getComponents();
    console.log("Components:", components);
    expect(components).to.be.an("array");
  });

  it("should retrieve and log the default position real unit for WETH", async function () {
    const wethRealUnit = await setToken.getDefaultPositionRealUnit(
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    );
    console.log(
      "WETH Default Position Real Unit:",
      wethRealUnit.toString() / 1e18
    );
    // usdc
    const usdcRealUnit = await setToken.getDefaultPositionRealUnit(
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
    );
    console.log(
      "USDC Default Position Real Unit:",
      usdcRealUnit.toString() / 1e6
    );
  });
  it("should retrieve and log the external position real unit for WETH", async function () {
    const wethExternalUnit = await setToken.getExternalPositionRealUnit(
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      "0xFaAB3F8f3678f68AA0d307B66e71b636F82C28BF"
    );
    console.log(
      "WETH External Position Real Unit:",
      wethExternalUnit.toString() / 1e18
    );
    // usdc
    const usdcExternalUnit = await setToken.getExternalPositionRealUnit(
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "0xFaAB3F8f3678f68AA0d307B66e71b636F82C28BF"
    );
    console.log(
      "USDC External Position Real Unit:",
      usdcExternalUnit.toString() / 1e6
    );

    // expect(wethExternalUnit).to.exist;
  });

  it("should retrieve and log the total component real units for WETH", async function () {
    const wethTotalRealUnits = await setToken.getTotalComponentRealUnits(
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    );
    console.log(
      "WETH Total Component Real Units:",
      wethTotalRealUnits.toString() / 1e18
    );
    const usdcTotalRealUnits = await setToken.getTotalComponentRealUnits(
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
    );
    console.log(
      "USDC Total Component Real Units:",
      usdcTotalRealUnits.toString() / 1e6
    );
    // expect(wethTotalRealUnits).to.exist;
  });
  //display the total supply of the set token
  it("should retrieve and log the total supply of the set token", async function () {
    const totalSupply = await setToken.totalSupply();
    console.log("Total Supply:", totalSupply.toString() / 1e18);
    // expect(wethTotalRealUnits).to.exist;
  });

  //should display own portfolio of those tokens
  it("should retrieve and log the balance of the set token", async function () {
    const balance = await setToken.balanceOf(await accounts[0].getAddress());
    console.log("Balance:", balance.toString() / 1e18);
    // expect(wethTotalRealUnits).to.exist;
  });
});
