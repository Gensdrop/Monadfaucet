import { ethers } from "ethers";
import { isAddress } from "@ethersproject/address";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const MONAD_TESTNET_RPC = "https://testnet-rpc.monad.xyz";
const CLAIM_AMOUNT = BigInt(ethers.parseEther("0.2").toString());
const CLAIM_INTERVAL = 86400; // 24 hours in seconds

// Ensure REDIS_URL is defined before initializing Redis
if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not defined in environment variables!");
}

const redis = new Redis(process.env.REDIS_URL);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { walletAddress } = body;

    if (!walletAddress || !isAddress(walletAddress)) {
      return new Response(JSON.stringify({ error: "Invalid wallet address!" }), { status: 400 });
    }

    const userIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown_ip";
    const walletKey = `wallet:${walletAddress}`;
    const ipKey = `ip:${userIP}`;

    // Check if wallet or IP has claimed in the last 24 hours
    const [walletClaim, ipClaim] = await Promise.all([
      redis.get(walletKey),
      redis.get(ipKey),
    ]);

    if (walletClaim || ipClaim) {
      return new Response(JSON.stringify({ error: "You can only claim once every 24 hours!" }), { status: 400 });
    }

    // Store claim record in Redis with 24-hour expiry
    await Promise.all([
      redis.set(walletKey, "claimed", "EX", CLAIM_INTERVAL),
      redis.set(ipKey, "claimed", "EX", CLAIM_INTERVAL),
    ]);

    // Ensure MONAD_PRIVATE_KEY is available
    const privateKey = process.env.MONAD_PRIVATE_KEY;
    if (!privateKey) {
      return new Response(JSON.stringify({ error: "Private key not found in environment variables!" }), { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(MONAD_TESTNET_RPC);
    const wallet = new ethers.Wallet(privateKey, provider);

    const tx = await wallet.sendTransaction({
      to: walletAddress,
      value: CLAIM_AMOUNT,
    });

    try {
      await tx.wait(); // Wait for transaction to be confirmed
    } catch (txError) {
      return new Response(JSON.stringify({
        error: `Transaction failed: ${txError instanceof Error ? txError.message : String(txError)}`
      }), { status: 500 });
    }

    // Close Redis connection after claim
    redis.quit();

    return new Response(JSON.stringify({ success: true, txHash: tx.hash }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({
      error: `Failed to process request: ${error instanceof Error ? error.message : String(error)}`
    }), { status: 500 });
  }
}
