/**
 * 分类工具函数的单元测试
 * 每一道 it(...) 都是一道检查题：喂入某个值，检查输出是否符合期望
 */
import { describe, it, expect } from 'vitest'
import { DEFAULT_CATEGORIES, getCategoryIcon } from './categories'

describe('getCategoryIcon（按一级分类名找图标）', () => {
  it('存在的分类应返回对应图标：餐饮美食 → 🍽️', () => {
    expect(getCategoryIcon('餐饮美食')).toBe('🍽️')
  })

  it('存在的分类应返回对应图标：交通出行 → 🚗', () => {
    expect(getCategoryIcon('交通出行')).toBe('🚗')
  })

  it('不存在的分类应返回默认图标 📦', () => {
    expect(getCategoryIcon('不存在的分类')).toBe('📦')
  })

  it('空字符串应返回默认图标 📦', () => {
    expect(getCategoryIcon('')).toBe('📦')
  })
})

describe('DEFAULT_CATEGORIES（默认分类数据）', () => {
  it('应有 10 个一级分类', () => {
    expect(DEFAULT_CATEGORIES.length).toBe(10)
  })

  it('每个一级分类都应有图标和至少 1 个二级分类', () => {
    for (const cat of DEFAULT_CATEGORIES) {
      expect(cat.icon.length).toBeGreaterThan(0)
      expect(cat.children.length).toBeGreaterThan(0)
    }
  })

  it('二级分类名称不应重复', () => {
    const all = DEFAULT_CATEGORIES.flatMap((c) => c.children)
    expect(new Set(all).size).toBe(all.length)
  })
})
