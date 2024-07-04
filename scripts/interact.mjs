import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,

} from '@solana/web3.js';
import {
    Program,
    AnchorProvider,
    Wallet,
} from '@project-serum/anchor';
import {
    TOKEN_PROGRAM_ID,
    createMint,
    getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import fs from 'fs';
import BN from "bn.js";
import 'dotenv/config.js'
// import {config} from "dotenv";
//
// config({path: "../.env"});

// Initialize connection to local Solana cluster
const connection = new Connection('http://127.0.0.1:8899', "confirmed");

// Load the keypair from a file (you need to create this file)
const IDL = JSON.parse(fs.readFileSync("./target/idl/my_token.json", 'utf-8'));
// * get key array from /Users/<username>/.config/solana/id.json
// const mintAuthority = Keypair.fromSecretKey(Uint8Array.from([156, 199, 1, 247, 18, 244, 169, 44, 133, 24, 199, 128, 109, 88, 140, 129, 55, 222, 50, 12, 51, 109, 95, 203, 9, 181, 228, 59, 107, 131, 54, 105, 160, 221, 32, 171, 247, 89, 162, 66, 128, 24, 16, 9, 128, 24, 100, 6, 31, 201, 85, 93, 27, 26, 119, 194, 232, 72, 23, 210, 242, 44, 51, 84]))
// Load the private key from .env and convert it to Uint8Array

const privateKeyString = process.env.PRIVATE_KEY;
const privateKeyArray = privateKeyString.split(',').map(num => parseInt(num, 10));
const privateKeyUint8Array = new Uint8Array(privateKeyArray);

// Create a Keypair from the private key
const mintAuthority = Keypair.fromSecretKey(privateKeyUint8Array);
// Create a wallet from the keypair
const wallet = new Wallet(mintAuthority);

// Define the program ID (replace with your actual program ID)
const programId = new PublicKey('H2aVd4L4Fnc3zs9oUd51vpjjYjyMPNT3yyLsH6RGCWzi');

async function main() {
    // Create a new mint
    const mint = await createMint(
        connection,
        mintAuthority,
        mintAuthority.publicKey,
        null,
        9 // 9 decimals
    );

    console.log('Mint created:', mint.toBase58());

    // Create token accounts for two users
    const user1 = Keypair.generate();
    const user2 = Keypair.generate();

    const user1TokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        mintAuthority,
        mint,
        user1.publicKey
    );

    const user2TokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        mintAuthority,
        mint,
        user2.publicKey
    );

    console.log('User 1 token account:', user1TokenAccount.address.toBase58());
    console.log('User 2 token account:', user2TokenAccount.address.toBase58());

    // Initialize the token (mint initial supply)
    const provider = new AnchorProvider(connection, wallet, {});
    const program = new Program(IDL, programId, provider);

    await program.methods.initialize(new BN(1000000000))
        .accounts({
            mint: mint,
            tokenAccount: user1TokenAccount.address,
            authority: mintAuthority.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        })
        .signers([mintAuthority])
        .rpc();

    console.log('Token initialized with 1000 tokens to User 1');

    // Transfer tokens from User 1 to User 2
    await program.methods.transfer(new BN(500000000))
        .accounts({
            from: user1TokenAccount.address,
            to: user2TokenAccount.address,
            authority: user1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();

    console.log('Transferred 500 tokens from User 1 to User 2');
}

main().catch((err) => {
    console.error(err);
});