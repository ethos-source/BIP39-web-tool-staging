"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Bip39 = require("bip39");
const ethUtil = require("ethereumjs-util");
const bitcore_lib_1 = require("bitcore-lib");
const ENGLISH_WORDLIST = Bip39.wordlists.EN;
const MNEMONIC_WORDCOUNT = 24;
let MAINNET_MODE = false;
let NUM_WALLETS = 10;
let START_WALLET_INDEX = 0;
const EXTENDED_KEYPAIR_PATH = `m/244'`;

// build the schema to validate the seed format
function buildSeedPromptSchema() {
    let i = 1;
    const schema = Array.from({ length: MNEMONIC_WORDCOUNT }, () => {
        return {
            name: `Word ${i++}`,
            type: 'string',
            hidden: true,
            replace: '*',
            required: true,
            message: 'Mnemonic word is not correct.',
            before: (word) => {
                return word.toLowerCase().trim();
            },
            conform: (word) => {
                return ENGLISH_WORDLIST.find(val => val === word.toLowerCase().trim());
            },
        };
    });
    return schema;
}

// schema verification
function promptInputAsPromise(schema) {
    return new Promise((resolve) => {
        Prompt.get(schema, (error, input) => {
            if (error) {
                console.log('Input validation failed');
                process.exit(1);
            }
            return resolve(input);
        });
    });
}

// format it correctly
function promptInputToMnemonic(input) {
    const words = [];
    for (let i = 0; i <= MNEMONIC_WORDCOUNT; i++) {
        words.push(input[`Word ${i}`]);
    }
    return words.join(' ').trim();
}

// Extended Private Key
// Returns string with extended private key
function getExtendedPrivateKey(seed, xKeyPath) {
    const xKey = getKeyPair(seed, xKeyPath);
    const xPrivateKey = xKey.extendedPrivateKey;
    console.log(`Extended Private Key (at ${xKeyPath}): ${xPrivateKey}`);
    return {
        "xKeyPath" : xKeyPath,
        "xPrivateKey" : xPrivateKey
    }
}

// Extended Public Key
// Returns string with extended public key
function getExtendedPublicKey(seed, xKeyPath) {
    const xKey = getKeyPair(seed, xKeyPath);
    const xPublicKey = xKey.extendedPublicKey;
    console.log(`Extended Public Key (at ${xKeyPath}): ${xPublicKey}`);
    return {
        "xKeyPath" : xKeyPath,
        "xPublicKey" : xPublicKey
    }
}

// returns extendedPrivateKey, extendedPublicKey, privateKey and publicKey
// also checks for mainnet vs testnet
function getKeyPair(seed, derivationPath) {
    const hdPrivateKey = bitcore_lib_1.HDPrivateKey.fromSeed(seed, getBlockchainNetwork());
    let extendedPrivateKey = hdPrivateKey.derive(derivationPath);
    const extendedPublicKey = extendedPrivateKey.hdPublicKey.toString('hex');
    const privateKey = extendedPrivateKey.privateKey.toString('hex');
    const publicKey = extendedPrivateKey.publicKey.toString('hex');
    extendedPrivateKey = extendedPrivateKey.toString('hex');
    return {
        extendedPrivateKey,
        extendedPublicKey,
        privateKey,
        publicKey,
    };
}

// returns testnet vs mainnet
function getBlockchainNetwork() {
    return MAINNET_MODE ? bitcore_lib_1.Networks.livenet : bitcore_lib_1.Networks.testnet;
}

// constructs the derviation path
function getDerivationPath(blockchainId, walletIndex, addressIndex) {
    return `${EXTENDED_KEYPAIR_PATH}/0/${blockchainId}/${walletIndex}/0/${addressIndex}`;
}

// prints out wallets and loops through
// probably won't be needed
function printWallets(seed, numWallets) {
    Array.from({ length: NUM_WALLETS }, (v, k) => k).forEach(i => {
        printWalletDetails(seed, 0, START_WALLET_INDEX + i);
        printWalletDetails(seed, 60, START_WALLET_INDEX + i);
    });
}

// prints out details relating to the wallet
function printWalletDetails(seed, blockchainId, walletIndex) {
    const path = getDerivationPath(blockchainId, walletIndex, 0);
    const keyPair = getKeyPair(seed, path);
    const publicKey = keyPair.publicKey;
    const privateKey = keyPair.privateKey;
    console.log(`Wallet Index ${walletIndex} (at ${path})`);
    console.log(`Public Key: ${publicKey}`);
    console.log(`Private Key: ${privateKey}`);
    switch (blockchainId) {
        case 0:
            var btcAddress = getBtcAddress(keyPair.privateKey);
            return {
                "walletIndex" : walletIndex,
                "path" : path,
                "publicKey" : publicKey,
                "privateKey" : privateKey,
                "btcAddress" : btcAddress
            }
        case 60:
            var ethAddress = getEthAddress(keyPair.privateKey);
            return {
                "walletIndex" : walletIndex,
                "path" : path,
                "publicKey" : publicKey,
                "privateKey" : privateKey,
                "ethAddress" : ethAddress
            }
    }
    console.log('\n');
}

// gets the eth address using the private key
function getEthAddress(privateKeyIn) {
    const privKeyBuffer = ethUtil.toBuffer(ethUtil.addHexPrefix(privateKeyIn));
    const addressBuffer = ethUtil.privateToAddress(privKeyBuffer);
    const hexAddress = addressBuffer.toString('hex');
    const checksumAddress = ethUtil.toChecksumAddress(hexAddress);
    return ethUtil.addHexPrefix(checksumAddress);
}

// gets the btc address using the private key
function getBtcAddress(privateKey) {
    return bitcore_lib_1.PrivateKey.fromString(privateKey).toAddress(getBlockchainNetwork()).toString();
}


function main() {
    MAINNET_MODE = true;
    START_WALLET_INDEX = 0;
    NUM_WALLETS = program.walletCount;
    console.log(`Generating addresses for wallet ${START_WALLET_INDEX}`
        + ` through ${START_WALLET_INDEX + NUM_WALLETS}`);
    console.log('\n');
    
    promptInputAsPromise(buildSeedPromptSchema())
        .then((input) => {
        const mnemonic = promptInputToMnemonic(input);
        if (!Bip39.validateMnemonic(mnemonic)) {
            console.log(`Invalid mnemonic provided.`);
            process.exit(1);
        }
        const seed = Bip39.mnemonicToSeedHex(mnemonic, '');
        printExtendedKeys(seed, EXTENDED_KEYPAIR_PATH);
        printWallets(seed, NUM_WALLETS);
    });
}
main();
//# sourceMappingURL=index.js.map