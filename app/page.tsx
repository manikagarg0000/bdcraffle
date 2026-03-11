'use client';
import { useState, useEffect } from 'react';

const BDC_TOKEN = 'opt1sqrapk4rqwd15d77p6pqeqe2cm50x877j6vkmq3sf';
const RAFFLE_CONTRACT = 'opt1sqrlrsan0rwjz2l5yvs8qwd6tyl05z3gdkg4hlfmz';

export default function Home() {
  const [tab, setTab] = useState<'raffle' | 'token'>('raffle');
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [tickets, setTickets] = useState(0);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const data = await res.json();
        setBtcPrice(data.bitcoin.usd);
      } catch {}
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  const getProvider = () => {
    const win = window as any;
    return win.opnet || win.unisat || win.bitcoin || null;
  };

  const connectWallet = async () => {
    const provider = getProvider();
    if (!provider) {
      setStatus('OP_NET Wallet extension not found. Please install it first.');
      setStatusType('error');
      return;
    }
    setLoading(true);
    try {
      const accounts = await provider.requestAccounts();
      if (accounts?.length > 0) {
        setAddress(accounts[0]);
        setConnected(true);
        setStatus('Wallet connected successfully!');
        setStatusType('success');
      }
    } catch (e: any) {
      setStatus(e.message || 'Connection failed');
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  const buyTicket = async () => {
    if (!connected) {
      setStatus('Please connect your wallet first.');
      setStatusType('error');
      return;
    }
    const provider = getProvider();
    if (!provider) {
      setStatus('Wallet provider not found.');
      setStatusType('error');
      return;
    }
    setLoading(true);
    setStatus('Waiting for wallet confirmation...');
    setStatusType('info');
    try {
      const { TransactionFactory } = await import('@btc-vision/walletconnect');
      const factory = new TransactionFactory();
      const hex = '14c6d469';
const calldata = new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
      const interaction = await factory.signInteraction({
        to: RAFFLE_CONTRACT,
        calldata,
        satoshis: BigInt(10000),
      });
      const win = window as any;
      const result = await win.opnet.signAndBroadcastInteraction(interaction);
      setTickets(t => t + 1);
      setStatus('Ticket purchased! TX: ' + String(result?.txid || '').slice(0, 24) + '...');
      setStatusType('success');
    } catch (e: any) {
      if (e.code === 4001 || e.message?.includes('reject') || e.message?.includes('cancel')) {
        setStatus('Transaction cancelled.');
      } else {
        setStatus(e.message || 'Transaction failed');
      }
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  const shortAddr = (addr: string) => (addr ? addr.slice(0, 8) + '...' + addr.slice(-6) : '');

  const statusColors = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    success: 'bg-green-500/10 border-green-500/30 text-green-300',
    error: 'bg-red-500/10 border-red-500/30 text-red-300',
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex">
      <aside className="w-60 bg-gray-900 border-r border-white/10 flex flex-col min-h-screen fixed left-0 top-0 bottom-0">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center font-bold text-black text-lg">৳</div>
            <div>
              <p className="font-bold text-white text-sm">BDC Finance</p>
              <p className="text-xs text-gray-500">OP_NET Testnet</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-xs text-gray-500 mb-1">BTC Price (Live)</p>
          {btcPrice ? (
            <p className="text-2xl font-bold text-orange-400">${btcPrice.toLocaleString()}</p>
          ) : (
            <div className="h-8 w-32 bg-white/5 rounded-lg animate-pulse" />
          )}
          <p className="text-xs text-gray-600 mt-1">Updates every 30s</p>
        </div>

        <nav className="px-3 py-4 flex-1">
          <p className="text-xs text-gray-500 px-2 mb-2 uppercase tracking-wider">Menu</p>
          {[
            { id: 'raffle', icon: '🎟️', label: 'Raffle' },
            { id: 'token', icon: '🪙', label: 'BDC Token' },
          ].map((item) => (
            <button key={item.id} onClick={() => setTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition ${tab === item.id ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:bg-white/5'}`}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500 px-2 mb-2 uppercase tracking-wider">Links</p>
            {[
              { label: '🔍 OP_SCAN', href: `https://opscan.org/accounts/${RAFFLE_CONTRACT}?network=op_testnet` },
              { label: '💧 Faucet', href: 'https://faucet.opnet.org' },
              { label: '📄 Docs', href: 'https://docs.opnet.org' },
            ].map((l) => (
              <a key={l.label} href={l.href} target="_blank"
                className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition">
                {l.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          {connected ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <p className="text-xs text-green-400 font-mono">{shortAddr(address)}</p>
              </div>
              <button onClick={() => { setConnected(false); setAddress(''); setStatus(''); }}
                className="w-full text-xs bg-red-500/20 text-red-400 border border-red-500/30 py-1.5 rounded-lg hover:bg-red-500/30 transition">
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={connectWallet} disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-2 rounded-xl text-sm transition disabled:opacity-50">
              {loading ? 'Connecting...' : '🔗 Connect Wallet'}
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col ml-60">
        <header className="border-b border-white/10 px-6 py-3 flex items-center justify-between bg-gray-900/50 sticky top-0 z-10">
          <div>
            <h1 className="font-bold text-white">{tab === 'raffle' ? '🎟️ Raffle' : '🪙 BDC Token'}</h1>
            <p className="text-xs text-gray-500">Bitcoin Testnet • OP_NET Protocol</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 px-3 py-1 rounded-full">⚡ Testnet</span>
            {!connected && (
              <button onClick={connectWallet} disabled={loading}
                className="text-sm bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-1.5 rounded-full transition disabled:opacity-50">
                {loading ? '...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 p-6">
          {status && (
            <div className={`mb-4 p-3 rounded-xl border text-sm flex items-start gap-2 ${statusColors[statusType]}`}>
              <span>{statusType === 'success' ? '✅' : statusType === 'error' ? '❌' : '⏳'}</span>
              <span className="break-all">{status}</span>
            </div>
          )}

          {tab === 'raffle' ? (
            <div className="max-w-2xl space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Tickets', value: tickets.toString(), color: 'text-green-400' },
                  { label: 'Prize Pool', value: `${(tickets * 10000).toLocaleString()} sat`, color: 'text-yellow-400' },
                  { label: 'Ticket Price', value: '10,000 sat', color: 'text-blue-400' },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-900 border border-white/10 rounded-2xl p-4 text-center">
                    <p className="text-gray-500 text-xs mb-1">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-1">BDC Raffle</h2>
                <p className="text-gray-400 text-sm mb-5">Buy a ticket with tBTC. The smart contract picks a random winner who receives the full prize pool in BDC tokens.</p>

                <div className="bg-black/30 rounded-xl p-4 mb-5">
                  <p className="text-white font-semibold text-sm mb-2">How it works</p>
                  <ol className="text-gray-400 text-xs space-y-1.5 list-decimal list-inside">
                    <li>Connect your OP_NET Wallet extension</li>
                    <li>Click Buy Ticket — costs 10,000 sat tBTC</li>
                    <li>Confirm the transaction in your wallet</li>
                    <li>Winner receives the entire prize pool in BDC!</li>
                  </ol>
                </div>

                <button onClick={buyTicket} disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl transition text-base mb-3">
                  {loading ? '⏳ Processing...' : connected ? '🎟️ Buy Ticket (10,000 sat)' : '🔗 Connect Wallet to Buy'}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <a href={`https://opscan.org/accounts/${RAFFLE_CONTRACT}?network=op_testnet`} target="_blank"
                    className="text-center bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm py-2 rounded-xl transition">
                    🔍 View Contract
                  </a>
                  <a href="https://faucet.opnet.org" target="_blank"
                    className="text-center bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm py-2 rounded-xl transition">
                    💧 Get tBTC
                  </a>
                </div>
              </div>

              <div className="bg-gray-900 border border-white/10 rounded-2xl p-4">
                <p className="text-gray-500 text-xs mb-1">Raffle Contract Address</p>
                <p className="text-green-300 font-mono text-sm break-all">{RAFFLE_CONTRACT}</p>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl space-y-4">
              <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-3xl font-bold text-black">৳</div>
                  <div>
                    <h2 className="text-2xl font-bold">BangladeshCoin</h2>
                    <p className="text-green-400 font-bold font-mono">$BDC</p>
                    <p className="text-gray-400 text-xs">First Bangladeshi token on Bitcoin</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  {[
                    { label: 'Max Supply', value: '1,000,000,000', sub: 'BDC' },
                    { label: 'Decimals', value: '18', sub: 'precision' },
                    { label: 'Network', value: 'Bitcoin Testnet', sub: 'OP_NET' },
                    { label: 'Standard', value: 'OP_20', sub: 'like ERC-20' },
                  ].map((item) => (
                    <div key={item.label} className="bg-black/30 rounded-xl p-4">
                      <p className="text-gray-500 text-xs mb-1">{item.label}</p>
                      <p className="text-white font-bold">{item.value}</p>
                      <p className="text-gray-600 text-xs">{item.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-black/20 rounded-xl p-4 mb-5">
                  <p className="text-white font-semibold text-sm mb-2">About BDC</p>
                  <p className="text-gray-400 text-xs leading-relaxed">BangladeshCoin (BDC) is an OP_20 token deployed on Bitcoin Testnet using the OP_NET protocol. Representing Bangladesh in the Bitcoin ecosystem.</p>
                </div>

                <a href={`https://opscan.org/accounts/${BDC_TOKEN}?network=op_testnet`} target="_blank"
                  className="block w-full text-center bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition">
                  🔍 View on OP_SCAN
                </a>
              </div>

              <div className="bg-gray-900 border border-white/10 rounded-2xl p-4">
                <p className="text-gray-500 text-xs mb-1">Token Contract Address</p>
                <p className="text-green-300 font-mono text-sm break-all">{BDC_TOKEN}</p>
              </div>
            </div>
          )}
        </div>

        <footer className="border-t border-white/10 px-6 py-3 text-center">
          <p className="text-gray-600 text-xs">Built on Bitcoin • OP_NET Protocol • Bitcoin Hackathon Week 3 2026 • by manikagarg0000</p>
        </footer>
      </div>
    </main>
  );
}