import { useState, useEffect } from 'react'
import { formatAmount, getCurrentMonth, formatMonth, getWeekday, centsToYuan, yuanToCents } from '../utils/format'
import { getCategoryIcon } from '../utils/categories'
import { getExpenses, deleteExpense as dbDeleteExpense, updateExpense as dbUpdateExpense } from '../store/database'


/**
 * 账单列表页面
 * 按日期分组显示，支持月份切换和滑动删除
 */
function HistoryPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [monthTotal, setMonthTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<number | null>(null) // 正在编辑的记录 ID

  // 编辑状态
  const [editAmount, setEditAmount] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editDate, setEditDate] = useState('')

  useEffect(() => {
    loadExpenses()
  }, [currentMonth])

  const loadExpenses = async () => {
    setLoading(true)
    try {
      const data = await getExpenses({ month: currentMonth })
      setExpenses(data)
      const total = data.reduce((sum, e) => sum + e.amount, 0)
      setMonthTotal(total)
    } catch (err) {
      console.error('加载账单失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 按日期分组记录
  const groupedByDate = expenses.reduce(
    (groups, expense) => {
      const date = expense.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(expense)
      return groups
    },
    {} as Record<string, Expense[]>
  )

  // 按日期倒序排列
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))

  // 删除记录
  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条记录吗？此操作不可恢复。')) return
    try {
      const result = await dbDeleteExpense(id)
      if (result.success) {
        setExpenses((prev) => prev.filter((e) => e.id !== id))
      } else {
        alert('删除失败')
      }
    } catch (err) {
      alert('删除失败：' + String(err))
    }
  }

  // 开始编辑（金额从分转为元显示）
  const startEdit = (expense: Expense) => {
    setEditId(expense.id ?? null)
    setEditAmount(String(centsToYuan(expense.amount)))
    setEditNote(expense.note || '')
    setEditDate(expense.date)
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditId(null)
  }

  // 保存编辑
  const saveEdit = async (id?: number) => {
    if (!id) return
    const amountNum = parseFloat(editAmount)
    if (!editAmount || isNaN(amountNum) || amountNum <= 0) {
      alert('请输入有效金额')
      return
    }

    try {
      const result = await dbUpdateExpense(id, {
        amount: yuanToCents(amountNum),
        category1: expenses.find((e) => e.id === id)!.category1,
        category2: expenses.find((e) => e.id === id)!.category2,
        date: editDate,
        note: editNote.trim(),
      })

      if (result.success) {
        setExpenses((prev) =>
          prev.map((e) =>
            e.id === id
              ? { ...e, amount: yuanToCents(amountNum), date: editDate, note: editNote.trim() }
              : e
          )
        )
        setEditId(null)
      } else {
        alert('保存失败')
      }
    } catch (err) {
      alert('保存失败：' + String(err))
    }
  }

  // 月份切换
  const changeMonth = (direction: -1 | 1) => {
    const [year, month] = currentMonth.split('-').map(Number)
    const d = new Date(year, month - 1 + direction, 1)
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    setCurrentMonth(newMonth)
  }

  return (
    <div>
      {/* 月份切换 */}
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => changeMonth(-1)}>
          ←
        </button>
        <h1 className="page-title">{formatMonth(currentMonth)}</h1>
        <button
          className="btn btn-ghost"
          onClick={() => changeMonth(1)}
          disabled={currentMonth >= getCurrentMonth()}
        >
          →
        </button>
      </div>

      {/* 月度汇总 */}
      <div className="history-summary">
        <span>共 {expenses.length} 笔</span>
        <span>
          合计 <span className="amount expense">{formatAmount(monthTotal)}</span>
        </span>
      </div>

      {/* 账单列表 */}
      {loading ? (
        <div className="empty-state">
          <div className="empty-text">加载中...</div>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-text">这个月还没有记录</div>
        </div>
      ) : (
        sortedDates.map((date) => (
          <div key={date} style={{ marginBottom: 8 }}>
            {/* 日期标题 */}
            <div
              style={{
                padding: '8px 20px',
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-hint)' }}>
                {date}
              </span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-hint)' }}>
                {getWeekday(date)}
              </span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-hint)', marginLeft: 'auto' }}>
                {groupedByDate[date].length} 笔 · {formatAmount(groupedByDate[date].reduce((s: number, e: Expense) => s + e.amount, 0))}
              </span>
            </div>

            {/* 当天记录 */}
            <div className="card" style={{ margin: '0 8px', padding: 0, overflow: 'hidden' }}>
              {groupedByDate[date].map((expense: Expense) => (
                <div key={expense.id}>
                  {editId === expense.id ? (
                    /* 编辑模式 */
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input
                          className="input"
                          type="text"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          style={{ width: 120 }}
                          placeholder="金额"
                        />
                        <input
                          className="input"
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          style={{ flex: 1 }}
                        />
                      </div>
                      <input
                        className="input"
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="备注"
                        style={{ marginBottom: 8 }}
                      />
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost" onClick={cancelEdit} style={{ fontSize: 'var(--font-size-sm)' }}>
                          取消
                        </button>
                        <button className="btn btn-primary" onClick={() => saveEdit(expense.id)} style={{ fontSize: 'var(--font-size-sm)' }}>
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 展示模式 */
                    <div
                      className="list-item"
                      onClick={() => startEdit(expense)}
                      style={{ cursor: 'pointer' }}
                      title="点击编辑"
                    >
                      <div className="expense-left">
                        <span style={{ fontSize: 20 }}>{getCategoryIcon(expense.category1)}</span>
                      </div>
                      <div className="expense-mid">
                        <div className="expense-cat">{expense.category2}</div>
                        {expense.note && <div className="expense-note">{expense.note}</div>}
                      </div>
                      <div className="expense-right">
                        <div className="expense-amount">-{formatAmount(expense.amount)}</div>
                      </div>
                      <button
                        className="btn btn-ghost"
                        style={{
                          padding: '4px 8px',
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-danger)',
                          marginLeft: 8,
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (expense.id) handleDelete(expense.id)
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default HistoryPage
