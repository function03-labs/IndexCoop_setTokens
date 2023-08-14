import { ethers, waffle } from "hardhat";
import { expect } from "chai";

const { loadFixture } = waffle;

describe("Debt Issuance Module v2", function() {
    let setToken: any;
    let debtIssuanceModule: any;
    let owner: any;
    // ... other necessary contracts or signers

    beforeEach(async function() {
        // Here, deploy or get instances of your necessary contracts
        // setToken = await ethers.getContractAt("SetToken", SET_TOKEN_ADDRESS);
        // debtIssuanceModule = await ethers.getContractAt("DebtIssuanceModuleV2", DEBT_ISSUANCE_MODULE_ADDRESS);
        // owner = await ethers.getSigner(0);
    });
