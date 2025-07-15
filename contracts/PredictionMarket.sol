// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract PredictionMarket {

  // Owner for admin-only functions
  address public owner;

  /// @dev Restricts function to contract owner
  modifier onlyOwner() {
    require(msg.sender == owner, "Only Owner");
    _;
  }

  /// @dev Reverts if the given marketId has not been created
  modifier marketExists(uint256 marketId) {
    require(marketId < marketCount, "Market does not exist");
    _;
  }
  /// @dev Set deployer as owner
  constructor() {
    owner = msg.sender;
  }

  enum Outcome { Unresolved, Up, Down }

      /// @notice Emitted when shares are purchased in a market
  event SharesPurchased(uint256 indexed marketId, address indexed user, Outcome side, uint256 amount);

  /// @notice Emitted when a market is resolved
  event MarketResolved(uint256 indexed marketId, Outcome outcome, uint256 finalPrice);

  /// @notice Emitted when a new market is created
  event MarketCreated(
    uint256 indexed marketId,
    address indexed creator,
    bytes32 asset,
    uint256 referencePrice,
    string question,
    uint256 endTime
  );

  /// @notice Emitted when a winner claims payout
  event WinningsClaimed(uint256 indexed marketId, address indexed winner, uint256 payout);

  /// @notice Emitted when a market creator withdraws their commission
  event CommissionWithdrawn(uint256 indexed marketId, address indexed creator, uint256 amount);

  /// @notice Emitted when the platform owner withdraws accrued platform fees
  event PlatformFeesWithdrawn(address indexed owner, uint256 amount);

  struct Market {
    address creator;
    bytes32 asset;
    uint256 referencePrice;
    string question;
    uint256 endTime;
    Outcome outcome;
    bool resolved;
    uint256 totalUp;
    uint256 totalDown;
    mapping(address => uint256) upStakes;
    mapping(address => uint256) downStakes;
    mapping(address => bool) claimed;
    uint256 creatorCommission;
  }
  mapping(uint256 => Market) private markets;
  uint256 public marketCount;
  uint256 public platformCommission;

  /// @notice Create a new prediction market
  /// @param asset Asset identifier (e.g., token address)
  /// @param referencePrice Price at market creation
  /// @param question Market question
  /// @param endTime Market end time (timestamp)
  function createMarket(
    bytes32 asset,
    uint256 referencePrice,
    string calldata question,
    uint256 endTime
  ) external returns (uint256 marketId) {
    require(endTime > block.timestamp, "End time must be in the future");
    marketId = marketCount++;
    Market storage m = markets[marketId];
    m.creator = msg.sender;
    m.asset = asset;
    m.referencePrice = referencePrice;
    m.question = question;
    m.endTime = endTime;
    m.outcome = Outcome.Unresolved;
    m.resolved = false;
    m.creatorCommission = 0;
    emit MarketCreated(marketId, msg.sender, asset, referencePrice, question, endTime);
  }

  uint256 public constant ENTRY_FEE_BP = 50; // 0.5% entry fee
  uint256 public constant CREATOR_FEE_BP = 50; // 0.5% creator fee
  uint256 public constant WITHDRAW_FEE_BP = 200; // 2% withdrawal fee
  uint256 public constant MIN_STAKE = 0.01 ether; // Minimum bet amount

  /// @notice Place a bet on the market (either Up or Down)
  /// @param marketId The ID of the market to bet on
  /// @param side The side to bet on (Up or Down)
  function buyShares(uint256 marketId, Outcome side)
  external payable marketExists(marketId) {
    Market storage m = markets[marketId];
    require(block.timestamp < m.endTime, "Market closed");
    require(side == Outcome.Up || side == Outcome.Down, "Invalid side");
    require(msg.value >= MIN_STAKE, "Bet below minimum stake");

    // Calculate fees in basis points
    uint256 entryFee = (msg.value * ENTRY_FEE_BP) / 10000;
    uint256 creatorFee = (msg.value * CREATOR_FEE_BP) / 10000;
    uint256 netStake = msg.value - entryFee - creatorFee;

    // Accrue fees
    platformCommission += entryFee;
    m.creatorCommission += creatorFee;

    // Update pool and user stakes
    if (side == Outcome.Up) {
      m.totalUp += netStake;
      m.upStakes[msg.sender] += netStake;
    } else {
      m.totalDown += netStake;
      m.downStakes[msg.sender] += netStake;
    }

    emit SharesPurchased(marketId, msg.sender, side, netStake);
  }

  /// @notice Resolve a market by providing the final price
  /// @param marketId The ID of the market to resolve
  /// @param finalPrice The final price of the asset at market resolution
  function resolveMarket(uint256 marketId, uint256 finalPrice)
  external onlyOwner marketExists(marketId) {
    Market storage m = markets[marketId];
    require(block.timestamp >= m.endTime, "Market not ended");
    require(!m.resolved, "Market already resolved");

    // Determine and store Outcome
    if (finalPrice > m.referencePrice) {
      m.outcome = Outcome.Up;
    } else {
      m.outcome = Outcome.Down;
    }
    m.resolved = true;

    emit MarketResolved(marketId, m.outcome, finalPrice);
  }

  function claimWinnings(uint256 marketId)
  external marketExists(marketId) {
    Market storage m = markets[marketId];
    require(m.resolved, "Market not resolved");

    // Determine stake and total for the winning side
    uint256 userStake;
    uint256 winnersPool;
    uint256 losersPool;
    if (m.outcome == Outcome.Up) {
      userStake = m.upStakes[msg.sender];
      winnersPool = m.totalUp;
      losersPool = m.totalDown;
    } else {
      userStake = m.downStakes[msg.sender];
      winnersPool = m.totalDown;
      losersPool = m.totalUp;
    }

    require(userStake > 0, "No winning stake");
    require(!m.claimed[msg.sender], "Already claimed");
    require(winnersPool > 0, "No winners to pay");
    m.claimed[msg.sender] = true;

    // Compute gross payout: original stake + share of losers losersPool
    uint256 grossPayout = userStake + (userStake * losersPool) / winnersPool;

    // Deduct withdrawal fee
    uint256 withdrawalFee = (grossPayout * WITHDRAW_FEE_BP) / 10000;
    platformCommission += withdrawalFee;
    uint256 netPayout = grossPayout - withdrawalFee;

    // Transfer Winnings
    payable(msg.sender).transfer(netPayout);

    emit WinningsClaimed(marketId, msg.sender, netPayout);
  }

  /// @notice Withdraw accrued commision for the market creator
  function withdrawCommission(uint256 marketId)
  external marketExists(marketId) {
    Market storage m = markets[marketId];
    require(msg.sender == m.creator, "Not market creator");
    uint256 amount = m.creatorCommission;
    require(amount > 0, "No commission");
    m.creatorCommission = 0;
    payable(msg.sender).transfer(amount);
    emit CommissionWithdrawn(marketId, msg.sender, amount);
  }

  /// @notice Withdraw all accrued platform fees to the contract owner
  function withdrawPlatformFees() external onlyOwner {
    uint256 amount = platformCommission;
    require(amount > 0, "No Platform fees");
    platformCommission = 0;
    payable(owner).transfer(amount);
    emit PlatformFeesWithdrawn(owner, amount);
  }

  /// @notice Returns public details for a given market
  function getMarket(uint256 marketId)
  external
  view
  marketExists(marketId)
  returns (
    address creator,
    bytes32 asset,
    uint256 referencePrice,
    string memory question,
    uint256 endTime,
    Outcome outcome,
    bool resolved,
    uint256 totalUp,
    uint256 totalDown,
    uint256 creatorCommission
  )
  {
    Market storage m = markets[marketId];
    return (
      m.creator,
      m.asset,
      m.referencePrice,
      m.question,
      m.endTime,
      m.outcome,
      m.resolved,
      m.totalUp,
      m.totalDown,
      m.creatorCommission
    );
  }

  /// @notice Returns a user's stake and claim status for a market
  function getUserInfo(uint256 marketId, address user)
    external
    view
    marketExists(marketId)
    returns (
      uint256 upStake,
      uint256 downStake,
      bool hasClaimed
    )
  {
    Market storage m = markets[marketId];
    upStake = m.upStakes[user];
    downStake = m.downStakes[user];
    hasClaimed = m.claimed[user];
    return (upStake, downStake, hasClaimed);
  }
}