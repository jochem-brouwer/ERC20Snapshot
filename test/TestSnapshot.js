const Web3 = require('web3')
const BigNumber = require('bignumber.js')
const assert = require('chai').assert

const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'))

const ERC20 = require("../build/contracts/ERC20")
const ERC20Snapshot = require("../build/contracts/ERC20Snapshot")

const MerkleTreeJS = require("../src/MerkleTree")
const MerkleTree = new MerkleTreeJS(web3);
const Snapshot = require("../src/Snapshot")

describe('Snapshot', function () {

  let ERC20Contract;
  let ERC20SnapshotContract;
  let accounts;
  let Snap;

  let erc20gas;

  beforeEach(async () => {
    accounts =  await web3.eth.getAccounts();

    let ctr = new web3.eth.Contract(ERC20.abi);
    let receipt
    let tx = await ctr.deploy({
      data: ERC20.bytecode,
      arguments: [(100e18).toString(), "TestToken", "TT", 18]
    }).send({
      from: accounts[0],
      gas: 4000000,
    }).on("receipt", function(rcpt){
      receipt = rcpt;
    });

    ERC20Contract = new web3.eth.Contract(ERC20.abi, receipt.contractAddress);
    Snap = new Snapshot(receipt.contractAddress, receipt.blockNumber, web3)

    erc20gas = receipt.gasUsed;

  })

  it('should work', async() => {

    await ERC20Contract.methods.transfer(accounts[1], (10e18).toString()).send({from: accounts[0]});
    await ERC20Contract.methods.transfer(accounts[2], (20e18).toString()).send({from: accounts[0]});
    await ERC20Contract.methods.transfer(accounts[3], (5e18).toString()).send({from: accounts[0]});
    await ERC20Contract.methods.transfer(accounts[4], (15e18).toString()).send({from: accounts[0]});

    let blockN = await web3.eth.getBlockNumber();
    let root = await Snap.getRootHash(blockN);

    await Snap.setupData(blockN);

    let hashList = Snap.data[blockN].hashList;

    

    let ctr = new web3.eth.Contract(ERC20Snapshot.abi);
    let receipt
    let tx = await ctr.deploy({
      data: ERC20Snapshot.bytecode,
      arguments: [root, (100e18).toString(), "TestToken", "TT", 18]
    }).send({
      from: accounts[0],
      gas: 4000000,
    }).on("receipt", function(rcpt){
      receipt = rcpt;
    });



    ERC20SnapshotContract = new web3.eth.Contract(ERC20Snapshot.abi, receipt.contractAddress);
    console.log("ERC20 deployment cost: " + erc20gas);
    console.log("Snapshot deployment cost: " + receipt.gasUsed);

    Snap.setSnapshotContract(receipt.contractAddress);

    let data = Snap.data[blockN]

    //let bool = await ERC20SnapshotContract.methods.checkProof(proof.hashes, proof.hashRight).call();
    //console.log(bool);

    /*let data = Snap.data[blockN]
    let account;
    let index;

    for (key in data.sortedAccountList) {
      let acct = data.sortedAccountList[key];
      if (data.balanceMap[acct] > 0){
        account = acct;
        index = key;
        break;
      }
    }

    let proof = (MerkleTree.createProof(hashList, hashList[index]))

    await ERC20SnapshotContract.methods.claim(account, data.balanceMap[account], proof.hashes, proof.hashRight).send({
      from: accounts[0]
    }).on("receipt", function(rcpt){
    //  console.log(rcpt)
    })


    let newBalance = await ERC20SnapshotContract.methods.balanceOf(account).call();
    console.log("Balance was: " + data.balanceMap[account] + " and is in the new contract: " + newBalance)
    assert.equal(data.balanceMap[account], newBalance, "balances should be equal") */
    //console.log(data.sortedAccountList)
    for (key in data.sortedAccountList) {
      let account = data.sortedAccountList[key];
      let tx = await Snap.getClaimTX(blockN, account);
      
      let rcpt = await tx.send({from: accounts[0]})

      let newBalance = await ERC20SnapshotContract.methods.balanceOf(account).call();
      
      console.log("Balance was: " + data.balanceMap[account] / 1e18 + " and is in the new contract: " + newBalance / 1e18)
      console.log("Gas usage: " + rcpt.gasUsed);
      assert.equal(data.balanceMap[account], newBalance, "balances should be equal") 
    }

  })

})