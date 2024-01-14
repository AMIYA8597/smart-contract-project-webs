const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GoldToken Contract", function () {
  let GoldToken;
  let goldToken;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    GoldToken = await ethers.getContractFactory("GoldToken");
    goldToken = await GoldToken.deploy();
    await goldToken.deployed();
  });

  it("Should have the correct name and symbol", async function () {
    expect(await goldToken.name()).to.equal("Gold Token");
    expect(await goldToken.symbol()).to.equal("GLD");
  });

  it("Should return the latest gold price", async function () {
    const goldPrice = await goldToken.getLatestGoldPrice();
    expect(goldPrice).to.be.a("number");
  });

  it("Should return the latest gold USD price", async function () {
    const goldUsdPrice = await goldToken.getLatestGoldUsdPrice();
    expect(goldUsdPrice).to.be.a("number");
  });

  it("Should return the latest ETH USD price", async function () {
    const ethUsdPrice = await goldToken.getLatestEthUsdPrice();
    expect(ethUsdPrice).to.be.a("number");
  });

  it("Should calculate the Gold Token amount correctly", async function () {
    const ethAmount = ethers.utils.parseEther("1");
    const goldTokenAmount = await goldToken.calculateGoldTokenAmount(ethAmount);
    expect(goldTokenAmount).to.be.a("number");
  });

  it("Should allow buying Gold Tokens", async function () {
    const ethAmount = ethers.utils.parseEther("1");
    await expect(() => goldToken.connect(addr1).buyGoldTokens({ value: ethAmount }))
      .to.changeEtherBalance(addr1, -ethAmount);
    expect(await goldToken.balanceOf(addr1.address)).to.be.gt(0);
  });

  it("Should allow the owner to mint tokens", async function () {
    const mintAmount = 100;
    await expect(() => goldToken.connect(owner).mint(addr1.address, mintAmount))
      .to.changeTokenBalance(goldToken, addr1, mintAmount);
  });

  it("Should not allow non-owner to mint tokens", async function () {
    const mintAmount = 100;
    await expect(goldToken.connect(addr1).mint(addr1.address, mintAmount))
      .to.be.revertedWith("Only the owner can mint tokens");
  });

  it("Should return the contract balance", async function () {
    const contractBalance = await goldToken.contractBalance();
    expect(contractBalance).to.be.a("number");
  });

  it("Should calculate the sell Gold Token amount correctly", async function () {
    const goldTokenAmount = 10;
    const sellAmount = await goldToken.calculateSellGoldToken(goldTokenAmount);
    expect(sellAmount).to.be.a("number");
  });

  it("Should allow selling Gold Tokens and receive ETH", async function () {
    const goldTokenAmount = 10;
    await goldToken.connect(addr1).buyGoldTokens({ value: ethers.utils.parseEther("1") });
    const initialBalance = await ethers.provider.getBalance(addr1.address);

    await expect(() => goldToken.connect(addr1).sellGoldToken(goldTokenAmount))
      .to.changeEtherBalance(addr1, initialBalance);

    expect(await goldToken.balanceOf(addr1.address)).to.be.lt(goldTokenAmount);
  });

  it("Should not allow selling more tokens than owned", async function () {
    const goldTokenAmount = 100;
    await goldToken.connect(addr1).buyGoldTokens({ value: ethers.utils.parseEther("1") });

    await expect(goldToken.connect(addr1).sellGoldToken(goldTokenAmount))
      .to.be.revertedWith("ERC20: burn amount exceeds balance");
  });

  it("Should not allow selling if contract balance is not enough", async function () {
    const goldTokenAmount = 10;
    await goldToken.connect(addr1).buyGoldTokens({ value: ethers.utils.parseEther("1") });

    // Set contract balance to be less than needed
    await goldToken.sendTransaction({ value: ethers.utils.parseEther("0.5") });

    await expect(goldToken.connect(addr1).sellGoldToken(goldTokenAmount))
      .to.be.revertedWith("Not enough ETH in contract to do sell");
  });
});
