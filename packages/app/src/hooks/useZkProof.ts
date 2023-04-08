import { ethers } from "ethers";
import { useSigner } from "wagmi";

import { FluxWallet__factory } from "../../../contracts/typechain-types/factories/contracts/FluxWallet.sol/FluxWallet__factory";
import { generateCalldata } from "../circuit_js/generate_calldata";

export const useZkProof = () => {
  const { data: signer } = useSigner();

  const prove = async (
    input: Record<string, unknown>,
    amount: string,
    recipient: string
  ) => {
    if (!signer) {
      throw new Error("Signer not available");
    }

    const scwAddress = localStorage.getItem("scwAddress") || "0x33a15964328a3419ec55f6192fccb81a3e3861e2";
    const scw = new ethers.Contract(
      scwAddress,
      FluxWallet__factory.abi,
      signer
    );

    const calldata = await generateCalldata(input);
    if (!calldata) {
      throw new Error("Witness generation failed.");
    }

    const tx = await scw.zkProof(
      calldata[0],
      calldata[1],
      calldata[2],
      calldata[3],
      ethers.utils.parseEther(amount),
      recipient
    );
    const rc = await tx.wait();
    return { tx, receipt: rc };
  };

  return { prove };
};
