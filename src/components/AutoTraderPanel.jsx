import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Bot, Play, Square, Pause, PlayCircle, Settings2, TrendingUp, AlertTriangle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

/**
 * Панель управления автотрейдером
 * Позволяет запускать/останавливать автоматическую торговлю
 */
export default function AutoTraderPanel() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  // Загрузка статуса
  const fetchStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/auto/status`)
      setStatus(response.data)
      setError(null)
    } catch (err) {
      setError('Не удалось получить статус')
      console.error('AutoTrader status error:', err)
    }
  }, [])

  // Запуск автотрейдера
  const handleStart = async () => {
    setLoading(true)
    try {
      await axios.post(`${API_BASE}/auto/start`)
      await fetchStatus()
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка запуска')
    } finally {
      setLoading(false)
    }
  }

  // Остановка
  const handleStop = async () => {
    setLoading(true)
    try {
      await axios.post(`${API_BASE}/auto/stop`)
      await fetchStatus()
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка остановки')
    } finally {
      setLoading(false)
    }
  }

  // Пауза/Возобновление
  const handlePauseResume = async () => {
    setLoading(true)
    try {
      if (status?.state === 'paused') {
        await axios.post(`${API_BASE}/auto/resume`)
      } else {
        await axios.post(`${API_BASE}/auto/pause`)
      }
      await fetchStatus()
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  // Обновление настроек риска
  const handleUpdateSettings = async (settings) => {
    try {
      await axios.put(`${API_BASE}/auto/risk/settings`, settings)
      await fetchStatus()
      setShowSettings(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка сохранения')
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const isRunning = status?.state === 'running'
  const isPaused = status?.state === 'paused'
  const hasError = status?.state === 'error'

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Заголовок */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        isRunning ? 'bg-green-50 border-b border-green-100' :
        isPaused ? 'bg-yellow-50 border-b border-yellow-100' :
        hasError ? 'bg-red-50 border-b border-red-100' :
        'bg-slate-50 border-b'
      }`}>
        <div className="flex items-center gap-2">
          <Bot className={`w-5 h-5 ${
            isRunning ? 'text-green-600 animate-pulse' :
            isPaused ? 'text-yellow-600' :
            hasError ? 'text-red-600' :
            'text-slate-400'
          }`} />
          <span className="font-semibold text-slate-800">Автотрейдер</span>
          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
            isRunning ? 'bg-green-100 text-green-700' :
            isPaused ? 'bg-yellow-100 text-yellow-700' :
            hasError ? 'bg-red-100 text-red-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            {status?.state || 'загрузка...'}
          </span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 hover:bg-white/50 rounded"
        >
          <Settings2 className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Статистика сессии */}
      {status && (
        <div className="px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-xs text-slate-500">Сделок</div>
              <div className="text-lg font-bold text-slate-800">
                {status.session_trades}
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-xs text-slate-500">Профит</div>
              <div className={`text-lg font-bold ${
                status.session_profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${status.session_profit?.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Дневная статистика */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Дневной профит:</span>
            <span className={`font-medium ${
              status.risk_stats?.daily_profit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${status.risk_stats?.daily_profit?.toFixed(2) || '0.00'}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Сделок сегодня:</span>
            <span className="font-medium">
              {status.risk_stats?.trades_today || 0} / {status.risk_settings?.max_trades_per_day}
            </span>
          </div>

          {/* Кнопки управления */}
          <div className="flex gap-2 pt-2">
            {!isRunning && !isPaused ? (
              <button
                onClick={handleStart}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Play className="w-4 h-4" />
                Запустить
              </button>
            ) : (
              <>
                <button
                  onClick={handlePauseResume}
                  disabled={loading}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isPaused 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-yellow-500 text-white hover:bg-yellow-600'
                  } disabled:opacity-50`}
                >
                  {isPaused ? (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      Продолжить
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      Пауза
                    </>
                  )}
                </button>
                <button
                  onClick={handleStop}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  <Square className="w-4 h-4" />
                  Стоп
                </button>
              </>
            )}
          </div>

          {/* Ошибка */}
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 text-sm rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Настройки риска */}
      {showSettings && status?.risk_settings && (
        <RiskSettingsForm 
          settings={status.risk_settings}
          onSave={handleUpdateSettings}
          onCancel={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

// Форма настроек риска
function RiskSettingsForm({ settings, onSave, onCancel }) {
  const [form, setForm] = useState({
    min_spread_pct: settings.min_spread_pct,
    max_trade_size_usdt: settings.max_trade_size_usdt,
    max_trades_per_hour: settings.max_trades_per_hour,
    max_daily_loss_usdt: settings.max_daily_loss_usdt,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 border-t bg-slate-50 space-y-3">
      <h4 className="font-medium text-slate-700 text-sm">Настройки риска</h4>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500">Мин. спред (%)</label>
          <input
            type="number"
            step="0.1"
            value={form.min_spread_pct}
            onChange={(e) => setForm({...form, min_spread_pct: parseFloat(e.target.value)})}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">Макс. сделка ($)</label>
          <input
            type="number"
            value={form.max_trade_size_usdt}
            onChange={(e) => setForm({...form, max_trade_size_usdt: parseFloat(e.target.value)})}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">Сделок/час</label>
          <input
            type="number"
            value={form.max_trades_per_hour}
            onChange={(e) => setForm({...form, max_trades_per_hour: parseInt(e.target.value)})}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">Макс. убыток/день ($)</label>
          <input
            type="number"
            value={form.max_daily_loss_usdt}
            onChange={(e) => setForm({...form, max_daily_loss_usdt: parseFloat(e.target.value)})}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Сохранить
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded hover:bg-slate-300"
        >
          Отмена
        </button>
      </div>
    </form>
  )
}
