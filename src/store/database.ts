/**
 * 浏览器端数据存储层
 * 使用 IndexedDB 存储数据，提供与 electronAPI 相同的接口
 */

const DB_NAME = 'misiyou-jizhang'
const DB_VERSION = 2

interface ExpenseRecord {
  id?: number
  amount: number       // 金额，单位「分」（整数），如 3550 = 35.50 元
  category1: string
  category2: string
  date: string
  note: string
  created_at: string
}

interface CategoryRecord {
  id?: number
  name: string
  icon: string
  parent_id: number | null
  sort_order: number
}

// 打开数据库
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const oldVersion = event.oldVersion

      // 如果存在旧版本的表，先删除再重建（数据迁移期间可接受清空）
      if (oldVersion < 1) {
        // 首次创建，正常建表
      } else {
        // 升级：删除旧表重建（开发阶段数据量少，清空重建比迁移简单可靠）
        if (db.objectStoreNames.contains('expenses')) {
          db.deleteObjectStore('expenses')
        }
        if (db.objectStoreNames.contains('categories')) {
          db.deleteObjectStore('categories')
        }
      }

      // 创建支出记录表
      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', {
          keyPath: 'id',
          autoIncrement: true,
        })
        expenseStore.createIndex('date', 'date', { unique: false })
        expenseStore.createIndex('category1', 'category1', { unique: false })
      }

      // 创建分类表
      if (!db.objectStoreNames.contains('categories')) {
        const categoryStore = db.createObjectStore('categories', {
          keyPath: 'id',
          autoIncrement: true,
        })
        categoryStore.createIndex('parent_id', 'parent_id', { unique: false })
      }
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      resolve(db)
    }

    request.onerror = (event) => {
      console.error('数据库打开失败:', (event.target as IDBOpenDBRequest).error)
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

// ===== 支出记录 =====

/** 获取所有支出记录 */
export async function getExpenses(filters?: { month?: string }): Promise<ExpenseRecord[]> {
  const db = await openDB()
  return new Promise((resolve) => {
    const transaction = db.transaction('expenses', 'readonly')
    const store = transaction.objectStore('expenses')
    const request = store.getAll()

    request.onsuccess = () => {
      let records: ExpenseRecord[] = request.result
      // 按月筛选
      if (filters?.month) {
        records = records.filter((r) => r.date.startsWith(filters.month!))
      }
      // 按日期倒序排列
      records.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date)
        return b.created_at.localeCompare(a.created_at)
      })
      resolve(records)
    }
    request.onerror = () => resolve([])
  })
}

/** 添加一笔支出 */
export async function addExpense(data: Omit<ExpenseRecord, 'id' | 'created_at'>): Promise<{ success: boolean; id?: number; error?: string }> {
  const db = await openDB()
  return new Promise((resolve) => {
    const transaction = db.transaction('expenses', 'readwrite')
    const store = transaction.objectStore('expenses')
    const record: ExpenseRecord = {
      ...data,
      created_at: new Date().toISOString(),
    }
    const request = store.add(record)

    request.onsuccess = () => {
      resolve({ success: true, id: request.result as number })
    }
    request.onerror = () => {
      resolve({ success: false, error: String(request.error) })
    }
  })
}

/** 更新一笔支出 */
export async function updateExpense(
  id: number,
  data: Omit<ExpenseRecord, 'id' | 'created_at'>
): Promise<{ success: boolean; error?: string }> {
  const db = await openDB()
  return new Promise((resolve) => {
    const transaction = db.transaction('expenses', 'readwrite')
    const store = transaction.objectStore('expenses')

    // 先获取原记录保留 created_at
    const getRequest = store.get(id)
    getRequest.onsuccess = () => {
      const old = getRequest.result
      if (!old) {
        resolve({ success: false, error: '记录不存在' })
        return
      }
      const record: ExpenseRecord = {
        ...old,
        ...data,
        id,
        created_at: old.created_at,
      }
      const putRequest = store.put(record)
      putRequest.onsuccess = () => resolve({ success: true })
      putRequest.onerror = () => resolve({ success: false, error: String(putRequest.error) })
    }
    getRequest.onerror = () => resolve({ success: false, error: String(getRequest.error) })
  })
}

/** 删除一笔支出 */
export async function deleteExpense(id: number): Promise<{ success: boolean; error?: string }> {
  const db = await openDB()
  return new Promise((resolve) => {
    const transaction = db.transaction('expenses', 'readwrite')
    const store = transaction.objectStore('expenses')
    const request = store.delete(id)

    request.onsuccess = () => resolve({ success: true })
    request.onerror = () => resolve({ success: false, error: String(request.error) })
  })
}

/** 获取月度统计 */
export async function getMonthlyStats(month: string): Promise<{
  byCategory: { category1: string; total: number; count: number }[]
  total: number
}> {
  const expenses = await getExpenses({ month })
  const byCategory: Record<string, { category1: string; total: number; count: number }> = {}
  let total = 0

  for (const e of expenses) {
    if (!byCategory[e.category1]) {
      byCategory[e.category1] = { category1: e.category1, total: 0, count: 0 }
    }
    byCategory[e.category1].total += e.amount
    byCategory[e.category1].count += 1
    total += e.amount
  }

  // 按金额降序排列
  const sorted = Object.values(byCategory).sort((a, b) => b.total - a.total)

  return { byCategory: sorted, total }
}

// ===== 分类管理 =====

/** 获取所有分类 */
export async function getCategories(): Promise<CategoryRecord[]> {
  const db = await openDB()
  return new Promise((resolve) => {
    const transaction = db.transaction('categories', 'readonly')
    const store = transaction.objectStore('categories')
    const request = store.getAll()

    request.onsuccess = () => {
      const records: CategoryRecord[] = request.result
      records.sort((a, b) => a.sort_order - b.sort_order)
      resolve(records)
    }
    request.onerror = () => resolve([])
  })
}

/** 初始化默认分类（仅在首次使用时） */
export async function initDefaultCategories(): Promise<void> {
  const existing = await getCategories()
  if (existing.length > 0) return // 已有数据，跳过

  const defaultCategories = [
    { name: '餐饮美食', icon: '🍽️', children: ['早餐', '午餐', '晚餐', '零食饮料', '外卖', '聚餐聚会', '水果', '买菜食材'] },
    { name: '交通出行', icon: '🚗', children: ['公交地铁', '打车', '加油充电', '停车费', '火车高铁', '飞机票', '共享单车', '汽车保养维修'] },
    { name: '购物消费', icon: '🛒', children: ['衣服鞋帽', '日用百货', '数码电子', '化妆品护肤', '家居用品', '宠物用品', '网购其他'] },
    { name: '居住生活', icon: '🏠', children: ['房租房贷', '水电燃气', '物业费', '网费话费', '维修', '家居装修'] },
    { name: '娱乐休闲', icon: '🎮', children: ['电影演出', '游戏', '旅游度假', '运动健身', 'KTV酒吧', '书籍阅读', '视频会员', '咖啡茶馆'] },
    { name: '医疗健康', icon: '💊', children: ['看病挂号', '药品', '体检', '牙科眼科', '保健品', '理发造型'] },
    { name: '教育学习', icon: '📚', children: ['培训课程', '书籍资料', '考试报名', '文具', '在线会员'] },
    { name: '人情往来', icon: '🎁', children: ['红包礼金', '请客送礼', '孝敬父母', '慈善捐款', '礼物赠送'] },
    { name: '金融理财', icon: '💰', children: ['保险', '投资亏损', '手续费', '贷款利息'] },
    { name: '其他支出', icon: '📦', children: ['快递邮寄', '其他杂项'] },
  ]

  const db = await openDB()
  const transaction = db.transaction('categories', 'readwrite')
  const store = transaction.objectStore('categories')

  let sortOrder = 1
  for (const cat of defaultCategories) {
    // 插入一级分类
    const parentRequest = store.add({
      name: cat.name,
      icon: cat.icon,
      parent_id: null,
      sort_order: sortOrder,
    })

    sortOrder++

    // 等待一级分类插入完成
    await new Promise<void>((resolve) => {
      parentRequest.onsuccess = () => {
        const parentId = parentRequest.result as number
        // 插入二级分类
        for (let i = 0; i < cat.children.length; i++) {
          store.add({
            name: cat.children[i],
            icon: '',
            parent_id: parentId,
            sort_order: sortOrder * 100 + i,
          })
        }
        sortOrder++
        resolve()
      }
    })
  }

  // 等待事务完成
  await new Promise<void>((resolve) => {
    transaction.oncomplete = () => resolve()
  })
}
