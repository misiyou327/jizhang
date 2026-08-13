/**
 * 格式化工具函数的单元测试
 * 每一道 it(...) 都是一道检查题：喂入某个值，检查输出是否符合期望
 */
import { describe, it, expect } from 'vitest'
import {
  yuanToCents,
  centsToYuan,
  formatAmount,
  formatDate,
  getToday,
  getCurrentMonth,
  getWeekday,
  formatMonth,
  formatTime,
  getDay,
  generateMonthList,
} from './format'

describe('yuanToCents（元 → 分）', () => {
  it('35.5 元应转为 3550 分', () => {
    expect(yuanToCents(35.5)).toBe(3550)
  })

  it('0 元应转为 0 分', () => {
    expect(yuanToCents(0)).toBe(0)
  })

  it('小于半分的金额应四舍五入：0.005 元 → 1 分', () => {
    expect(yuanToCents(0.005)).toBe(1)
  })

  it('浮点误差应被消除：0.1 + 0.2 元应精确等于 30 分', () => {
    expect(yuanToCents(0.1 + 0.2)).toBe(30)
  })

  it('19.9 元应精确转为 1990 分（不出现 1989.999...）', () => {
    expect(yuanToCents(19.9)).toBe(1990)
  })

  it('大金额：1234.56 元 → 123456 分', () => {
    expect(yuanToCents(1234.56)).toBe(123456)
  })

  it('负数金额：-1.5 元 → -150 分', () => {
    expect(yuanToCents(-1.5)).toBe(-150)
  })
})

describe('centsToYuan（分 → 元）', () => {
  it('3550 分应转为 35.5 元', () => {
    expect(centsToYuan(3550)).toBe(35.5)
  })

  it('1 分应转为 0.01 元', () => {
    expect(centsToYuan(1)).toBe(0.01)
  })

  it('0 分应转为 0 元', () => {
    expect(centsToYuan(0)).toBe(0)
  })
})

describe('formatAmount（分 → ¥显示字符串）', () => {
  it('3550 分应显示为 ¥35.50', () => {
    expect(formatAmount(3550)).toBe('¥35.50')
  })

  it('5 分应显示为 ¥0.05（保留两位小数）', () => {
    expect(formatAmount(5)).toBe('¥0.05')
  })

  it('0 分应显示为 ¥0.00', () => {
    expect(formatAmount(0)).toBe('¥0.00')
  })

  it('100000 分应显示为 ¥1000.00', () => {
    expect(formatAmount(100000)).toBe('¥1000.00')
  })
})

describe('formatDate（日期 → yyyy-MM-dd）', () => {
  it('Date 对象 2026年8月13日 应输出 2026-08-13', () => {
    expect(formatDate(new Date(2026, 7, 13))).toBe('2026-08-13')
  })

  it('个位数月份和日期应补零：2026年1月5日 → 2026-01-05', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('字符串日期应原样输出', () => {
    expect(formatDate('2026-08-13')).toBe('2026-08-13')
  })
})

describe('getToday / getCurrentMonth（今天 / 当前月份）', () => {
  it('getToday 应返回今天的 yyyy-MM-dd', () => {
    const today = new Date()
    expect(getToday()).toBe(formatDate(today))
  })

  it('getCurrentMonth 应返回当前月份的 yyyy-MM', () => {
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    expect(getCurrentMonth()).toBe(expected)
  })
})

describe('getWeekday（星期几）', () => {
  it('2026-08-13 是周四', () => {
    expect(getWeekday('2026-08-13')).toBe('周四')
  })

  it('2026-01-01 是周四', () => {
    expect(getWeekday('2026-01-01')).toBe('周四')
  })
})

describe('formatMonth（月份显示）', () => {
  it('2026-08 应显示为 2026年8月', () => {
    expect(formatMonth('2026-08')).toBe('2026年8月')
  })

  it('2026-01 应显示为 2026年1月（去掉前导零）', () => {
    expect(formatMonth('2026-01')).toBe('2026年1月')
  })
})

describe('formatTime（时间戳 → HH:mm）', () => {
  it('应输出 20:30', () => {
    expect(formatTime('2026-08-13T20:30:00')).toBe('20:30')
  })

  it('个位数时间应补零：早上 7 点 5 分 → 07:05', () => {
    expect(formatTime('2026-08-13T07:05:00')).toBe('07:05')
  })
})

describe('getDay（取日期的日）', () => {
  it('2026-08-13 应返回 13', () => {
    expect(getDay('2026-08-13')).toBe('13')
  })
})

describe('generateMonthList（生成月份列表）', () => {
  it('默认应生成 12 个月', () => {
    expect(generateMonthList().length).toBe(12)
  })

  it('第一个应是当前月份，第二个应是上个月', () => {
    const list = generateMonthList()
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
    expect(list[0].value).toBe(thisMonth)
    expect(list[1].value).toBe(lastMonthStr)
  })
})
