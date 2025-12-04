const { wallet } = require('./config');
const { ethers } = require("ethers");

async function main() {
    // 获取命令行参数中的地址
    const targetAddress = process.argv[2];

    if (!targetAddress || !ethers.isAddress(targetAddress)) {
        console.error("❌ 请提供有效的以太坊地址作为参数。");
        console.error("用法: node fund_wallet.js <WALLET_ADDRESS>");
        process.exit(1);
    }

    console.log(`🚀 正在向地址转账测试代币: ${targetAddress}...`);

    try {
        // 发送 100 ETH
        const tx = await wallet.sendTransaction({
            to: targetAddress,
            value: ethers.parseEther("100.0")
        });

        console.log(`⏳ 交易已发送，等待确认... (Hash: ${tx.hash})`);
        await tx.wait();
        
        console.log(`🎉 转账成功！已向该地址发送 100 ETH 测试币。`);
        console.log(`💰 请检查您的 MetaMask 余额。`);

    } catch (error) {
        console.error("❌ 转账失败:", error.reason || error.message);
    }
}

main();
