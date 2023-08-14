import { ethers, waffle } from "hardhat";
import { Contract, Signer } from "ethers";
import { expect } from "chai";
import { SetToken } from "../contracts/setToken.sol";

describe("SetToken Contract", function () {
  let accounts: Signer[];
  let setToken: Contract;

  beforeEach(async function () {
    accounts = await ethers.getSigners();

    // If you have a local version of the SetToken contract, you can deploy it using:
    // const SetTokenFactory = await ethers.getContractFactory("SetToken");
    // setToken = await SetTokenFactory.deploy(/* constructor arguments */);

    // If you're testing the mainnet version, you can connect directly:
    setToken = await ethers.getContractAt(
      "ISetToken",
      "0x93e70429f3493e5584291093a61530485ff566de",
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
    console.log("WETH Default Position Real Unit:", wethRealUnit.toString());
  });
  it("should retrieve and log the external position real unit for WETH", async function () {
    const wethExternalUnit = await setToken.getExternalPositionRealUnit(
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      "0xFaAB3F8f3678f68AA0d307B66e71b636F82C28BF"
    );
    console.log(
      "WETH External Position Real Unit:",
      wethExternalUnit.toString()
    );
    // expect(wethExternalUnit).to.exist;
  });

  it("should retrieve and log the total component real units for WETH", async function () {
    const wethTotalRealUnits = await setToken.getTotalComponentRealUnits(
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    );
    console.log(
      "WETH Total Component Real Units:",
      wethTotalRealUnits.toString()
    );
    // expect(wethTotalRealUnits).to.exist;
  });
});
