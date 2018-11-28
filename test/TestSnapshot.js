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

  })

  it('should work', async() => {

    await ERC20Contract.methods.transfer(accounts[1], (10e18).toString()).send({from: accounts[0]});
    await ERC20Contract.methods.transfer(accounts[2], (20e18).toString()).send({from: accounts[0]});
    await ERC20Contract.methods.transfer(accounts[3], (5e18).toString()).send({from: accounts[0]});
    await ERC20Contract.methods.transfer(accounts[4], (15e18).toString()).send({from: accounts[0]});

    let blockN = await web3.eth.getBlockNumber();
    Snap.getRootHash(blockN);

  })

})