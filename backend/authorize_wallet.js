const { contract } = require('./config');
const { ethers } = require("ethers");

async function main() {
    // 获取命令行参数中的地址
    const targetAddress = process.argv[2];

    if (!targetAddress || !ethers.isAddress(targetAddress)) {
        console.error("❌ 请提供有效的以太坊地址作为参数。");
        console.error("用法: node authorize_wallet.js <WALLET_ADDRESS>");
        process.exit(1);
    }

    console.log(`🚀 正在授权地址: ${targetAddress}...`);

    try {
        // 检查是否已经授权
        const isAuthorized = await contract.authorizedNodes(targetAddress);
        if (isAuthorized) {
            console.log("✅ 该地址已经被授权，无需重复操作。");
            return;
        }

        // 发送授权交易
        const tx = await contract.setNodeAuthorization(targetAddress, true);
        console.log(`⏳ 交易已发送，等待确认... (Hash: ${tx.hash})`);
        
        await tx.wait();
        console.log(`🎉 授权成功！您现在可以使用该钱包地址进行签名操作了。`);

    } catch (error) {
        console.error("❌ 授权失败:", error.reason || error.message);
    }
}

main();
