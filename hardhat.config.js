require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      gasPrice: 0,
      initialBaseFeePerGas: 0,
      allowUnlimitedContractSize: true,
      mining: {
        auto: true,
        interval: 0,
        mempool: {
          order: "fifo"
        }
      },
      accounts: {
        accountsBalance: "100000000000000000000000" // 100000 ETH
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      chainId: 31337,
      gasPrice: 0,
      initialBaseFeePerGas: 0
    }
  },
  paths: {
    artifacts: './artifacts',
  }
};
