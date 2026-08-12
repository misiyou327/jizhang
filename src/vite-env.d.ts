/// <reference types="vite/client" />

// ===== 核心数据类型 =====

interface Expense {
  id?: number
  amount: number
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
