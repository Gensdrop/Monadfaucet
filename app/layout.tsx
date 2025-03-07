import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monad Faucet Testnet - Claim 0.2 MON",
  description: "Claim free 0.2 Monad testnet tokens (once per 24 hours) for testing on Monad blockchain.",
  openGraph: {
    title: "Monad Faucet Testnet",
    description: "Claim free Monad testnet tokens for your projects.",
    images: ["/monadfaucet.png"],
  },
  other: {
    // Meta tag untuk Frame v2 Farcaster
    "fc:frame": "v2",
    "fc:frame:image": "https://frames-monad-faucet.vercel.app/monadfaucet.png",
    "fc:frame:button:1": "Claim Token",
    "fc:frame:button:1:action": "post",
    "fc:frame:button:1:target": "/api/claim",
    "fc:frame:post_url": "https://frames-monad-faucet.vercel.app/api/claim",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
