const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PredictionMarket", function () {
  let market;
  let owner, creator, alice, bob;

  beforeEach(async function () {
    // Get test accounts
    [owner, creator, alice, bob] = await ethers.getSigners();

    // Deploy a fresh contract instance before each test
    const PM = await ethers.getContractFactory("PredictionMarket");
    market = await PM.deploy();
    await market.waitForDeployment();
  });

  describe("createMarket()", function() {
    it("should deploy and have correct owner", async function () {
      expect(await market.owner()).to.equal(owner.address);
    });
    it("emits MarketCreated and sets up all market fields", async function () {
      // Dummy parameters
      const asset = ethers.encodeBytes32String("ETHUSDT");
      const referencePrice = ethers.parseUnits("2000", 8);
      const question = "Will ETH be >= $2000 in 1h?";
      const now = (await ethers.provider.getBlock("latest")).timestamp;
      const endTime = now + 3600;

      // Act: Call createMarket and capture the receipt
      await expect(market.connect(creator).createMarket(
        asset, referencePrice, question, endTime
      ))
        .to.emit(market, "MarketCreated")
        .withArgs(
          0,
          creator.address,
          asset,
          referencePrice,
          question,
          endTime
        );

  // Assert: getMarket(0) returns exactly what we passed + defaults
  const m = await market.getMarket(0);
  expect(m.creator).to.equal(creator.address);
  expect(m.asset).to.equal(asset);
  expect(m.referencePrice).to.equal(referencePrice);
  expect(m.question).to.equal(question);
  expect(m.endTime).to.equal(endTime);
  expect(m.outcome).to.equal(0);
  expect(m.resolved).to.be.false;
  expect(m.totalUp).to.equal(0);
  expect(m.totalDown).to.equal(0);
  expect(m.creatorCommission).to.equal(0);
    });
  });

  describe("buyShares()", function () {
    let asset, referencePrice, question, endTime;

    beforeEach(async function () {
      // Create a market
      asset = ethers.encodeBytes32String("ETHUSDT");
      referencePrice = ethers.parseUnits("2000", 8);
      question = "ETH >= $2000 in 1h?";
      const now = (await ethers.provider.getBlock("latest")).timestamp;
      endTime = now + 3600;
      await market.createMarket(asset, referencePrice, question, endTime);
    });

    it("accepts a valid Up-side bet, splits fees, and updates pools", async function () {
      // Arrange
      const stake = ethers.parseEther("1.0");
      const entryBP = await market.ENTRY_FEE_BP();
      const creatorBP = await market.CREATOR_FEE_BP();
      const expectedFee = (stake * entryBP) / 10000n;
      const expectedCFee = (stake * creatorBP) / 10000n;
      const netStake = stake - expectedFee - expectedCFee;

      // Act and Assert Event
      await expect(
        market.connect(alice).buyShares(0, 1 /* Outcome.Up */, { value: stake })
      )
        .to.emit(market, "SharesPurchased")
        .withArgs(0, alice.address, 1, netStake);

      //Check platformCommission and creatorCommission
      const platformComm = await market.platformCommission();
      expect(platformComm).to.equal(expectedFee);

      const m = await market.getMarket(0);
      expect(m.creatorCommission).to.equal(expectedCFee);

      // Verify pools and user stake
      expect(m.totalUp).to.equal(netStake);
      const [upStake, downStake, hasClaimed] = await market.getUserInfo(0, alice.address);
      expect(upStake).to.equal(netStake);
      expect(downStake).to.equal(0n);
      expect(hasClaimed).to.be.false;
    });

    it("reverts when stake is below MIN_STAKE", async function () {
      const tinyStake = ethers.parseEther("0.001");
      await expect(
        market.connect(bob).buyShares(0, 1, { value: tinyStake })
      ).to.be.revertedWith("Bet below minimum stake");
    });

    it("reverts when the market ID does not exist", async function () {
      const stake = ethers.parseEther("1.0");
      await expect(
        market.connect(alice).buyShares(999, 2, { value: stake })
      ).to.be.revertedWith("Market does not exist");
    });
  })

  describe("resolveMarket()", function () {
    let asset, referencePrice, question, endTime;

    beforeEach(async function () {
      // Create a market as owner
      asset = ethers.encodeBytes32String("ETHUSDT");
      referencePrice = ethers.parseUnits("2000", 8);
      question = "ETH >= $2000 in 1h?";
      const nowBlock = await ethers.provider.getBlock("latest");
      const now = nowBlock.timestamp;
      endTime = now + 3600;
      await market.createMarket(asset, referencePrice, question, endTime);

      // Fast Forward time past endTime
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine", []);
    });

    it("resolves to Up when finalPrice >= referencePrice",
      async function () {
        const priceUp = referencePrice + 1n;
        await expect(
          market.resolveMarket(0, priceUp)
        )
          .to.emit(market, "MarketResolved")
          .withArgs(0, 1, /* Outcome.Up */ priceUp);
        const m = await market.getMarket(0);
        expect(m.resolved).to.be.true;
        expect(m.outcome).to.equal(1); // Up
      });

    it("resolves to Down when finalPrice < referencePrice",
      async function () {
        const priceDown = referencePrice - 1n;
        await expect(
          market.resolveMarket(0, priceDown)
        )
          .to.emit(market, "MarketResolved")
          .withArgs(0, 2, priceDown);

        const m = await market.getMarket(0);
        expect(m.resolved).to.be.true;
        expect(m.outcome).to.equal(2); // Down
      });
    it("resolves to Up when finalPrice equals referencePrice",
      async function () {
        const priceEqual = referencePrice;
        await expect(
          market.resolveMarket(0, priceEqual)
        )
          .to.emit(market, "MarketResolved")
          .withArgs(0, 1, priceEqual);

        const m = await market.getMarket(0);
        expect(m.resolved).to.be.true;
        expect(m.outcome).to.equal(1); // Up on tie
    });
  });
});