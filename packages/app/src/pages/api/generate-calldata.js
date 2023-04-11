import fs from 'fs';
import path from 'path';

function setCORS(response) {
    response.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
}

export default async function handler(request, response) {
    setCORS(response);

    if (request.method === 'OPTIONS') {
        return response.status(204).end();
    }

    if (request.method !== 'POST') {
        response.setHeader('Allow', ['POST']);
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = request.headers['x-api-key'];
    const expectedKey = process.env.API_SECRET_KEY;
    if (expectedKey && apiKey !== expectedKey) {
        return response.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { groth16 } = await import('snarkjs');
        const { default: witnessCalculator } = await import('../../circuit_js/witness_calculator');
        const input = request.body?.input;

        if (!input) {
            return response.status(400).json({ error: 'Missing circuit input' });
        }

        if (Buffer.byteLength(JSON.stringify(request.body), 'utf-8') > 1024 * 100) {
            return response.status(413).json({ error: 'Request body too large' });
        }

        const wasmPath = path.join(process.cwd(), 'public', 'circuit.wasm');
        const wasmBuffer = fs.readFileSync(wasmPath);
        const witnessBuilder = await witnessCalculator(wasmBuffer);
        const witness = witnessBuilder.calculateWTNSBin(input, 0);
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