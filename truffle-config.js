const HDWalletProvider = require('truffle-hdwallet-provider');
const fs = require('fs');
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  solidity: "0.8.4",
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
      provider: new HDWalletProvider(fs.readFileSync('/tmp/mnemonic.env', 'utf-8'), "https://ropsten.infura.io/v3/62cff11104f54085984676c0008ebce0", 2)
    }
  },
  compilers: {
    solc: {
      version: "0.8.4",       // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    }
  },
};
