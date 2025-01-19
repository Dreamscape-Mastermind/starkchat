import React, { useEffect, useState } from "react";

import axios from "axios";
import {
  type ConnectOptions,
  type DisconnectOptions,
  type StarknetWindowObject,
  connect,
  disconnect,
} from "get-starknet";
import { useParams } from "react-router-dom";
import { shortenAddress } from "../utils/utils";

const API_URL = import.meta.env.VITE_API_URL;

function VerificationPage() {
  const { userId } = useParams<{ userId: string }>();
  const [address, setAddress] = useState<string | null>(null);
  const [challenge, setChallenge] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchChallenge();
    }
  }, [userId]);

  const fetchChallenge = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/challenge/${userId}`);
      setChallenge(response.data.challenge);
    } catch (err) {
      setError("Failed to fetch challenge");
      setStatus("error");
    }
  };

  const connectWallet = async () => {
    try {
      const response: StarknetWindowObject | null = await connect({
        modalMode: "alwaysAsk",
        modalTheme: "dark",
      });
      if (response) {
        if (!response.isConnected) {
          await response.enable();
        }
        setAddress(response.selectedAddress || response.account.address);
      }
    } catch (err) {
      setError("Failed to connect wallet" + err);
    }
  };

  const handleVerification = async () => {
    if (!address || !challenge || !userId) return;

    setStatus("loading");
    setError(null);

    try {
      const connectResponse: StarknetWindowObject | null = await connect();
      if (connectResponse) {
        if (!connectResponse.isConnected) {
          await connectResponse.enable();
        }

        const signature = await connectResponse.account.signMessage({
          domain: window.location.host,
          message: challenge,
        });

        console.log(signature);

        const response = await axios.post(`${API_URL}/api/verify`, {
          userId,
          walletAddress: address,
          signature,
        });

        if (response.data.success) {
          setInviteLink(response.data.inviteLink);
          setStatus("success");
        } else {
          throw new Error("Verification failed");
        }
      }
    } catch (err: any) {
      setError(
        "Verification error: " +
          (err.response?.data?.error || err.message || "Verification failed")
      );
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Wallet Verification</h1>

        {!address ? (
          <div>
            <p className="mb-4">
              Connect your wallet to verify ownership and join the group.
            </p>
            <button
              onClick={connectWallet}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Connect Wallet
            </button>
          </div>
        ) : status === "success" ? (
          <div>
            <p className="text-green-600 mb-4">Verification successful!</p>
            <a
              href={inviteLink!}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Join Group
            </a>
          </div>
        ) : (
          <div>
            <p className="mb-4">Wallet connected: {shortenAddress(address)}</p>
            <button
              onClick={handleVerification}
              disabled={status === "loading"}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400"
            >
              {status === "loading" ? "Verifying..." : "Verify Wallet"}
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export default VerificationPage;
