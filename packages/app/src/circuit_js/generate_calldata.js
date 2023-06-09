/* global BigInt */

import { groth16 } from 'snarkjs';

import { generateWitness } from './generate_witness';

export async function generateCalldata(input) {
    let generateWitnessSuccess = true;

    const witness = await generateWitness(input).then()
        .catch((error) => {
            console.error(error);
            generateWitnessSuccess = false;
        });

    // console.log(witness);

    if (!generateWitnessSuccess) { return; }

    const { proof, publicSignals } = await groth16.prove('circuit_final.zkey', witness);

    const calldata = await groth16.exportSolidityCallData(proof, publicSignals);

    const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());

    // console.log(argv);

    const a = [argv[0], argv[1]];
    const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
    const c = [argv[6], argv[7]];
    const Input = argv.slice(8);

    return [a, b, c, Input];
}