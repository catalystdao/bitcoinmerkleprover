
// Constants
// ************************************************************************************************

const WITNESS_FLAG = '0001';



// Types
// ************************************************************************************************

export interface Outpoint {
    hash: string;
    index: number;
}

export interface Input {
    previousOutput: Outpoint;
    script: string;
    sequence: number;
}

export interface Output {
    value: number;
    script: string;
}

export interface Transaction {
    version: number;
    inputs: Input[];
    outputs: Output[];
    witnessFields: string[];
    lockTime: number;
}




// Encoding/decoding functions
// ************************************************************************************************

export function encodeTransaction(
    transaction: Transaction,
    encodeWitnessFields = true
): string {

    let bytes = "";

    bytes += encodeLittleEndianInt(transaction.version, 4);

    if (encodeWitnessFields) {
        bytes += WITNESS_FLAG;
    }

    const inputsCount = transaction.inputs.length;
    bytes += encodeCompactSize(inputsCount);
    for (const input of transaction.inputs) {
        bytes += encodeInput(input);
    }

    const outputsCount = transaction.outputs.length;
    bytes += encodeCompactSize(outputsCount);
    for (const output of transaction.outputs) {
        bytes += encodeOutput(output);
    }

    if (encodeWitnessFields) {
        const witnessFieldsCount = transaction.witnessFields.length;
        bytes += encodeCompactSize(witnessFieldsCount);
        
        for (const witnessField of transaction.witnessFields) {
            bytes += encodeCompactSize(witnessField.length / 2);
            bytes += witnessField;
        }
    }

    bytes += encodeLittleEndianInt(transaction.lockTime, 4);

    return bytes;
}

export function decodeTransaction(bytes: string): Transaction {

    let pointer = 0;

    const versionBytes = bytes.slice(0, pointer += 8);
    const version = parseLittleEndianInt(versionBytes);

    const witnessFlag = bytes.slice(pointer, pointer + 4);
    const isWitness = witnessFlag === WITNESS_FLAG
    if (isWitness) {
        pointer += 4
    }


    const decodedInputsCount = parseCompactSize(bytes, pointer);
    const inputsCount = decodedInputsCount[0];
    pointer = decodedInputsCount[1];

    const inputs: Input[] = [];
    for (let inputIndex = 0; inputIndex < inputsCount; inputIndex++) {
        const decodedInput = decodeInput(bytes, pointer);
        inputs.push(decodedInput[0]);
        pointer = decodedInput[1];
    }


    const decodedOutputsCount = parseCompactSize(bytes, pointer);
    const outputsCount = decodedOutputsCount[0];
    pointer = decodedOutputsCount[1];

    const outputs: Output[] = [];
    for (let outputIndex = 0; outputIndex < outputsCount; outputIndex++) {
        const decodedOutput = decodeOutput(bytes, pointer);
        outputs.push(decodedOutput[0]);
        pointer = decodedOutput[1];
    }


    const witnessFields: string[] = []
    if (isWitness) {
        const decodedWitnessCount = parseCompactSize(bytes, pointer);
        const witnessComponentsCount = decodedWitnessCount[0];
        pointer = decodedWitnessCount[1];

        for (let witnessFieldIndex = 0; witnessFieldIndex < witnessComponentsCount; witnessFieldIndex++) {
            const decodedWitnessFieldLength = parseCompactSize(bytes, pointer);
            const witnessFieldLength = Number(decodedWitnessFieldLength[0]);
            pointer = decodedWitnessFieldLength[1];

            const witnessField = bytes.slice(pointer, pointer += witnessFieldLength * 2);
            witnessFields.push(witnessField);
        }
    }


    const lockTimeBytes = bytes.slice(pointer);
    if (lockTimeBytes.length != 8) {
        throw new Error('Failed to decode transaction: unexpected bytes length.');
    }

    const lockTime = parseLittleEndianInt(lockTimeBytes);


    return {
        version,
        inputs,
        outputs,
        witnessFields,
        lockTime,
    }

}


function encodeInput(input: Input): string {

    let bytes = "";

    bytes += input.previousOutput.hash;
    bytes += encodeLittleEndianInt(input.previousOutput.index, 4);

    const scriptLength = input.script.length / 2;
    bytes += encodeCompactSize(scriptLength)
    bytes += input.script;

    bytes += encodeLittleEndianInt(input.sequence, 4);

    return bytes;
}

function decodeInput(bytes: string, pointer: number = 0): [Input, number] {

    const hash = bytes.slice(pointer, pointer += 64);

    const indexBytes = bytes.slice(pointer, pointer += 8);
    const index = parseLittleEndianInt(indexBytes);

    const previousOutput: Outpoint = {
        hash,
        index
    };


    const decodedScriptLength = parseCompactSize(bytes, pointer);
    const scriptLength = Number(decodedScriptLength[0]);
    pointer = decodedScriptLength[1];

    const script = bytes.slice(pointer, pointer += scriptLength * 2);


    const sequenceBytes = bytes.slice(pointer, pointer += 8);
    const sequence = parseLittleEndianInt(sequenceBytes);


    return [
        {
            previousOutput,
            script,
            sequence,
        },
        pointer
    ];
}


function encodeOutput(output: Output): string {

    let bytes = "";

    bytes += encodeLittleEndianInt(output.value, 8);
    
    bytes += encodeCompactSize(output.script.length / 2);
    bytes += output.script;

    return bytes;
}

function decodeOutput(bytes: string, pointer: number = 0): [Output, number] {

    const valueBytes = bytes.slice(pointer, pointer += 16);
    const value = parseLittleEndianInt(valueBytes);
    
    const decodedScriptLength = parseCompactSize(bytes, pointer);
    const scriptLength = Number(decodedScriptLength[0]);
    pointer = decodedScriptLength[1];

    const script = bytes.slice(pointer, pointer += scriptLength * 2);

    return [
        {
            value,
            script
        },
        pointer,
    ]
}


export function encodeCompactSize(
    value: number | bigint
): string {
    
    if (typeof value == 'number' && value % 1 != 0) {
        throw new Error('Unable to encode CompactSize: decimal number not supported.');
    }

    const hexValue = value.toString(16);

    if (value <= 252n) {
        return hexValue.padStart(2, '0');
    }
    if (value <= 0xffffn) {
        return 'fd' + reverseBytes(hexValue.padStart(4, '0'));
    }
    if (value <= 0xffffffffn) {
        return 'fe' + reverseBytes(hexValue.padStart(8, '0'));
    }
    if (value <= 0xffffffffffffffffn) {
        return 'ff' + reverseBytes(hexValue.padStart(16, '0'));
    }

    throw new Error('Unable to encode CompactSize: value to encode is too large (max 0xffffffffffffffff).');
}

export function parseCompactSize(
    bytes: string,
    pointer: number = 0,
): [bigint, number] {

    if (bytes.length == 0 || bytes.length % 2 != 0) {
        throw new Error('Unable to decode CompactSize: invalid bytes string.')
    }


    const firstByte = bytes.slice(pointer, pointer += + 2).toLowerCase();
    if (firstByte.length != 2) {
        throw new Error('Unable to decode CompactSize: invalid bytes string.');
    }


    let appendedLength = 0;
    switch (firstByte) {
        case 'fd':
            appendedLength = 4;
            break;
        case 'fe':
            appendedLength = 8;
            break;
        case 'ff':
            appendedLength = 16;
            break;
    }


    if (appendedLength == 0) {
        return [BigInt(parseInt(firstByte, 16)), pointer];
    }


    const appendedBytes = bytes.slice(pointer, pointer += appendedLength);
    if (appendedBytes.length != appendedLength) {
        throw new Error('Unable to decode CompactSize: invalid bytes string.');
    }

    return [parseLittleEndianBigInt(appendedBytes), pointer]
}



// Helpers
// ************************************************************************************************

export function reverseBytes(bytes: string): string {
    if (bytes.length % 2 != 0) {
        throw new Error('Unable to reverse bytes: incorrect bytes string length.');
    }

    const extractedBytes: string[] = [];
    let pointer = 0;
    while (pointer < bytes.length) {
        extractedBytes.push(bytes.slice(pointer, pointer += 2));
    }

    return extractedBytes.reverse().join('');
}

export function encodeLittleEndianInt(value: number, padBytes = 0): string {
    let hexValue = value.toString(16);
    if (hexValue.length % 2 != 0) {
        hexValue = '0' + hexValue;
    }
    return reverseBytes(hexValue).padEnd(padBytes * 2, '0');
}

export function parseLittleEndianInt(bytes: string): number {
    return parseInt(reverseBytes(bytes), 16);
}

export function parseLittleEndianBigInt(bytes: string): bigint {
    return BigInt('0x' + reverseBytes(bytes));
}
