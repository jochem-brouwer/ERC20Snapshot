pragma solidity ^0.5.0;

import "./ERC20.sol";
import "./MerkleTree.sol";

/// @title ERC20 snapshot contract
/// @author Jochem Brouwer
/// @notice This contract is not audited
/// @dev ERC20 snapshot to setup a copy of any ERC20 token where the snapshot is taken at a certain block. 
/// A Merkle Tree is used to prove that an address had a certain balance.
/// This removes almost all gas cost of the deployer (since the deployer does not pay for setting up new balances)
/// Users pay for this instead.

contract ERC20Snapshot is ERC20 {
    
    bytes32 public rootHash;
    
    mapping(address => bool) claimed;
    
    /** @dev Contract constructor
      * @param _rootHash The bytes32 rootHash of the Merkle Tree
      * @param _cap The token supply cap
      * @param _name The name of the token 
      * @param _symbol The symbol of the token
      * @param _decimals The decimals of the token
      */
    constructor(bytes32 _rootHash, uint _cap, string memory _name, string memory _symbol, uint _decimals) 
        ERC20(_cap, _name, _symbol, _decimals)
        public 
    { 
        rootHash = _rootHash;
        _balances[msg.sender] = 0;
    }
    
    function hash(address target, uint balance) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(target,balance));
    }

    function claim(address target, uint balance, bytes32[] calldata hashes) external {
        bytes32 myHash = hash(target, balance);
        if (hashes.length == 1) {
            require(hashes[0] == myHash);
        } else {
            require(hashes[0] == myHash || hashes[1] == myHash);
        }
        require(MerkleTree.InTree(rootHash, hashes));
        require(!claimed[target]);
        claimed[target] = true;
        
        _balances[target] = balance;
        emit Transfer(address(0x0), target, balance);
    }

}