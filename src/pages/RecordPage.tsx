import { useState } from 'react'
import { getToday, yuanToCents } from '../utils/format'
import { DEFAULT_CATEGORIES } from '../utils/categories'
import { addExpense } from '../store/database'

interface RecordPageProps {
  onNavigate: (page: 'home' | 'record' | 'history' | 'stats') => void
}

/**
 * 记账页面
 * 步骤：输入金额 → 选择一级分类 → 选择二级分类 → 填写备注和日期 → 保存
 */
function RecordPage({ onNavigate }: RecordPageProps) {
  // 表单状态
  const [amount, setAmount] = useState('')
  const [selectedCategory1, setSelectedCategory1] = useState('')
  const [selectedCategory2, setSelectedCategory2] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(getToday())
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // 当前选择的一级分类对象
  const currentCategory = DEFAULT_CATEGORIES.find((c) => c.name === selectedCategory1)

  // 处理金额输入（只允许数字和小数点）
  const handleAmountChange = (value: string) => {
    // 移除非法字符
    const cleaned = value.replace(/[^0-9.]/g, '')
    // 只允许一个小数点
    const parts = cleaned.split('.')
    if (parts.length > 2) return
    // 限制小数位数为两位
    if (parts[1] && parts[1].length > 2) return
    // 限制最大金额
    if (Number(cleaned) > 99999999) return
    setAmount(cleaned)
  }

  // 保存记录
  const handleSave = async () => {
    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      alert('请输入有效的金额')
      return
    }
    if (!selectedCategory1) {
      alert('请选择分类')
      return
    }
    if (!selectedCategory2) {
      alert('请选择二级分类')
      return
    }

    setSaving(true)
    try {
      const result = await addExpense({
        amount: yuanToCents(amountNum),
        category1: selectedCategory1,
        category2: selectedCategory2,
        date,
        note: note.trim(),
      })

      if (result.success) {
        // 显示成功提示
        setShowSuccess(true)
        // 重置表单
        resetForm()
        // 1.5秒后自动隐藏提示
        setTimeout(() => setShowSuccess(false), 1500)
      } else {
        alert('保存失败：' + (result.error || '未知错误'))
      }
    } catch (err) {
      alert('保存失败：' + String(err))
    } finally {
      setSaving(false)
    }
  }

  // 重置表单
  const resetForm = () => {
    setAmount('')
    setSelectedCategory1('')
    setSelectedCategory2('')
    setNote('')
    setDate(getToday())
  }

  // 当一级分类改变时，清空二级分类
  const handleCategory1Change = (catName: string) => {
    if (catName === selectedCategory1) {
      // 再次点击同一个分类，取消选择
      setSelectedCategory1('')
      setSelectedCategory2('')
    } else {
      setSelectedCategory1(catName)
      setSelectedCategory2('')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">记一笔</h1>
      </div>

      <div className="record-form">
        {/* 金额输入 */}
        <div className="form-group" style={{ textAlign: 'center' }}>
          <div className="form-label">金额（元）</div>
          <input
            className="amount-input"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            autoFocus
            style={{ width: '100%' }}
          />
        </div>

        {/* 一级分类选择 */}
        <div className="form-group">
          <div className="form-label">选择分类</div>
          <div className="category-selector">
            {DEFAULT_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                className={`category-option ${selectedCategory1 === cat.name ? 'selected' : ''}`}
                onClick={() => handleCategory1Change(cat.name)}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 二级分类选择（仅在选择了一级分类后显示） */}
        {currentCategory && currentCategory.children.length > 0 && (
          <div className="form-group">
            <div className="form-label">选择 {currentCategory.name} 的子分类</div>
            <div className="subcategory-list">
              {currentCategory.children.map((child) => (
                <button
                  key={child}
                  className={`subcategory-tag ${selectedCategory2 === child ? 'selected' : ''}`}
                  onClick={() =>
                    setSelectedCategory2(selectedCategory2 === child ? '' : child)
                  }
                >
                  {child}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 日期选择 */}
        <div className="form-group">
          <div className="form-label">日期</div>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getToday()}
          />
        </div>

        {/* 备注 */}
        <div className="form-group">
          <div className="form-label">备注（可选）</div>
          <input
            className="input"
            type="text"
            placeholder="如：黄焖鸡米饭"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* 保存按钮 */}
        <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
          <button
            className="btn btn-primary btn-block btn-large"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : '✓ 保存记录'}
          </button>
        </div>
      </div>

      {/* 保存成功提示 */}
      {showSuccess && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--color-success)',
            color: 'white',
            padding: '16px 32px',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 600,
            zIndex: 999,
            boxShadow: '0 8px 24px rgba(52, 199, 89, 0.4)',
            animation: 'fadeIn 0.15s',
          }}
        >
          ✅ 保存成功！
        </div>
      )}
    </div>
  )
}

export default RecordPage
