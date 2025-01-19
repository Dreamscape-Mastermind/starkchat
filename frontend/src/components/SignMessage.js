import "./SignMessage.css";

import React, { useEffect, useState } from "react";

import { connect } from "get-starknet";
import { hash } from "starknet";
import { useSearchParams } from "react-router-dom";

const SignMessage = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const challenge = searchParams.get("challenge");
  const wallet = searchParams.get("wallet");
  const userId = searchParams.get("userId");

  const handleSign = async () => {
    setLoading(true);
    setError(null);

    console.log(await connect());

    try {
      const starknet = await connect();

      if (!starknet) {
        throw new Error("Please install a StarkNet wallet");
      }

      // Format the message according to StarkNet's requirements
      //   const messageHash = starknet.utils.hash.getSelectorFromName(challenge);
      const messageHash = hash.getSelectorFromName(challenge);

      const signature = await starknet.account.signMessage({
        message: [messageHash],
        primaryType: "Message",
        domain: {
          name: "Starknet Telegram Bot",
          version: "0.0.1",
          chainId: await starknet.provider.getChainId(),
        },
        types: {
          Message: [{ name: "message", type: "felt" }],
          StarkNetDomain: [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "felt" },
          ],
        },
      });

      // Send signature to backend
      const response = await fetch("/api/verify-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature,
          challenge,
          wallet,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to verify signature");
      }

      // Show success message and close window after delay
      alert("Signature verified successfully! You can close this window.");
      setTimeout(() => window.close(), 2000);
    } catch (error) {
      console.error("Error signing message:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sign-container">
      <h1>Sign Message</h1>
      <div className="wallet-info">
        <p>Wallet Address: {wallet}</p>
        <p>Challenge: {challenge}</p>
      </div>
      <button onClick={handleSign} disabled={loading} className="sign-button">
        {loading ? "Connecting..." : "Connect Wallet & Sign"}
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default SignMessage;
