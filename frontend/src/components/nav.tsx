import type { ConnectOptions, DisconnectOptions } from "get-starknet";

import React from "react";
import { shortenAddress } from "../utils/utils";

interface NavProps {
  handleConnect: (options?: ConnectOptions) => () => void;
  handleDisconnect: (options?: DisconnectOptions) => () => void;
  walletInfo: any;
}

function Nav({ handleConnect, handleDisconnect, walletInfo }: NavProps) {
  return (
    <nav className="bg-transparent py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-white">StarkGate</div>

          <div className="flex items-center space-x-4">
            <a
              href="https://t.me/starkchathelper_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Join on Telegram
            </a>
            {walletInfo && walletInfo.isConnected && (
              <div className="flex items-center space-x-2">
                <img
                  src={walletInfo.icon}
                  alt={`${walletInfo.name} icon`}
                  className="w-6 h-6"
                />
                <span className="text-white">{walletInfo.name}</span>
                <span className="text-white text-sm">
                  {shortenAddress(walletInfo.selectedAddress)}
                </span>
                <button
                  onClick={handleDisconnect({ clearLastWallet: true })}
                  className="bg-gray-700 text-white px-2 py-1 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}
            <div className="flex space-x-4">
              {!walletInfo?.isConnected && (
                <button
                  onClick={handleConnect({
                    modalMode: "alwaysAsk",
                    modalTheme: "dark",
                  })}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Nav;
