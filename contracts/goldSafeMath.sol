    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;

    import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
    import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
    import "@openzeppelin/contracts/utils/math/SafeMath.sol"; // Import SafeMath

    contract GoldToken is ERC20 {
        using SafeMath for uint256; // Use SafeMath for uint256

        AggregatorV3Interface internal goldUsdFeed;
        AggregatorV3Interface internal ethUsdFeed;
        address public owner;

        constructor() ERC20("Gold Token", "GLD") {
            goldUsdFeed = AggregatorV3Interface(0xC5981F461d74c46eB4b0CF3f4Ec79f025573B0Ea);
            ethUsdFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
            owner = msg.sender;
        }

        function getLatestGoldPrice() public view returns (uint256) {
            (,int goldUsdPrice,,,) = goldUsdFeed.latestRoundData();
            (,int ethUsdPrice,,,) = ethUsdFeed.latestRoundData();

            return uint256(goldUsdPrice).mul(10**18).div(uint256(ethUsdPrice)); // Use SafeMath
        }

        function getLatestGoldUsdPrice() public view returns (uint256) {
            (,int goldUsdPrice,,,) = goldUsdFeed.latestRoundData();

            return uint256(goldUsdPrice);
        }

        function getLatestEthUsdPrice() public view returns (uint256) {
            (,int ethUsdPrice,,,) = ethUsdFeed.latestRoundData();

            return uint256(ethUsdPrice);
        }

        function calculateGoldTokenAmount(uint256 _sepoliaEthAmount) public view returns (uint256) {
            uint256 goldPrice = getLatestGoldPrice();
            return _sepoliaEthAmount.mul(10**18).div(goldPrice); // Use SafeMath
        }

        function buyGoldTokens() public payable {
            uint256 goldTokens = calculateGoldTokenAmount(msg.value);

            // Mint gold tokens
            _mint(msg.sender, goldTokens);
        }

        function mint(address to, uint256 _amount) public {
            require(msg.sender == owner, "Only the owner can mint tokens");
            _mint(to, _amount);
        }

        function contractBalance() public view returns(uint256){
            return address(this).balance;
        }

        function calculateSellGoldToken(uint256 _goldTokenAmount) public view returns (uint256) {
            uint256 goldPrice = getLatestGoldPrice();
            return _goldTokenAmount.mul(goldPrice).div(10**18); // Use SafeMath
        }

        function sellGoldToken(uint256 _goldTokenAmount) public payable {
            uint256 goldPrice = getLatestGoldPrice();
            uint256 ethAmount = _goldTokenAmount.mul(goldPrice).div(10**18); // Use SafeMath

            // Check contract has enough balance
            require(address(this).balance >= ethAmount, "Not enough ETH in contract to do sell");

            // Burn the tokens from the sender
            _burn(msg.sender, _goldTokenAmount);

            payable(msg.sender).transfer(ethAmount);
        }
    }
