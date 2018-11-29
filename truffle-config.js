module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gas: 6000000,
      gasPrice: 32
    }
  },
  mocha: {
    enableTimeouts: false
  },
  solc:{
    optimizer: {
      "enabled": false,
      "runs": 200
    }
  }
};
