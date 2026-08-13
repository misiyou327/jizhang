import { useState, useEffect } from 'react'
import HomePage from './pages/HomePage'
import RecordPage from './pages/RecordPage'
import HistoryPage from './pages/HistoryPage'
import StatsPage from './pages/StatsPage'
import { initDefaultCategories } from './store/database'

// 页面类型定义
type Page = 'home' | 'record' | 'history' | 'stats'

/**
 * 应用根组件
 * 使用底部导航切换页面（不需要 react-router，直接状态切换更简单）
 */
function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [dbReady, setDbReady] = useState(false)

  // 初始化数据库（插入默认分类）
  useEffect(() => {
    initDefaultCategories().then(() => setDbReady(true))
  }, [])

  // 底部导航栏配置
  const tabs: { key: Page; label: string; icon: string }[] = [
    { key: 'home', label: '首页', icon: '🏠' },
    { key: 'record', label: '记账', icon: '✏️' },
    { key: 'history', label: '账单', icon: '📋' },
    { key: 'stats', label: '统计', icon: '📊' },
  ]

  // 根据当前页面渲染对应组件
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />
      case 'record':
        return <RecordPage onNavigate={setCurrentPage} />
      case 'history':
        return <HistoryPage />
      case 'stats':
        return <StatsPage />
      default:
        return <HomePage onNavigate={setCurrentPage} />
    }
  }

  // 数据库未就绪时显示加载画面
  if (!dbReady) {
    return (
      <div className="app">
        <main className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <div className="empty-text">正在初始化数据库...</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      {/* 页面内容区域 */}
      <main className="page-content">{renderPage()}</main>

      {/* 底部导航栏 */}
      <nav className="bottom-nav">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`nav-item ${currentPage === tab.key ? 'active' : ''}`}
            onClick={() => setCurrentPage(tab.key)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
