import { useState, useEffect } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Plus, Minus, Send, ArrowUpRight, ArrowDownLeft,
  Search, Settings, History, PieChart, AlertCircle, CheckCircle, Clock, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { tradingEngine } from '@/services/tradingEngine';
import { internalWalletService } from '@/services/internalWalletService';
import { walletService } from '@/services/walletService';

export default function Trading() {
  const [activeTab, setActiveTab] = useState('overview');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [positions, setPositions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchSymbol, setSearchSymbol] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [orderForm, setOrderForm] = useState({
    symbol: 'BTCUSDT',
    type: 'buy' as 'buy' | 'sell',
    orderType: 'market' as 'market' | 'limit',
    tradingType: 'spot' as 'spot' | 'futures',
    quantity: 0.1,
    price: 45000,
    leverage: 1,
  });
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Connect wallet
  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      const wallet = await walletService.connectMetaMask();
      setWalletConnected(true);
      setWalletAddress(wallet.address);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please ensure MetaMask is installed.');
    } finally {
      setLoading(false);
    }
  };

  // Load trading data
  const loadTradingData = async () => {
    try {
      // Mock wallet ID (in real app, get from user session)
      const mockWalletId = 'wallet-123';
      
      const userPositions = await tradingEngine.getUserPositions(mockWalletId);
      const orderHistory = await tradingEngine.getOrderHistory(mockWalletId);
      const tradingStats = await tradingEngine.getTradingStats(mockWalletId);

      setPositions(userPositions);
      setOrders(orderHistory);
      setStats(tradingStats);
    } catch (error) {
      console.error('Failed to load trading data:', error);
    }
  };

  // Search asset
  const handleSearchAsset = async () => {
    try {
      const asset = await tradingEngine.searchAsset(searchSymbol.toUpperCase());
      setSelectedAsset(asset);
    } catch (error) {
      console.error('Failed to search asset:', error);
    }
  };

  // Create order
  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      const mockWalletId = 'wallet-123';
      
      await tradingEngine.createOrder(
        mockWalletId,
        orderForm.symbol,
        orderForm.type,
        orderForm.orderType,
        orderForm.tradingType,
        orderForm.quantity,
        orderForm.price,
        orderForm.leverage
      );

      setShowOrderModal(false);
      loadTradingData();
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTradingData();
    const interval = setInterval(loadTradingData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Wallet className="w-8 h-8 text-emerald-400" />
              Trading Dashboard
            </h1>
            <p className="text-slate-400 mt-2">Spot & Futures Trading with Real-Time Analytics</p>
          </div>
          <Button
            onClick={handleConnectWallet}
            disabled={walletConnected || loading}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {walletConnected ? `Connected: ${walletAddress.slice(0, 6)}...` : 'Connect Wallet'}
          </Button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Total Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  ${(stats.totalVolume / 1000000).toFixed(2)}M
                </div>
                <p className="text-xs text-slate-500 mt-1">{stats.totalTrades} trades</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-400">{stats.winRate.toFixed(1)}%</div>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.winningTrades}W / {stats.losingTrades}L
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Total Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-400">
                  ${stats.totalFees.toFixed(2)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Platform: ${stats.totalPlatformFees.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className={`bg-slate-800/50 border-slate-700`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${stats.totalProfitLoss.toFixed(2)}
                </div>
                <p className="text-xs text-slate-500 mt-1">{stats.openPositions} open positions</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-800 border-b border-slate-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="search">Search Assets</TabsTrigger>
            <TabsTrigger value="trade">New Trade</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Trading Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Total Trades</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalTrades || 0}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Open Positions</p>
                    <p className="text-2xl font-bold text-white">{stats?.openPositions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Positions Tab */}
          <TabsContent value="positions" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Open Positions</CardTitle>
              </CardHeader>
              <CardContent>
                {positions.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No open positions</p>
                ) : (
                  <div className="space-y-3">
                    {positions.map((pos) => (
                      <div
                        key={pos.symbol}
                        className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                      >
                        <div>
                          <p className="font-semibold text-white">{pos.symbol}</p>
                          <p className="text-sm text-slate-400">{pos.quantity} @ ${pos.averageEntryPrice}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${pos.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ${pos.profitLoss.toFixed(2)}
                          </p>
                          <p className="text-sm text-slate-400">{pos.profitLossPercentage.toFixed(2)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Order History</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No orders yet</p>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 10).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                      >
                        <div className="flex items-center gap-3">
                          {order.type === 'buy' ? (
                            <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-red-400" />
                          )}
                          <div>
                            <p className="font-semibold text-white">{order.symbol}</p>
                            <p className="text-sm text-slate-400">{order.quantity} @ ${order.price}</p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            order.status === 'filled'
                              ? 'default'
                              : order.status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search Assets Tab */}
          <TabsContent value="search" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Search & Analyze Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter symbol (e.g., BTCUSDT, ETHUSDT)"
                    value={searchSymbol}
                    onChange={(e) => setSearchSymbol(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Button onClick={handleSearchAsset} className="bg-emerald-500 hover:bg-emerald-600">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {selectedAsset && (
                  <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                    <h3 className="text-xl font-bold text-white mb-3">{selectedAsset.name}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 text-sm">Price</p>
                        <p className="text-2xl font-bold text-white">${selectedAsset.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">24h Change</p>
                        <p className={`text-2xl font-bold ${selectedAsset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {selectedAsset.change24h.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">24h Volume</p>
                        <p className="text-lg font-semibold text-white">${(selectedAsset.volume24h / 1000000000).toFixed(2)}B</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Market Cap</p>
                        <p className="text-lg font-semibold text-white">${(selectedAsset.marketCap / 1000000000).toFixed(2)}B</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trade Tab */}
          <TabsContent value="trade" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Create New Trade Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Symbol</label>
                    <Input
                      value={orderForm.symbol}
                      onChange={(e) => setOrderForm({ ...orderForm, symbol: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Trading Type</label>
                    <select
                      value={orderForm.tradingType}
                      onChange={(e) => setOrderForm({ ...orderForm, tradingType: e.target.value as any })}
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded p-2 mt-1"
                    >
                      <option value="spot">Spot</option>
                      <option value="futures">Futures</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Type</label>
                    <select
                      value={orderForm.type}
                      onChange={(e) => setOrderForm({ ...orderForm, type: e.target.value as any })}
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded p-2 mt-1"
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Order Type</label>
                    <select
                      value={orderForm.orderType}
                      onChange={(e) => setOrderForm({ ...orderForm, orderType: e.target.value as any })}
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded p-2 mt-1"
                    >
                      <option value="market">Market</option>
                      <option value="limit">Limit</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Quantity</label>
                    <Input
                      type="number"
                      value={orderForm.quantity}
                      onChange={(e) => setOrderForm({ ...orderForm, quantity: parseFloat(e.target.value) })}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Price</label>
                    <Input
                      type="number"
                      value={orderForm.price}
                      onChange={(e) => setOrderForm({ ...orderForm, price: parseFloat(e.target.value) })}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                    />
                  </div>
                </div>

                {orderForm.tradingType === 'futures' && (
                  <div>
                    <label className="text-sm text-slate-400">Leverage</label>
                    <Input
                      type="number"
                      value={orderForm.leverage}
                      onChange={(e) => setOrderForm({ ...orderForm, leverage: parseFloat(e.target.value) })}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                    />
                  </div>
                )}

                <Button
                  onClick={handleCreateOrder}
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                >
                  {loading ? 'Creating Order...' : 'Create Order'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
