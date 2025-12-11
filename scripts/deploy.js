const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const AviationMaintenance = await hre.ethers.getContractFactory("AviationMaintenance");
  const aviationMaintenance = await AviationMaintenance.deploy();

  await aviationMaintenance.waitForDeployment();

  const targetAddress = aviationMaintenance.target;
  console.log(`AviationMaintenance deployed to ${targetAddress}`);

  // 自动更新 backend/config.js 中的地址
  const configPath = path.join(__dirname, "../backend/config.js");
  if (fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(configPath, "utf8");
    
    // 使用正则替换 CONTRACT_ADDRESS 的值
    const newContent = configContent.replace(
      /const CONTRACT_ADDRESS = ".*";/,
      `const CONTRACT_ADDRESS = "${targetAddress}";`
    );

    fs.writeFileSync(configPath, newContent);
    console.log(`Updated backend/config.js with new address: ${targetAddress}`);
  } else {
    console.warn("backend/config.js not found, skipping auto-update.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
