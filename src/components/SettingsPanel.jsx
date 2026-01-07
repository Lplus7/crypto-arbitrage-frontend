import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { Settings, X, Plus, Trash2, Check, AlertCircle, Key, Eye, EyeOff, Shield } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

const EXCHANGES = [
  { id: 'binance', name: 'Binance', color: 'bg-yellow-500' },
  { id: 'bybit', name: 'Bybit', color: 'bg-orange-500' },
  { id: 'okx', name: 'OKX', color: 'bg-blue-500' },
  { id: 'kucoin', name: 'KuCoin', color: 'bg-green-500' },
  { id: 'mexc', name: 'MEXC', color: 'bg-cyan-500' },
  { id: 'gateio', name: 'Gate.io', color: 'bg-purple-500' },
]

export default function SettingsPanel({ isOpen, onClose, onSettingsChange }) {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    min_spread_threshold: 1.5,
    max_spread_threshold: 15,
    blacklisted_coins: [],
    notifications_enabled: true,
    trading_mode: 'simulation',
    configured_exchanges: [],
  })
  const [newCoin, setNewCoin] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const debounceRef = useRef(null)
  
  // API Keys state
  const [apiKeyForm, setApiKeyForm] = useState({
    exchange: 'binance',
    api_key: '',
    api_secret: '',
  })
  const [showSecret, setShowSecret] = useState(false)
  const [configuredExchanges, setConfiguredExchanges] = useState([])

  useEffect(() => {
    if (isOpen) {
      fetchSettings()
      fetchConfiguredExchanges()
    }
  }, [isOpen])

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE}/settings`)
      setSettings(prev => ({
        ...prev,
        ...response.data,
        max_spread_threshold: response.data.max_spread_threshold || 15
      }))
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const fetchConfiguredExchanges = async () => {
    try {
      const response = await axios.get(`${API_BASE}/settings/api-keys`)
      setConfiguredExchanges(response.data.exchanges || [])
    } catch (error) {
      console.error('Failed to fetch configured exchanges:', error)
    }
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const updateThreshold = useCallback((field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        if (field === 'min_spread_threshold') {
          await axios.put(`${API_BASE}/settings/threshold`, { threshold: value })
          showMessage(`Мин. порог: ${value}%`)
        } else if (field === 'max_spread_threshold') {
          await axios.put(`${API_BASE}/settings/max-threshold`, { threshold: value })
          showMessage(`Макс. порог: ${value}%`)
        }
        onSettingsChange?.()
      } catch (error) {
        showMessage('Ошибка обновления порога', 'error')
      }
    }, 300)
  }, [onSettingsChange])

  const addToBlacklist = async () => {
    if (!newCoin.trim()) return
    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE}/settings/blacklist/${newCoin.trim().toUpperCase()}`)
      setSettings(prev => ({ ...prev, blacklisted_coins: response.data.blacklist }))
      setNewCoin('')
      showMessage(`${newCoin.toUpperCase()} добавлен в чёрный список`)
      onSettingsChange?.()
    } catch (error) {
      showMessage('Ошибка добавления', 'error')
    } finally {
      setLoading(false)
    }
  }

  const removeFromBlacklist = async (coin) => {
    setLoading(true)
    try {
      const response = await axios.delete(`${API_BASE}/settings/blacklist/${coin}`)
      setSettings(prev => ({ ...prev, blacklisted_coins: response.data.blacklist }))
      showMessage(`${coin} удалён`)
      onSettingsChange?.()
    } catch (error) {
      showMessage('Ошибка удаления', 'error')
    } finally {
      setLoading(false)
    }
  }

  const saveApiKeys = async () => {
    if (!apiKeyForm.api_key || !apiKeyForm.api_secret) {
      showMessage('Заполните все поля', 'error')
      return
    }
    setLoading(true)
    try {
      await axios.post(`${API_BASE}/settings/api-keys`, apiKeyForm)
      showMessage(`API ключи для ${apiKeyForm.exchange.toUpperCase()} сохранены`)
      setApiKeyForm({ ...apiKeyForm, api_key: '', api_secret: '' })
      fetchConfiguredExchanges()
    } catch (error) {
      const msg = error.response?.data?.detail || 'Ошибка сохранения'
      showMessage(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const deleteApiKeys = async (exchange) => {
    if (!confirm(`Удалить API ключи для ${exchange.toUpperCase()}?`)) return
    setLoading(true)
    try {
      await axios.delete(`${API_BASE}/settings/api-keys/${exchange}`)
      showMessage(`API ключи для ${exchange.toUpperCase()} удалены`)
      fetchConfiguredExchanges()
    } catch (error) {
      showMessage('Ошибка удаления', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Настройки
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'general' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ⚙️ Общие
          </button>
          <button
            onClick={() => setActiveTab('apikeys')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'apikeys' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            🔑 API Ключи
          </button>
        </div>

        {/* Message Toast */}
        {message && (
          <div className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
            message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {activeTab === 'general' && (
            <>
              {/* Min Threshold */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Минимальный спред: <span className="text-green-600 font-bold">{settings.min_spread_threshold.toFixed(1)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={settings.min_spread_threshold}
                  onChange={(e) => updateThreshold('min_spread_threshold', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0%</span>
                  <span>10%</span>
                  <span>20%</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  💡 Показывать только спреды выше этого порога.
                </p>
              </div>

              {/* Max Threshold */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Максимальный спред: <span className="text-red-600 font-bold">{settings.max_spread_threshold.toFixed(1)}%</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={settings.max_spread_threshold}
                  onChange={(e) => updateThreshold('max_spread_threshold', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>5%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  ⚠️ Спреды выше этого порога — скорее всего ошибочные данные (нереальный арбитраж).
                </p>
              </div>

              {/* Visual Range */}
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-2">Диапазон отображения:</div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">{settings.min_spread_threshold.toFixed(1)}%</span>
                  <div className="flex-1 h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full"></div>
                  <span className="text-red-600 font-bold">{settings.max_spread_threshold.toFixed(1)}%</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Сигналы вне этого диапазона будут скрыты
                </p>
              </div>

              {/* Blacklist */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Чёрный список монет
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCoin}
                    onChange={(e) => setNewCoin(e.target.value.toUpperCase())}
                    placeholder="BTC, DOGE..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && addToBlacklist()}
                  />
                  <button
                    onClick={addToBlacklist}
                    disabled={loading || !newCoin.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[32px]">
                  {settings.blacklisted_coins?.map((coin) => (
                    <span key={coin} className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                      {coin}
                      <button onClick={() => removeFromBlacklist(coin)} disabled={loading}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {(!settings.blacklisted_coins || settings.blacklisted_coins.length === 0) && (
                    <span className="text-sm text-slate-400">Список пуст</span>
                  )}
                </div>
              </div>

              {/* Trading Mode */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Режим торговли
                </label>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-blue-600 text-white">
                    🎮 Симуляция
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      configuredExchanges.length > 0
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    disabled={configuredExchanges.length === 0}
                    title={configuredExchanges.length === 0 ? 'Добавьте API ключи' : 'Включить Live режим'}
                  >
                    💰 Live {configuredExchanges.length === 0 && '(нужны ключи)'}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'apikeys' && (
            <>
              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Безопасность</p>
                  <p className="text-blue-600">API ключи шифруются и хранятся локально. Используйте ключи только с разрешениями на торговлю.</p>
                </div>
              </div>

              {/* Configured Exchanges */}
              {configuredExchanges.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Настроенные биржи
                  </label>
                  <div className="space-y-2">
                    {configuredExchanges.map((exchange) => {
                      const ex = EXCHANGES.find(e => e.id === exchange)
                      return (
                        <div key={exchange} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${ex?.color || 'bg-gray-500'}`} />
                            <span className="font-medium">{ex?.name || exchange}</span>
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                          <button
                            onClick={() => deleteApiKeys(exchange)}
                            className="text-red-600 hover:text-red-800 p-1"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Add API Keys Form */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Добавить API ключи
                </label>
                
                {/* Exchange Select */}
                <select
                  value={apiKeyForm.exchange}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, exchange: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm mb-3"
                >
                  {EXCHANGES.map((ex) => (
                    <option key={ex.id} value={ex.id} disabled={configuredExchanges.includes(ex.id)}>
                      {ex.name} {configuredExchanges.includes(ex.id) && '(настроено)'}
                    </option>
                  ))}
                </select>

                {/* API Key */}
                <div className="mb-3">
                  <label className="block text-xs text-slate-500 mb-1">API Key</label>
                  <input
                    type="text"
                    value={apiKeyForm.api_key}
                    onChange={(e) => setApiKeyForm({ ...apiKeyForm, api_key: e.target.value })}
                    placeholder="Введите API Key"
                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  />
                </div>

                {/* API Secret */}
                <div className="mb-3">
                  <label className="block text-xs text-slate-500 mb-1">API Secret</label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={apiKeyForm.api_secret}
                      onChange={(e) => setApiKeyForm({ ...apiKeyForm, api_secret: e.target.value })}
                      placeholder="Введите API Secret"
                      className="w-full px-3 py-2 border rounded-lg text-sm font-mono pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={saveApiKeys}
                  disabled={loading || !apiKeyForm.api_key || !apiKeyForm.api_secret}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Сохранить ключи
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  )
}
