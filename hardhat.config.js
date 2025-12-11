require("@nomicfoundation/hardhat-toolbox");

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
      chainId: 1337,
      initialBaseFeePerGas: 0, // 设置基础 Gas 费为 0
      gasPrice: 0, // 设置 Gas 价格为 0 (针对非 EIP-1559 交易)
      accounts: {
        accountsBalance: "100000000000000000000000000" // 1亿 ETH
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
