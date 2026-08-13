/// <reference types="vite/client" />

// ===== 核心数据类型 =====

interface Expense {
  id?: number
  amount: number      // 金额，单位「分」（整数），如 3550 = 35.50 元
  category1: string
  category2: string
  date: string
  note?: string
  created_at: string
}

interface Category {
  id: number
  name: string
  icon: string
  parent_id: number | null
  sort_order: number
}
