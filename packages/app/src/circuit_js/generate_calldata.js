export async function generateCalldata(input) {
    const response = await fetch('/api/generate-calldata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
    });

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || 'Failed to generate calldata');
    }

    const payload = await response.json();
    return payload.calldata;
}