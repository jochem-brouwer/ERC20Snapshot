const Web3 = require('web3')

class MerkleTree {

  constructor(web3){
    this.web3 = web3;
  }

  createProof(hashList, interestedIn) {
    let output = {
      hashRight: [],
      hashes: [],
    }

    if (hashList.length == 1){
      output.hashRight[0] = false;
      output.hashes[0] = hashList[0];
      return output;
    }

    let tempList = hashList;
    let Web3 = this.web3;
    let currentInterest = interestedIn;

    let List = [hashList];

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

          if (data == interestedIn) {
            output.hashRight.push(true);
            output.hashes.push(data2);
            if (output.hashes.length == 1){
              output.hashRight.push(false);
              output.hashes.push(data);
            }
            interestedIn = hash;
          } else if (data2 == interestedIn) {
            output.hashRight.push(false);
            output.hashes.push(data);
            if (output.hashes.length == 1){
              output.hashRight.push(true);
              output.hashes.push(data2);
            }
            interestedIn = hash;
          }

        } else {
          let toHash = Web3.eth.abi.encodeParameters(['bytes32','bytes32'], [data, data] )
          hash = Web3.utils.soliditySha3(data);
          if (data == interestedIn) {
            output.hashRight.push(false);
            output.hashes.push(data);
            if (output.hashes.length == 1){
              output.hashRight.push(false);
              output.hashes.push(data);
            }
            interestedIn = hash;
          }
        }

        Tree.push(hash);
      }

      tempList = Tree;
      List.push(tempList);
  
      if (Tree.length == 1){
        break;
      }
    }

    console.log(List)

    return output;
  }

  getHash(address, balance){
    return this.web3.utils.soliditySha3(this.web3.eth.abi.encodeParameters(['address', 'uint'], [address, balance]));
  }

  getRoot(list) {
    let tempList = list;
    if (list.length == 1){
      return list[0];
    }
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