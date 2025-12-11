const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const AviationMaintenance = await ethers.getContractFactory("AviationMaintenance");
  // We need the deployed address. I'll assume it's the one from the previous context or I'll fetch it from the build info if possible, 
  // but usually in a local dev environment with a fresh deploy, I might need to look at the artifacts or just ask the user.
  // However, I can try to attach to the address in the error message if it was the contract address.
  // The error payload had "to": "0x5fbdb2315678afecb367f032d93f642f64180aa3"
  const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
  const contract = AviationMaintenance.attach(contractAddress);

  const targetAddress = "0xf8f5ec86079c7d70d33bbfd0b5130b45263ffbed";

  console.log(`Checking authorization for ${targetAddress}...`);
  const isAuthorized = await contract.authorizedNodes(targetAddress);
  console.log(`Is Authorized: ${isAuthorized}`);

  const owner = await contract.owner();
  console.log(`Contract Owner: ${owner}`);
  
  // Check function selector
  const sig = ethers.id("signPeerCheck(string,string,string)").slice(0, 10);
  console.log(`Selector for signPeerCheck(string,string,string): ${sig}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
