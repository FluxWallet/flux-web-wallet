import fs from 'fs';
import path from 'path';

import witnessCalculator from '../../circuit_js/witness_calculator';

async function buildWitness(input) {
    const wasmPath = path.join(process.cwd(), 'public', 'circuit.wasm');
    const wasmBuffer = fs.readFileSync(wasmPath);

    const witnessBuilder = await witnessCalculator(wasmBuffer);
    return witnessBuilder.calculateWTNSBin(input, 0);
}

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        response.setHeader('Allow', ['POST']);
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { groth16 } = await import('snarkjs');
        const input = request.body?.input;

        if (!input) {
            return response.status(400).json({ error: 'Missing circuit input' });
        }

        const witness = await buildWitness(input);
        const zkeyPath = path.join(process.cwd(), 'public', 'circuit_final.zkey');
        const { proof, publicSignals } = await groth16.prove(zkeyPath, witness);
        const calldata = await groth16.exportSolidityCallData(proof, publicSignals);

        const argv = calldata.replace(/["[\]\s]/g, '').split(',').map((value) => BigInt(value).toString());

        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const inputValues = argv.slice(8);

        return response.status(200).json({
            calldata: [a, b, c, inputValues],
        });
    } catch (error) {
        console.error('generate-calldata api error', error);
        return response.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to generate calldata',
        });
    }
}