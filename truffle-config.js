const HDWalletProvider = require('truffle-hdwallet-provider');
const fs = require('fs');
module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "5777",
      gas: 4600000
    },
    inf_MeloManiac_ropsten: {
      network_id: 3,
      gasPrice: 100000000000,
      provider: new HDWalletProvider(fs.readFileSync('/Users/shriramr/Documents/GitHub/MeloManiac/mnemonic.env', 'utf-8'), "https://ropsten.infura.io/v3/62cff11104f54085984676c0008ebce0", 2)
    }
  },
  compilers: {
    solc: {}
  }
};
