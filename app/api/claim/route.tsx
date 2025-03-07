import { ethers } from "ethers";
import { isAddress } from "@ethersproject/address";
import dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config();

const redis = new Redis(process.env.REDIS_URL);
const MONAD_TESTNET_RPC = "https://testnet-rpc.monad.xyz";
const CLAIM_AMOUNT = BigInt(ethers.parseEther("0.2").toString());
const CLAIM_INTERVAL = 24 * 60 * 60 * 1000; // 24 jam

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { walletAddress } = body;

    if (!walletAddress || !isAddress(walletAddress)) {
      return new Response(JSON.stringify({ error: "Invalid wallet address!" }), { status: 400 });
    }

    const userIP = req.headers.get("x-forwarded-for") || "unknown-ip";
    const walletKey = `wallet:${walletAddress}`;
    const ipKey = `ip:${userIP}`;

    // Cek di Redis apakah wallet/IP sudah klaim dalam 24 jam terakhir
    const [walletClaim, ipClaim] = await Promise.all([
      redis.get(walletKey),
      redis.get(ipKey),
    ]);

    if (walletClaim || ipClaim) {
      return new Response(JSON.stringify({ error: "You can only claim once every 24 hours!" }), { status: 400 });
    }

    // Simpan klaim di Redis dengan TTL 24 jam
    await Promise.all([
      redis.set(walletKey, Date.now(), "EX", 86400),
      redis.set(ipKey, Date.now(), "EX", 86400),
    ]);

    // Kirim token Monad
    const provider = new ethers.JsonRpcProvider(MONAD_TESTNET_RPC);
    const privateKey = process.env.MONAD_PRIVATE_KEY;

    if (!privateKey) {
      return new Response(JSON.stringify({ error: "Private key not found in env!" }), { status: 500 });
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    const tx = await wallet.sendTransaction({
      to: walletAddress,
      value: CLAIM_AMOUNT,
    });

    await tx.wait();

    return new Response(JSON.stringify({ success: true, txHash: tx.hash }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({
      error: `Failed to send token: ${error instanceof Error ? error.message : String(error)}`
    }), { status: 500 });
  }
}
