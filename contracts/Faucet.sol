//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Faucet is ERC20, Ownable {

    uint8 private dec;      // decimals
    uint public backoff;    // backoff - min time before minting again
    uint256 public max;     // max amount of tokens to mint

    mapping(address => uint) private minters; 

    constructor(
        string memory _name, 
        string memory _symbol, 
        uint8 _decimals,
        uint _backoff,
        uint256 _max
    ) public ERC20(_name, _symbol) {
        dec = _decimals;
        max = _max;
        backoff = _backoff;
    }
	
    modifier backOff {
        uint then = minters[msg.sender];
        require((block.timestamp - then) > backoff, 'err-backoff');
        _;
    }

    function mint(uint256 value) external backOff {
        require(value <= max, 'err-max');
        _mint(msg.sender, value);
        minters[msg.sender] = block.timestamp;
    }

    function lastMint(address _address) public view returns(uint) {
        return minters[_address];
    }

    function updateBackoff(uint _value) external onlyOwner {
        backoff = _value;
    }

    function updateMax(uint _value) external onlyOwner {
        max = _value;
    }

    function decimals() public view override returns (uint8) {
		return dec;
	}
}
