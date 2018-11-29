const Web3 = require('web3')
const ERC20 = require('../build/contracts/ERC20')
const ERC20Snapshot = require('../build/contracts/ERC20Snapshot')

const MerkleTree = require("./MerkleTree")

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class Snapshot {

  constructor(address, blockNumber, web3){
    this.target = address; // contract address
    this.blockNumber = blockNumber; // block number contract was deployed.
    this.web3 = web3;
    this.contract = new this.web3.eth.Contract(ERC20.abi, this.target);
    this.MerkleTree = new MerkleTree(web3);
    this.data = {};
  }

  setSnapshotContract(target) {
    this.snapshot = new this.web3.eth.Contract(ERC20Snapshot.abi, target);
  }

  async getAccountList(blockNumber) {
    let accountMap = {};

    await this.contract.getPastEvents("Transfer", {
      fromBlock: this.blockNumber,
      toBlock: blockNumber,
    }).then(function(evtData){
      let index;
      for (index in evtData) {
        let evt = evtData[index];
        accountMap[evt.returnValues.from] = true;
        accountMap[evt.returnValues.to] = true;
      }
    });

    let list = [];
    let key;

    for (key in accountMap) {
      list.push(key);
    }
    return list;
  }

  // returns a list account -> uint with balances of this account at a certain block 
  // this *could* also be retrieved from getAccountList by tracking all transfers 
  // but this assumes that initial balances (like minting) are also emitted as event
  // this is added for completeness.
  async getBalances(accountList, blockNumber){
    let index;
    let map = {};
    for (index in accountList) {
      let acc = accountList[index];
      let bal = await this.contract.methods.balanceOf(acc).call({}, blockNumber);
      map[acc] = bal;
    }
    return map;
  }

  getSortedAccounts(accountList) {
    let sorted = accountList.sort(function(account1, account2){
      if (account1.toLowerCase() < account2.toLowerCase()){
        return -1;
      } else {
        return 1;
      }
    })
    return sorted;
  }

  getHashList(sortedAccountList, balanceMap) {

    let hashList = [];
    let key;
    for (key in sortedAccountList){
      let account = sortedAccountList[key];
      let balance = balanceMap[account];
      let hash = this.MerkleTree.getHash(account, balance);
      hashList.push(hash);
    }
    return hashList;
  }

  async getRootHash(blockNumber) {
    await this.setupData(blockNumber)

    return this.data[blockNumber].merkleRoot;

  }

  async setupData(blockNumber) {
    if (this.data[blockNumber]){
      return;
    }
    let accountList = await this.getAccountList(blockNumber);
    let sorted =  this.getSortedAccounts(accountList);
    let balanceMap = await this.getBalances(sorted, blockNumber);
    let hashList = this.getHashList(sorted, balanceMap);
    let root = this.MerkleTree.getRoot(hashList);
    this.data[blockNumber] = {
      //accountList: accountList,
      sortedAccountList: sorted, 
      balanceMap: balanceMap, 
      hashList: hashList,
      merkleRoot: root
    }
  }

  async getClaimTX(blockNumber, account) {
    await this.setupData(blockNumber);
    let index;
    let data = this.data[blockNumber];
    for (key in data.sortedAccountList) {
      let acct = data.sortedAccountList[key];
      if (acct == account){
        index = key;
        break;
      }
    }

    let hashList = this.data[blockNumber].hashList;
   // console.log(account)
    let proof = (this.MerkleTree.createProof(hashList, hashList[index]))
    let balance = data.balanceMap[account];

    let bool = await this.snapshot.methods.checkProof(proof.hashes, proof.hashRight).call();
  //  console.log(bool);

    return this.snapshot.methods.claim(account, balance, proof.hashes, proof.hashRight);

  }

}

module.exports = Snapshot;