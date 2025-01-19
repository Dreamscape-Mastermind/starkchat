import { Link } from "react-router-dom";

function HomePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-6">
          Welcome to the StarkNet Community
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Join our exclusive token-gated Telegram community. Connect your
          StarkNet wallet, verify your token holdings, and become part of the
          conversation.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-800 p-6 rounded-xl">
            <div className="text-blue-500 text-4xl mb-4">1</div>
            <h3 className="text-white text-xl font-semibold mb-2">
              Connect Bot
            </h3>
            <p className="text-gray-400">
              Start a chat with our Telegram bot to begin the verification
              process
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl">
            <div className="text-blue-500 text-4xl mb-4">2</div>
            <h3 className="text-white text-xl font-semibold mb-2">
              Verify Wallet
            </h3>
            <p className="text-gray-400">
              Connect your StarkNet wallet and sign a message to prove ownership
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl">
            <div className="text-blue-500 text-4xl mb-4">3</div>
            <h3 className="text-white text-xl font-semibold mb-2">
              Join Community
            </h3>
            <p className="text-gray-400">
              Get instant access to our private Telegram group
            </p>
          </div>
        </div>

        <div className="bg-gray-800 p-8 rounded-xl mb-16">
          <h2 className="text-2xl font-bold text-white mb-4">Requirements</h2>
          <div className="flex justify-center items-center space-x-8">
            <div>
              <p className="text-gray-300">Minimum Token Balance</p>
              <p className="text-3xl font-bold text-blue-500">1.0 TOKEN</p>
            </div>
            <div>
              <p className="text-gray-300">Supported Wallets</p>
              <div className="flex space-x-4 mt-2">
                <span className="bg-gray-700 text-white px-4 py-1 rounded">
                  ArgentX
                </span>
                <span className="bg-gray-700 text-white px-4 py-1 rounded">
                  Braavos
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-gray-400 text-sm">
          <p>
            Need help? Join our{" "}
            <a
              href="https://t.me/your_support_group"
              className="text-blue-500 hover:text-blue-400"
            >
              support group
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

export default HomePage;
