/* eslint-disable camelcase */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable */

// import Create2Factory from "./artifacts/contracts/Create2Factory.json";
// import {
//   AbiCoder,
//   hexConcat,
//   hexlify,
//   hexValue,
//   hexZeroPad,
// } from "ethers/lib/utils";

import {
  EntryPoint,
  EntryPoint__factory,
} from "@account-abstraction/contracts";
import { ERC4337EthersProvider } from "@account-abstraction/sdk";
import { HttpRpcClient } from "@account-abstraction/sdk/dist/src/HttpRpcClient";
import { ethers, providers } from "ethers";
import { useAccount, useNetwork, useSigner } from "wagmi";

import OTP from "../../contracts/artifacts/contracts/OTP.sol/OTP.json";
import OTPFactory from "../../contracts/artifacts/contracts/OTPFactory.sol/OTPFactory.json";
import { generateCalldata } from "./circuit_js/generate_calldata";
import { useFluxWallet } from "./hooks/useFluxWallet";
import { FluxWallet__factory } from "../../contracts/typechain-types/factories/contracts/FluxWallet.sol/FluxWallet__factory";
// import { deployments } from 'hardhat';
import { FluxWalletDeployer__factory } from "../../contracts/typechain-types/factories/contracts/FluxWalletDeployer__factory";
import { OTP__factory } from "../../contracts/typechain-types/factories/contracts/OTP.sol/OTP__factory";
// import { FluxPaymasterApi } from "./typechain-types/FluxPaymasterApi";
// import { FluxWalletApi } from "./typechain-types/FluxWalletApi";

const address = {
  OTPFactory: "0x8bE7560eEb4fF64aB2914ffa573A38f003d9E739",
  Verifier: "0xAA8De56927542E7Af85AE3F68Fb69594E7cF8613",
};


let factory;
let otp;


const ENTRYPOINT_ADDR = "0xB890B15AF9bF4edcE2d39D5Ef321D33d876f8378";
// const MY_WALLET_DEPLOYER = address.FluxWalletDeployer;

const providerConfig = {
  entryPointAddress: ENTRYPOINT_ADDR,
  bundlerUrl: "https://eip4337-bundler-goerli.protonapp.io/rpc",
};

export async function connectContract(addr) {
  const { entryPoint, fluxWalletAPI, fluxWalletAddress, isDeployed, contract, balance } = useFluxWallet();
  const { isConnected, address } = useAccount();

  const { data: signer } = useSigner();
  const network = useNetwork();
  const provider = signer?.provider
  const chain = network.chain
  console.log("Network chain:" + network.chain)

  const FluxWalletDeployer = contract;

  const factoryAddress = FluxWalletDeployer.address;

  const walletAddress = fluxWalletAddress


  // const {deploy} = deployments;

  const { ethereum } = window;


  // let root: any = localStorage.getItem("MerkleRoot");

  // let provider = new ethers.providers.Web3Provider(ethereum);
  // let signer = provider.getSigner();
  // let network = await provider.getNetwork();

  // console.log("signer: ", await signer.getAddress());

  // const entryPoint = EntryPoint__factory.connect(
  //   providerConfig.entryPointAddress,
  //   provider
  // );
  // const FluxWalletDeployer = FluxWalletDeployer__factory.connect(
  //   MY_WALLET_DEPLOYER,
  //   signer
  // );
  // const factoryAddress = FluxWalletDeployer.address;

  // const ownerAddress = await signer.getAddress();

  // const walletAddress = await FluxWalletDeployer.getDeploymentAddress(
  //   ENTRYPOINT_ADDR,
  //   ownerAddress,
  //   root
  // );

  console.log("--- end deploying FluxWalletDeployer contract ---");

  const myPaymasterApi = new FluxPaymasterApi();

  const smartWalletAPI = new FluxWalletApi({
    provider,
    entryPointAddress: entryPoint.address,
    walletAddress,
    owner: signer,
    factoryAddress,
    paymasterAPI: myPaymasterApi,
  });

  console.log("--- Erc4337EthersProvider initialisation ---");

  const httpRpcClient = new HttpRpcClient(
    providerConfig.bundlerUrl,
    providerConfig.entryPointAddress,
    network.chain
  );

  // const aaProvier = await new ERC4337EthersProvider(
  //   network.chainId,
  //   providerConfig,
  //   signer,
  //   provider,
  //   httpRpcClient,
  //   entryPoint,
  //   smartWalletAPI
  // ).init();

  // const aaSigner = aaProvier.getSigner();

  // const scw = new ethers.ContractFactory(FluxWallet__factory.abi, FluxWallet__factory.bytecode);

  // console.log("SCW address: ", await aaSigner.getAddress());

  // const scw = new ethers.Contract(await aaSigner.getAddress(),FluxWallet__factory.abi,  aaSigner)

  otp = OTP__factory.connect(addr, signer);

  // otp = new ethers.Contract(addr, OTP.abi, signer);

  otp = otp.connect(aaSigner);

  console.log("Connect to OTP Contract:", OTP);
}

export async function setRootAndVerifier(
  smartWalletAPI,
  aaProvier
) {
  // const aaSigner = aaProvier.getSigner();
  // const provider = new ethers.providers.Web3Provider(ethereum);
  // console.log("Provider:" + provider)

  // const scw = new ethers.ContractFactory(
  //   FluxWallet__factory.abi,
  //   FluxWallet__factory.bytecode
  // );

  let root = localStorage.getItem("MerkleRoot");

  root = root !== null ? root : "123";

  console.log(`root here: ${root}`);
  console.log(
    `data: ${scw.interface.encodeFunctionData("setMerkleRootAndVerifier", [
      root,
      address.Verifier,
    ])}`
  );

  const op = await smartWalletAPI.createSignedUserOp({
    target: await aaSigner.getAddress(),
    data: scw.interface.encodeFunctionData("setMerkleRootAndVerifier", [
      root,
      address.Verifier,
    ]),
  });
  console.log("op: ");
  console.log(op);
  const tx = await aaProvier.httpRpcClient.sendUserOpToBundler(op);

  console.log(`here`);
  console.log(tx);
}

export async function getAaParams() {
  const { fluxWalletAddress, entryPoint, fluxWalletAPI, isDeployed, balance, contract } = useFluxWallet();

  const root = localStorage.getItem("MerkleRoot");
  const { ethereum } = window;

  const { isConnected, address } = useAccount();

  const { data: signer } = useSigner();
  const network = useNetwork();
  const chain = network.chain
  console.log("Network chain:" + network.chain)

  // let provider = new ethers.providers.Web3Provider(ethereum);
  // let signer = provider.getSigner();
  // let network = await provider.getNetwork();

  // console.log("signer: ", await signer.getAddress());
  console.log("Signer: ", address);

  // const entryPoint = EntryPoint__factory.connect(
  //   providerConfig.entryPointAddress,
  //   provider
  // );

  // const FluxWalletDeployer = FluxWalletDeployer__factory.connect(
  //   MY_WALLET_DEPLOYER,
  //   signer
  // );

  const factoryAddress = contract;

  const ownerAddress = address;

  // const walletAddress = await FluxWalletDeployer.getDeploymentAddress(
  //   ENTRYPOINT_ADDR,
  //   ownerAddress,
  //   ethers.BigNumber.from(root),
  //   // 0
  // );

  console.log("--- end deploying FluxWalletDeployer contract ---");

  // const myPaymasterApi = new FluxPaymasterApi();

  // const smartWalletAPI = new FluxWalletApi({
  //   provider: provider,
  //   entryPointAddress: entryPoint.address,
  //   walletAddress: walletAddress,
  //   owner: signer,
  //   factoryAddress: factoryAddress,
  //   paymasterAPI: myPaymasterApi,
  // });
  console.log("--- Erc4337EthersProvider initialisation ---");

  const httpRpcClient = new HttpRpcClient(
    providerConfig.bundlerUrl,
    providerConfig.entryPointAddress,
    Number(chain)
  );

  // const aaProvier = await new ERC4337EthersProvider(
  //   network.chainId,
  //   providerConfig,
  //   signer,
  //   provider,
  //   httpRpcClient,
  //   entryPoint,
  //   smartWalletAPI
  // ).init();

  // const aaSigner = aaProvier.getSigner();

  // return { smartWalletAPI, httpRpcClient, aaProvier };
}

// for otp factory
export async function connectFactory() {
  const { ethereum } = window;

  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  console.log("signer: ", await signer.getAddress());

  factory = new ethers.Contract(address.OTPFactory, OTPFactory.abi, signer);

  console.log("Connect to OTPFactory Contract:", OTPFactory);
}

export async function deployOTP(root) {
  await connectFactory();

  const Tx = await factory.createOTP(address.Verifier, root);
  const tx = await Tx.wait();
  console.log(tx);
  const deployedAddress = tx.events[0].args.newAddress;

  localStorage.setItem("OTPaddress", deployedAddress);

  return deployedAddress;
}

export async function naiveProof(
  input,
  amount,
  recepient
) {
  const root = localStorage.getItem("MerkleRoot");
  // const { smartWalletAPI, httpRpcClient, aaProvier } = await getAaParams();
  // let { smartWalletAPI, httpRpcClient, aaProvier } = await getAaParams(root);

  // const aaSigner = aaProvier.getSigner();

  // console.log("aaSigner: ", aaSigner);


  const scw = new ethers.Contract(
    "0x33a15964328a3419ec55f6192fccb81a3e3861e2",
    FluxWallet__factory.abi,
    fluxWalletAPI
  );

  console.log(`amount-c: ${amount} recepient: ${recepient}`);
  console.log("ZK Proof being generated");

  const calldata = await generateCalldata(input);
  console.log("calldata-c:");
  console.log(calldata);
  let tx;

  if (calldata) {
    console.log("otp address-c:", otp.address);
    console.log(`recepient: ${recepient} amount: ${amount}`);

    const tx = await scw.zkProof(
      calldata[0],
      calldata[1],
      calldata[2],
      calldata[3],
      ethers.utils.parseEther(amount),
      recepient
    );
    const rc2 = await tx.wait();
    console.log("rc2", rc2);
  } else {
    throw new Error("Witness generation failed.-c:");
  }
  return tx;
}

export async function blockTimestampProof(input) {
  if (localStorage.getItem("OTPaddress")) {
    console.log(localStorage.getItem("OTPaddress"));
    await connectContract(localStorage.getItem("OTPaddress"));
  } else {
    throw new Error("No OTP contract address found. Deploy first.");
  }

  const calldata = await generateCalldata(input);
  let tx;

  if (calldata) {
    tx = await otp
      .blockApproval(calldata[0], calldata[1], calldata[2], calldata[3])
      .catch((error) => {
        console.log(error);
        let errorMsg;
        if (error.reason) {
          errorMsg = error.reason;
        } else if (error.data.message) {
          errorMsg = error.data.message;
        } else {
          errorMsg = "Unknown error.";
        }
        throw errorMsg;
      });
  } else {
    throw new Error("Witness generation failed.");
  }
  return tx;
}
