import { useState, useEffect } from 'react'
import { formatAmount, getToday, getCurrentMonth, formatMonth } from '../utils/format'
import { getCategoryIcon } from '../utils/categories'
import { getExpenses } from '../store/database'

interface HomePageProps {
  onNavigate: (page: 'home' | 'record' | 'history' | 'stats') => void
}


/**
 * 首页 — 显示本月支出总额 + 今日快捷记账 + 最近记录
 */
function HomePage({ onNavigate }: HomePageProps) {
  const [monthTotal, setMonthTotal] = useState(0)
  const [todayTotal, setTodayTotal] = useState(0)
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const currentMonth = getCurrentMonth()
      const today = getToday()

      // 获取本月所有记录
      const allExpenses = await getExpenses({ month: currentMonth })

      // 计算本月总额
      const total = allExpenses.reduce((sum, e) => sum + e.amount, 0)
      setMonthTotal(total)

      // 今日总额
      const todayExpenses = allExpenses.filter((e) => e.date === today)
      const todaySum = todayExpenses.reduce((sum, e) => sum + e.amount, 0)
      setTodayTotal(todaySum)

      // 最近 5 条记录
      setRecentExpenses(allExpenses.slice(0, 5))
    } catch (err) {
      console.error('加载首页数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* 本月支出概览 */}
      <div className="home-total">
        <div className="total-label">{formatMonth(getCurrentMonth())}支出</div>
        <div>
          <span className="total-amount">{monthTotal.toFixed(2)}</span>
          <span className="total-unit"> 元</span>
        </div>
        {todayTotal > 0 && (
          <div style={{ marginTop: 8, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            今日支出 {formatAmount(todayTotal)}
          </div>
        )}
      </div>

      {/* 快捷操作 */}
      <div className="home-quick-actions">
        <button className="btn btn-primary btn-large" onClick={() => onNavigate('record')}>
          ✏️ 记一笔
        </button>
        <button className="btn btn-ghost btn-large" onClick={() => onNavigate('history')}>
          📋 查看账单
        </button>
      </div>

      {/* 最近记录 */}
      <div className="card" style={{ margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>最近记录</span>
          {recentExpenses.length > 0 && (
            <button
              className="btn btn-ghost"
              style={{ fontSize: 'var(--font-size-xs)', padding: '4px 8px' }}
              onClick={() => onNavigate('history')}
            >
              查看全部 →
            </button>
          )}
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-text">加载中...</div>
          </div>
        ) : recentExpenses.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-icon">📝</div>
            <div className="empty-text">本月还没有记录</div>
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => onNavigate('record')}
            >
              记第一笔
            </button>
          </div>
        ) : (
          recentExpenses.map((expense) => (
            <div key={expense.id} className="recent-item">
              <div className="recent-icon">{getCategoryIcon(expense.category1)}</div>
              <div className="recent-info">
                <div className="recent-category">{expense.category2}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="recent-date">{expense.date}</span>
                  {expense.note && <span className="recent-note">{expense.note}</span>}
                </div>
              </div>
              <div className="recent-amount">-{formatAmount(expense.amount)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default HomePage
