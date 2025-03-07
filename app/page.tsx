"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import sdk from "@farcaster/frame-sdk";
import { isAddress } from "@ethersproject/address";
import Image from "next/image"; // Mengganti <img> dengan <Image> dari next/image
import "./styles.css"; // Using new CSS with animations

const Demo = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [shake, setShake] = useState(false); // For failed claim animation

  useEffect(() => {
    const load = async () => {
      await sdk.context; // Hanya simpan context jika benar-benar digunakan
      sdk.actions.ready();
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  const claimTokens = async () => {
    if (!walletAddress.trim() || !isAddress(walletAddress)) {
      setError("Enter a valid wallet address!");
      triggerShake(); // Shake effect if invalid address
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      const result = await response.json();
      if (result.error) {
        setError(result.error);
        triggerShake(); // Shake effect if already claimed
      } else {
        setSuccess(
          `Success! <a href="https://testnet.monadexplorer.com/tx/${result.txHash}" target="_blank">View on Explorer</a>`
        );
      }
    } catch {
      setError("An error occurred while claiming.");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // Shake animation for failed claim
  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="container">
      <div className="box">
        <Image
          src="/monadfaucet.png"
          alt="Monad Faucet Logo"
          className="full-image"
          width={300} // Sesuaikan ukuran default
          height={300} // Sesuaikan ukuran default
          priority // Opsional: untuk optimasi LCP
        />
        <p className="description">Enter your wallet address to claim 0.2 Monad (once per 24 hours)!</p>

        <input
          type="text"
          className="input"
          placeholder="0x..."
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
        />

        <button
          className={`button ${isLoading ? "loading" : ""} ${shake ? "shake" : ""}`}
          onClick={claimTokens}
          disabled={isLoading}
        >
          {isLoading ? <span className="loader"></span> : "Claim Token"}
        </button>

        {error && <p className="error fade-in">{error}</p>}
        {success && <p className="success fade-in" dangerouslySetInnerHTML={{ __html: success }}></p>}

        {/* Watermark */}
        <p className="watermark">Frame created by: <strong>@gensleader</strong></p>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Demo), { ssr: false });
