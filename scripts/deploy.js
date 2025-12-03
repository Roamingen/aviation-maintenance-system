const hre = require("hardhat");

async function main() {
  const AviationMaintenance = await hre.ethers.getContractFactory("AviationMaintenance");
  const aviationMaintenance = await AviationMaintenance.deploy();

  await aviationMaintenance.waitForDeployment();

  console.log(
    `AviationMaintenance deployed to ${aviationMaintenance.target}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
