import { useState, useEffect } from 'react'
import { formatAmount, getCurrentMonth, formatMonth, generateMonthList } from '../utils/format'
import { getCategoryIcon } from '../utils/categories'
import { getMonthlyStats } from '../store/database'

interface CategoryStat {
  category1: string
  total: number
  count: number
}

/**
 * 统计页面
 * 显示月度支出统计：总额、分类排名、占比
 */
function StatsPage() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [total, setTotal] = useState(0)
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [loading, setLoading] = useState(true)
  const [showMonthPicker, setShowMonthPicker] = useState(false)

  const months = generateMonthList(12)

  useEffect(() => {
    loadStats()
  }, [currentMonth])

  const loadStats = async () => {
    setLoading(true)
    try {
      const stats = await getMonthlyStats(currentMonth)
      setTotal(stats.total)
      setCategoryStats(stats.byCategory)
    } catch (err) {
      console.error('加载统计数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 计算每个分类的占比
  const getPercent = (amount: number): string => {
    if (total === 0) return '0%'
    return ((amount / total) * 100).toFixed(1) + '%'
  }

  // 最长柱状条的比例（用于计算宽度）
  const maxAmount = categoryStats.length > 0 ? categoryStats[0].total : 0

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">统计</h1>
        <button
          className="btn btn-ghost"
          onClick={() => setShowMonthPicker(!showMonthPicker)}
        >
          {formatMonth(currentMonth)} ▾
        </button>
      </div>

      {/* 月份选择器 */}
      {showMonthPicker && (
        <div className="overlay" onClick={() => setShowMonthPicker(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-header">
              <span className="sheet-title">选择月份</span>
              <button className="btn btn-ghost" onClick={() => setShowMonthPicker(false)}>
                关闭
              </button>
            </div>
            <div className="sheet-body">
              {months.map((m) => (
                <button
                  key={m.value}
                  className="list-item"
                  style={{
                    width: '100%',
                    fontWeight: m.value === currentMonth ? 700 : 400,
                    color: m.value === currentMonth ? 'var(--color-primary)' : 'var(--color-text)',
                  }}
                  onClick={() => {
                    setCurrentMonth(m.value)
                    setShowMonthPicker(false)
                  }}
                >
                  {m.label}
                  {m.value === currentMonth && <span style={{ marginLeft: 'auto' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <div className="empty-text">加载中...</div>
        </div>
      ) : total === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-text">本月暂无支出数据</div>
        </div>
      ) : (
        <>
          {/* 汇总卡片 */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-value">{formatAmount(total)}</div>
              <div className="stat-label">总支出</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{categoryStats.length}</div>
              <div className="stat-label">涉及分类</div>
            </div>
          </div>

          {/* 分类排名 */}
          <div className="card" style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 'var(--font-size-base)' }}>
              分类排名
            </div>
            {categoryStats.map((stat, index) => (
              <div key={stat.category1} className="category-rank-item">
                <div className="rank-icon">{getCategoryIcon(stat.category1)}</div>
                <div className="rank-info">
                  <div className="rank-name">
                    {stat.category1}
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-hint)', marginLeft: 6 }}>
                      {stat.count}笔
                    </span>
                  </div>
                  <div className="rank-bar-bg">
                    <div
                      className="rank-bar-fill"
                      style={{
                        width: maxAmount > 0 ? (stat.total / maxAmount) * 100 + '%' : '0%',
                      }}
                    />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="rank-amount">{formatAmount(stat.total)}</div>
                  <div className="rank-percent">{getPercent(stat.total)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default StatsPage
