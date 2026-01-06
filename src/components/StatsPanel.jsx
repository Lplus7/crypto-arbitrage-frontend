import { useState, useEffect } from 'react'
import axios from 'axios'
import { TrendingUp, Activity, DollarSign, Target } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

export default function StatsPanel() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Update every 30s
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/trading/stats/simulation`)
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border animate-pulse">
        <div className="h-20 bg-slate-100 rounded"></div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Статистика симуляции
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-2xl font-bold text-slate-800">
            {stats.total_trades}
          </div>
          <div className="text-xs text-slate-500">Всего сделок</div>
        </div>
        
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {stats.win_rate.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500">Win Rate</div>
        </div>
        
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className={`text-2xl font-bold ${stats.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${stats.total_profit.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500">Общий профит</div>
        </div>
        
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            ${stats.average_profit.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500">Средний профит</div>
        </div>
      </div>
    </div>
  )
}
