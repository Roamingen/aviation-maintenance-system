const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// 1. 配置
// 注意：每次重新部署合约后，都需要更新这个地址
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";;;;;; 

// Hardhat 本地网络 RPC
const RPC_URL = "http://127.0.0.1:8545";

// 模拟的节点私�?(Account #0 from Hardhat node)
// 在真实生产环境中，这应该存储在环境变�?(.env) 中，绝不能硬编码
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// 读取合约 ABI
const artifactPath = path.join(__dirname, "../artifacts/contracts/AviationMaintenance.sol/AviationMaintenance.json");
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const ABI = artifact.abi;

// 2. 初始�?Provider �?Wallet
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

module.exports = {
    contract,
    wallet
};








