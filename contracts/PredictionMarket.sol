// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/"
contract PredictionMarket {
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
  mapping(uint256 => Market) public markets;
  uint256 public marketCount;
  uint256 public platformCommission;
  // TODO: Add functions below
}