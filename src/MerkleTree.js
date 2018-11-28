const Web3 = require('web3')

class MerkleTree {

  constructor(web3){
    this.web3 = web3;
  }

  getRoot(list) {
    let tempList = list;
    let Web3 = this.web3;
    while (true) {
      let Tree = [];
      let key;
      for (key = 0; key < tempList.length; key += 2){
        let data = Web3.eth.abi.encodeParameters(['bytes32'], [tempList[key]]);
        let hash;
        if (tempList[key+1]) {
          let data2 = Web3.eth.abi.encodeParameters(['bytes32'], [tempList[key+1]]);
          let toHash = Web3.eth.abi.encodeParameters(['bytes32','bytes32'], [data, data2] )
          hash = Web3.utils.soliditySha3(toHash);        
        } else {
          hash = Web3.utils.soliditySha3(data);
        }

        Tree.push(hash);
      }

      tempList = Tree;
  
      if (Tree.length == 1){
        return Tree[0];
      }
    }

  }

}

module.exports = MerkleTree;