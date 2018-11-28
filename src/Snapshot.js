const Web3 = require('web3')
const ERC20 = require('../build/contracts/ERC20')

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class Snapshot {

  constructor(address, blockNumber, web3){
    this.target = address; // contract address
    this.blockNumber = blockNumber; // block number contract was deployed.
    this.web3 = web3;
    this.contract = new this.web3.eth.Contract(ERC20.abi, this.target);
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

  async getRootHash(blockNumber) {
    let accountList = await this.getAccountList(blockNumber);
    console.log(await this.getBalances(accountList, blockNumber))
  }

}

module.exports = Snapshot;