/**
 * 格式化工具函数
 * 核心规则：金额内部统一用「分」（整数）存储和计算，避免浮点数精度问题
 * 例如：35.50 元 → 内部存储为 3550（分）
 */

/**
 * 元 → 分（用户输入的金额转为内部存储格式）
 * 例如：yuanToCents(35.50) → 3550
 */
export function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100)
}

/**
 * 分 → 元（内部存储转为显示用的元）
 * 例如：centsToYuan(3550) → 35.5
 */
export function centsToYuan(cents: number): number {
  return cents / 100
}

/** 格式化金额为显示字符串（如 ¥35.50），参数为「分」 */
export function formatAmount(cents: number): string {
  const yuan = cents / 100
  return `¥${yuan.toFixed(2)}`
}

/** 格式化日期为 yyyy-MM-dd */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 获取今天的日期字符串 */
export function getToday(): string {
  return formatDate(new Date())
}

/** 获取当前月份字符串 yyyy-MM */
export function getCurrentMonth(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/** 获取星期几的中文名称 */
export function getWeekday(dateStr: string): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const d = new Date(dateStr)
  return weekdays[d.getDay()]
}

/** 获取月份的中文名称（如 "2026年8月"） */
export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  return `${year}年${parseInt(month)}月`
}

/** 格式化时间戳为时间字符串 HH:mm */
export function formatTime(isoString: string): string {
  const d = new Date(isoString)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/** 获取日期的日（如 11） */
export function getDay(dateStr: string): string {
  const d = new Date(dateStr)
  return String(d.getDate())
}

/** 生成月份列表（用于月份选择器） */
export function generateMonthList(monthsBack: number = 12): { value: string; label: string }[] {
  const months: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = formatDate(d).substring(0, 7)
    const label = formatMonth(value)
    months.push({ value, label })
  }
  return months
}
