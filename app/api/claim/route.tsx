import { ethers } from "ethers";
import { isAddress } from "@ethersproject/address";
import dotenv from "dotenv";

dotenv.config();

const MONAD_TESTNET_RPC = "https://testnet-rpc.monad.xyz";
const CLAIM_AMOUNT = BigInt(ethers.parseEther("0.2").toString());
const CLAIM_INTERVAL = 24 * 60 * 60 * 1000; // 24 jam

// Simpan data klaim di memory (sementara, akan direset saat redeploy)
let claimsData: Record<string, number> = {};

// Reading claim data (dari memory)
function readClaimsData() {
  return claimsData;
}

// Saving claim data (ke memory)
function saveClaimsData(newClaimsData: Record<string, number>) {
  claimsData = newClaimsData;
}

// POST endpoint for claiming tokens
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { walletAddress } = body;

    if (!walletAddress || !isAddress(walletAddress)) {
      return new Response(JSON.stringify({ error: "Invalid wallet address!" }), { status: 400 });
    }

    const claimsData = readClaimsData();
    const lastClaimTime = claimsData[walletAddress] || 0;
    const currentTime = Date.now();

    if (currentTime - lastClaimTime < CLAIM_INTERVAL) {
      return new Response(JSON.stringify({ error: "You can only claim once every 24 hours!" }), { status: 400 });
    }

    claimsData[walletAddress] = currentTime;
    saveClaimsData(claimsData);

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
