/* eslint-disable camelcase */
import { EntryPoint__factory } from "@account-abstraction/contracts";
import { SampleRecipient__factory } from "@account-abstraction/utils/dist/src/types";
import fs from "fs";
import hre, { ethers, network } from "hardhat";
import path from "path";

import { DeterministicDeployer } from "../lib/infinitism/DeterministicDeployer";
import { FluxWalletDeployer__factory } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  const entryPoint = await new EntryPoint__factory(signer).deploy(1, 1);
  const factoryAddress = await DeterministicDeployer.deploy(FluxWalletDeployer__factory.bytecode);
  const sampleRecipient = await new SampleRecipient__factory(signer).deploy();
  const result = {
    entryPoint: entryPoint.address,
    factory: factoryAddress,
    sampleRecipient: sampleRecipient.address,
    signerAddress: signer.address,
  };
  console.log("result:", result);

  // const accounts = await hre.ethers.getSigners()
  // const owner = accounts[0]
  console.log("Signer:", signer.address);

  const OTPFactory = await ethers.getContractFactory('OTPFactory')
  const oTPFactory = await OTPFactory.deploy()
  await oTPFactory.deployed()
  console.log('oTPFactory deployed:', oTPFactory.address)


  const Verifier = await ethers.getContractFactory('Verifier');
  const verifier = await Verifier.deploy();
  console.log('verifier :', verifier.address);

  fs.writeFileSync(
    path.join(__dirname, `../deployments/${network.name}.json`),
    JSON.stringify({
      ...result,
      otpFactory: oTPFactory.address,
      verifier: verifier.address,
    })
  );
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
