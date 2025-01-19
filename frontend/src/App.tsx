import {
  type ConnectOptions,
  type DisconnectOptions,
  type StarknetWindowObject,
  connect,
  disconnect,
} from "get-starknet";
import { useState } from "react";
import Nav from "./components/nav";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import VerificationPage from "./pages/VerificationPage";

function App() {
  const [walletInfo, setWalletInfo] = useState<StarknetWindowObject | null>(
    null
  );

  function handleConnect(options?: ConnectOptions) {
    return async () => {
      const res: StarknetWindowObject | null = await connect(options);
      console.log({ res });
      setWalletInfo(res || null);
    };
  }

  function handleDisconnect(options?: DisconnectOptions) {
    return async () => {
      await disconnect(options);
      setWalletInfo(null); // Clear wallet info
    };
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <BrowserRouter>
        <Nav
          handleConnect={handleConnect}
          handleDisconnect={handleDisconnect}
          walletInfo={walletInfo}
        />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/verify/:userId" element={<VerificationPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
