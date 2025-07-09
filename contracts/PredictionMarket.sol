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

  /// @dev Set deployer as owner
  constructor() {
    owner = msg.sender;
  }

  enum Outcome { Unresolved, Up, Down }
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
  uint256 public constant MIN_STAKE = 0.01 ether; // Minimum bet amount

  /// @notice Emitted when shares are purchased in a market
  event SharesPurchased(uint256 indexed marketId, address indexed user, Outcome side, uint256 amount);

  /// @notice Place a bet on the market (either Up or Down)
  /// @param marketId The ID of the market to bet on
  /// @param side The side to bet on (Up or Down)
  function buyShares(uint256 marketId, Outcome side)
  external payable {
    require(marketId < marketCount, "Market does not exist");
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
      m.UpStake[msg.sender] += netStake;
    } else {
      m.totalDown += netStake;
      m.downStakes[msg.sender] += netStake;
    }

    emit SharesPurchased(marketId, msg.sender, side, netStake);
  }
}