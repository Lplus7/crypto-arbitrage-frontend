import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Activity, ArrowRight, RefreshCcw, Settings, Play, FlaskConical, Gamepad2, Wallet, TrendingUp, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import SettingsPanel from './components/SettingsPanel'
import StatsPanel from './components/StatsPanel'
import ExchangeStatus from './components/ExchangeStatus'
import AutoTraderPanel from './components/AutoTraderPanel'
import { getTradeUrl } from './utils/exchangeUrls'

// API URL - на проде используем прокси через Vercel (/api/v1)
// Локально - напрямую к серверу
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

// Компонент индикатора ликвидности
const LiquidityBadge = ({ score, size = 'sm' }) => {
  const getColor = (s) => {
    if (s >= 8) return 'bg-green-100 text-green-700 border-green-200'
    if (s >= 6) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    if (s >= 4) return 'bg-orange-100 text-orange-700 border-orange-200'
    return 'bg-red-100 text-red-700 border-red-200'
  }
  
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'
  
  return (
    <span className={`${sizeClass} rounded border font-medium ${getColor(score)}`}>
      {score}/10
    </span>
  )
}

// Компонент индикатора риска
const RiskBadge = ({ level }) => {
  const config = {
    LOW: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Низкий' },
    MEDIUM: { color: 'bg-yellow-100 text-yellow-700', icon: Info, label: 'Средний' },
    HIGH: { color: 'bg-orange-100 text-orange-700', icon: AlertTriangle, label: 'Высокий' },
    EXTREME: { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Критический' },
  }
  
  const { color, icon: Icon, label } = config[level] || config.MEDIUM
  
  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

// Компонент ссылки на биржу
const ExchangeLink = ({ exchange, pair, children, className = '' }) => {
  const url = getTradeUrl(exchange, pair)
  
  if (!url) {
    return <span className={className}>{children}</span>
  }
  
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 hover:underline ${className}`}
      title={`Открыть ${pair} на ${exchange}`}
    >
      {children}
      <ExternalLink className="w-3 h-3 opacity-60" />
    </a>
  )
}

// Компонент карточки спреда с ликвидностью
const SpreadCard = ({ data, onTrade, tradingMode }) => {
  const [liquidity, setLiquidity] = useState(null)
  const [loadingLiquidity, setLoadingLiquidity] = useState(false)
  const [expanded, setExpanded] = useState(false)
  
  const isProfit = data.net_spread_pct > 0
  const isHot = data.net_spread_pct >= 1.5
  
  // Загрузка ликвидности при раскрытии карточки
  const fetchLiquidity = async () => {
    if (liquidity || loadingLiquidity) return
    
    setLoadingLiquidity(true)
    try {
      const pair = data.pair.replace('/', '-')
      const response = await axios.get(
        `${API_BASE}/spreads/liquidity/${pair}?buy_exchange=${data.buy_exchange}&sell_exchange=${data.sell_exchange}`
      )
      setLiquidity(response.data)
    } catch (error) {
      console.error('Ошибка загрузки ликвидности:', error)
    } finally {
      setLoadingLiquidity(false)
    }
  }
  
  const handleExpand = () => {
    if (!expanded) {
      fetchLiquidity()
    }
    setExpanded(!expanded)
  }
  
  // Рассчитываем реальный профит если есть данные о ликвидности
  const getRealProfit = (amount) => {
    if (!liquidity?.summary) return null
    const slippage = liquidity.summary.total_slippage_pct || 0
    const grossProfit = data.profit_usdt * (amount / 1000)
    const slippageLoss = amount * slippage / 100
    return grossProfit - slippageLoss
  }
  
  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${isHot ? 'border-green-300 ring-2 ring-green-100' : 'border-slate-200'}`}>
      {/* Основная информация */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{data.pair}</h3>
            <span className="text-xs text-slate-500">
              {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Live'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {liquidity?.summary && (
              <RiskBadge level={liquidity.summary.risk_level} />
            )}
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${isProfit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {data.net_spread_pct?.toFixed(2) || data.spread_pct}%
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex flex-col">
            <span className="text-slate-400 text-xs">ПОКУПКА</span>
            <ExchangeLink 
              exchange={data.buy_exchange} 
              pair={data.pair}
              className="font-semibold text-green-700 hover:text-green-800"
            >
              {data.buy_exchange}
            </ExchangeLink>
            <span className="text-xs text-slate-400">${data.buy_price?.toFixed(6)}</span>
            {liquidity?.buy && (
              <div className="mt-1">
                <LiquidityBadge score={liquidity.buy.liquidity_score} />
              </div>
            )}
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300" />
          <div className="flex flex-col text-right">
            <span className="text-slate-400 text-xs">ПРОДАЖА</span>
            <ExchangeLink 
              exchange={data.sell_exchange} 
              pair={data.pair}
              className="font-semibold text-red-700 hover:text-red-800"
            >
              {data.sell_exchange}
            </ExchangeLink>
            <span className="text-xs text-slate-400">${data.sell_price?.toFixed(6)}</span>
            {liquidity?.sell && (
              <div className="mt-1">
                <LiquidityBadge score={liquidity.sell.liquidity_score} />
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
          <div>
            <span className="text-slate-500 text-sm">Профит ($1000):</span>
            <span className={`ml-2 font-mono font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              ${data.profit_usdt?.toFixed(2)}
            </span>
            {liquidity?.summary && (
              <span className="ml-1 text-xs text-slate-400">
                (реал: ${getRealProfit(1000)?.toFixed(2)})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isHot && onTrade && (
              <button
                onClick={() => onTrade(data)}
                className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
              >
                <Play className="w-3 h-3" />
                Trade
              </button>
            )}
            <button
              onClick={handleExpand}
              className="p-1 hover:bg-slate-100 rounded"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Расширенная информация о ликвидности */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          {loadingLiquidity ? (
            <div className="py-4 text-center text-slate-400 text-sm">
              Загрузка анализа ликвидности...
            </div>
          ) : liquidity ? (
            <div className="pt-3 space-y-3">
              {/* Быстрые ссылки на биржи */}
              <div className="flex gap-2 justify-center">
                <a 
                  href={getTradeUrl(data.buy_exchange, data.pair)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-full hover:bg-green-200 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Купить на {data.buy_exchange}
                </a>
                <a 
                  href={getTradeUrl(data.sell_exchange, data.pair)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-full hover:bg-red-200 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Продать на {data.sell_exchange}
                </a>
              </div>
              
              {/* Slippage */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 mb-2">📉 SLIPPAGE</h4>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {['100', '500', '1000', '5000'].map(amount => {
                    const buySlip = liquidity.buy?.slippage?.[amount] || 0
                    const sellSlip = liquidity.sell?.slippage?.[amount] || 0
                    const total = buySlip + sellSlip * 0.5
                    const color = total > 2 ? 'text-red-600' : total > 1 ? 'text-orange-600' : total > 0.5 ? 'text-yellow-600' : 'text-green-600'
                    
                    return (
                      <div key={amount} className="text-center p-2 bg-slate-50 rounded">
                        <div className="text-slate-400">${amount}</div>
                        <div className={`font-mono font-bold ${color}`}>{total.toFixed(2)}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Глубина стакана */}
              <div className="grid grid-cols-2 gap-3">
                {liquidity.buy && (
                  <div className="p-2 bg-green-50 rounded">
                    <div className="text-xs text-green-600 font-medium">Покупка ({liquidity.buy.exchange})</div>
                    <div className="text-sm font-bold">${liquidity.buy.depth_usdt?.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">Оптимум: ${liquidity.buy.optimal_size?.toLocaleString()}</div>
                  </div>
                )}
                {liquidity.sell && (
                  <div className="p-2 bg-red-50 rounded">
                    <div className="text-xs text-red-600 font-medium">Продажа ({liquidity.sell.exchange})</div>
                    <div className="text-sm font-bold">${liquidity.sell.depth_usdt?.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">Оптимум: ${liquidity.sell.optimal_size?.toLocaleString()}</div>
                  </div>
                )}
              </div>
              
              {/* Рекомендации */}
              {liquidity.summary && (
                <div className="p-2 bg-blue-50 rounded">
                  <div className="text-xs text-blue-600 font-medium mb-1">📏 Рекомендации</div>
                  <div className="text-sm">
                    Оптимальная сумма: <span className="font-bold">${liquidity.summary.optimal_amount_usdt?.toLocaleString()}</span>
                  </div>
                  <div className="text-sm">
                    Реальный профит: <span className={`font-bold ${getRealProfit(liquidity.summary.optimal_amount_usdt) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${getRealProfit(liquidity.summary.optimal_amount_usdt)?.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Факторы риска */}
              {liquidity.summary?.risk_factors && (
                <div className="text-xs space-y-1">
                  {liquidity.summary.risk_factors.map((factor, i) => (
                    <div key={i} className="text-slate-600">{factor}</div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-slate-400 text-sm">
              Не удалось загрузить данные о ликвидности
            </div>
          )}
        </div>
      )}
    </div>
  )
}


// Компонент выбора режима торговли
const TradingModeSelector = ({ mode, onChange, status }) => {
  const modes = [
    { id: 'simulation', label: 'Симуляция', icon: Gamepad2, color: 'blue', desc: 'Виртуальные сделки' },
    { id: 'testnet', label: 'Testnet', icon: FlaskConical, color: 'purple', desc: 'Тестовая сеть' },
    { id: 'live', label: 'Live', icon: Wallet, color: 'red', desc: 'Реальные деньги!' },
  ]
  
  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
      {modes.map(m => {
        const Icon = m.icon
        const isActive = mode === m.id
        const isDisabled = m.id === 'live' && status?.use_testnet
        
        return (
          <button
            key={m.id}
            onClick={() => !isDisabled && onChange(m.id)}
            disabled={isDisabled}
            title={isDisabled ? 'Live режим отключен (USE_TESTNET=True)' : m.desc}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all
              ${isActive 
                ? `bg-${m.color}-600 text-white shadow-sm` 
                : 'text-slate-600 hover:bg-slate-200'}
              ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Icon className="w-3.5 h-3.5" />
            {m.label}
          </button>
        )
      })}
    </div>
  )
}

function App() {
  const [spreads, setSpreads] = useState([])
  const [loading, setLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [tradingStatus, setTradingStatus] = useState(null)
  const [tradingMode, setTradingMode] = useState('simulation')

  // Загрузка статуса торгового модуля
  const fetchTradingStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/trading/status`)
      setTradingStatus(response.data)
      if (response.data.use_testnet && tradingMode === 'live') {
        setTradingMode('testnet')
      }
    } catch (error) {
      console.error("Ошибка получения статуса:", error)
    }
  }, [tradingMode])

  const fetchSpreads = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE}/spreads/live`)
      setSpreads(response.data.spreads || [])
    } catch (error) {
      console.error("Ошибка API:", error)
      try {
        const fallback = await axios.get(`${API_BASE}/scanner/test-spreads`)
        setSpreads(fallback.data || [])
      } catch (e) {
        console.error("Fallback failed:", e)
      }
    } finally {
      setLoading(false)
    }
  }, [])


  const executeTrade = async (spread) => {
    const modeLabels = {
      simulation: '🎮 Симуляция',
      testnet: '🧪 Testnet',
      live: '💰 Live'
    }
    
    try {
      const response = await axios.post(`${API_BASE}/trading/execute`, {
        pair: spread.pair,
        buy_exchange: spread.buy_exchange,
        sell_exchange: spread.sell_exchange,
        amount_usdt: 100,
        mode: tradingMode
      })
      
      if (response.data.success) {
        const trade = response.data.trade
        alert(`✅ ${modeLabels[tradingMode]} успешна!\nПрофит: ${trade.actual_profit.toFixed(2)}\nBuy Order: ${trade.buy_order_id || 'N/A'}\nSell Order: ${trade.sell_order_id || 'N/A'}`)
      } else {
        alert(`⚠️ Сделка выполнена с ошибкой:\n${response.data.trade?.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Trade failed:", error)
      const errorMsg = error.response?.data?.detail || error.message
      alert(`❌ Ошибка выполнения сделки:\n${errorMsg}`)
    }
  }

  useEffect(() => {
    fetchSpreads()
    fetchTradingStatus()
  }, [fetchSpreads, fetchTradingStatus])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchSpreads, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchSpreads])

  const profitableSpreads = spreads.filter(s => (s.net_spread_pct || s.spread_pct) > 0)


  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-7 h-7 text-blue-600" />
                Crypto Arbitrage Scanner
              </h1>
              <div className="mt-1 flex items-center gap-3">
                <ExchangeStatus />
                {tradingStatus?.use_testnet && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <FlaskConical className="w-3 h-3" />
                    TESTNET MODE
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TradingModeSelector 
                mode={tradingMode} 
                onChange={setTradingMode}
                status={tradingStatus}
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto
              </label>
              <button 
                onClick={fetchSpreads}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <Settings className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </header>


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stats Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Панель автотрейдера */}
            <AutoTraderPanel />
            
            <StatsPanel />
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Сводка</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Всего спредов:</span>
                  <span className="font-medium">{spreads.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Прибыльных:</span>
                  <span className="font-medium text-green-600">{profitableSpreads.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Горячих (&gt;1.5%):</span>
                  <span className="font-medium text-orange-600">
                    {spreads.filter(s => (s.net_spread_pct || s.spread_pct) >= 1.5).length}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Режим торговли */}
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Режим торговли</h3>
              <div className={`p-3 rounded-lg ${
                tradingMode === 'simulation' ? 'bg-blue-50 border border-blue-200' :
                tradingMode === 'testnet' ? 'bg-purple-50 border border-purple-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {tradingMode === 'simulation' && <Gamepad2 className="w-4 h-4 text-blue-600" />}
                  {tradingMode === 'testnet' && <FlaskConical className="w-4 h-4 text-purple-600" />}
                  {tradingMode === 'live' && <Wallet className="w-4 h-4 text-red-600" />}
                  <span className="font-medium capitalize">{tradingMode}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {tradingMode === 'simulation' && 'Виртуальные сделки без API вызовов'}
                  {tradingMode === 'testnet' && 'Реальные API вызовы к тестовой сети'}
                  {tradingMode === 'live' && '⚠️ Реальные деньги!'}
                </p>
              </div>
            </div>
          </div>

          {/* Spreads Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {spreads.length === 0 && !loading && (
                <div className="col-span-full text-center py-12 text-slate-500">
                  Нет данных. Нажмите Refresh для загрузки.
                </div>
              )}
              {spreads.map((spread, index) => (
                <SpreadCard 
                  key={`${spread.pair}-${spread.buy_exchange}-${spread.sell_exchange}-${index}`} 
                  data={spread}
                  onTrade={executeTrade}
                  tradingMode={tradingMode}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsPanel 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        onSettingsChange={fetchSpreads}
      />
    </div>
  )
}

export default App
