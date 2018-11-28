pragma solidity ^0.5.0;

library MerkleTree {
    
    /** @dev Function to return true if a TargetHash was part of a tree
      * @param RootHash the root hash of the tree
      * @param HashTree The array of the hash items. The first is hashed with the second, the second with the third, etc.
      * @return A boolean wether `TargetHash` is part of the Merkle Tree with root hash `RootHash`. True if it is part of this tree, false if not. 
      */
    function InTree(bytes32 RootHash, bytes32[] memory HashTree) internal pure returns (bool) {
        bytes32 CHash = HashTree[0];
        uint len = HashTree.length;
        for (uint i=1; i < len; i++) {
            CHash = keccak256(abi.encodePacked(CHash, HashTree[i]));
        }
        return (CHash == RootHash);
    }
}

contract MerkleTreeUtils {
    function GetRootHash(bytes32[] memory Inputs) public pure returns (bytes32) {
        uint len = Inputs.length;
        
        if (len == 1) {
            return Inputs[0];
        }
        
        bytes32[] memory CurrentTree = new bytes32[](len/2 + (len) % 2);
        
        uint index = 0;
        uint maxIndex = len - 1;
        
        bool readInputs = true;
        bytes32 newHash;
        bytes32 hash1;
        
        while (true) {
            
            if (readInputs) {
                hash1 = Inputs[index];
                if (index + 1 > maxIndex){
                    newHash = keccak256(abi.encodePacked(hash1));
                }
                else {
                    newHash = keccak256(abi.encodePacked(hash1,Inputs[index+1]));
                }
                
            }
            else {
                hash1 = CurrentTree[index];
                if (index + 1 > maxIndex){
                    newHash = keccak256(abi.encodePacked(hash1));
                }
                else {
                    newHash = keccak256(abi.encodePacked(hash1,CurrentTree[index+1]));
                }             
            }
            
            CurrentTree[index/2] = newHash;
            
            index += 2;
            if (index > maxIndex) {
                maxIndex = (index - 2) / 2;
                if (maxIndex == 0) {
                    break;
                }
                index = 0;
                readInputs = false;
            }
        }
        return CurrentTree[0];
    }
}