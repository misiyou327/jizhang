import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * 贪吃蛇小游戏页面
 * 使用 Canvas 绘制游戏画面，键盘方向键/WASD + 屏幕按钮双重操作
 */

// ===== 游戏配置 =====
const GRID_SIZE = 20        // 网格 20×20
const CELL_SIZE = 20        // 每格 20 像素（画布 400×400）
const INITIAL_SPEED = 160   // 初始速度（毫秒/步），越小越快
const MIN_SPEED = 70        // 最快速度
const SPEED_STEP = 6        // 每吃一个食物加快的毫秒数

type Direction = 'up' | 'down' | 'left' | 'right'
type Point = { x: number; y: number }
type GameState = 'ready' | 'playing' | 'paused' | 'over'

// 方向对应的坐标变化
const DIRECTION_DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

// 不能直接反向（会撞到自己）
const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

/**
 * 画圆角矩形（老浏览器不支持 roundRect，手动画圆弧兜底）
 */
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius)
    return
  }
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
}

/**
 * 生成随机食物位置（避开蛇身）
 */
function randomFood(snake: Point[]): Point {
  while (true) {
    const food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }
    if (!snake.some((s) => s.x === food.x && s.y === food.y)) return food
  }
}

function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>('ready')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    // 历史最高分存在浏览器本地
    const saved = localStorage.getItem('snake-best-score')
    return saved ? parseInt(saved) : 0
  })

  // 游戏数据用 ref 保存，避免定时器闭包读到旧值
  const snakeRef = useRef<Point[]>([])
  const foodRef = useRef<Point>({ x: 15, y: 10 })
  const directionRef = useRef<Direction>('right')
  const pendingDirectionRef = useRef<Direction>('right') // 排队中的方向（防止一帧内转向两次）
  const speedRef = useRef(INITIAL_SPEED)
  const timerRef = useRef<number | null>(null)

  // ===== 绘制画面 =====
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空背景
    ctx.fillStyle = '#f0f7eb'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 画网格线（淡绿色）
    ctx.strokeStyle = '#e0e8d8'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, canvas.height)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(canvas.width, i * CELL_SIZE)
      ctx.stroke()
    }

    // 画食物（红色圆）
    const food = foodRef.current
    ctx.fillStyle = '#ff5a5a'
    ctx.beginPath()
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 3,
      0,
      Math.PI * 2
    )
    ctx.fill()

    // 画蛇身（绿色圆角方块，蛇头深色）
    const snake = snakeRef.current
    snake.forEach((seg, i) => {
      const isHead = i === 0
      const pad = 1
      ctx.fillStyle = isHead ? '#2e7d32' : '#4caf50'
      const x = seg.x * CELL_SIZE + pad
      const y = seg.y * CELL_SIZE + pad
      const size = CELL_SIZE - pad * 2
      const radius = 4
      ctx.beginPath()
      drawRoundRect(ctx, x, y, size, size, radius)
      ctx.fill()
      // 蛇头画眼睛
      if (isHead) {
        ctx.fillStyle = 'white'
        const dir = directionRef.current
        const eyeOffset = 5
        const eyeSize = 2.5
        let e1: Point, e2: Point
        if (dir === 'left' || dir === 'right') {
          e1 = { x: seg.x * CELL_SIZE + CELL_SIZE / 2 + (dir === 'right' ? eyeOffset : -eyeOffset), y: seg.y * CELL_SIZE + CELL_SIZE / 2 - 5 }
          e2 = { x: e1.x, y: seg.y * CELL_SIZE + CELL_SIZE / 2 + 5 }
        } else {
          e1 = { x: seg.x * CELL_SIZE + CELL_SIZE / 2 - 5, y: seg.y * CELL_SIZE + CELL_SIZE / 2 + (dir === 'down' ? eyeOffset : -eyeOffset) }
          e2 = { x: seg.x * CELL_SIZE + CELL_SIZE / 2 + 5, y: e1.y }
        }
        ctx.beginPath()
        ctx.arc(e1.x, e1.y, eyeSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(e2.x, e2.y, eyeSize, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }, [])

  // ===== 游戏主循环 =====
  const tick = useCallback(() => {
    const snake = snakeRef.current
    // 应用排队方向
    const dir = pendingDirectionRef.current
    directionRef.current = dir

    // 计算新蛇头
    const head = snake[0]
    const delta = DIRECTION_DELTA[dir]
    const newHead = { x: head.x + delta.x, y: head.y + delta.y }

    // 撞墙判断
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      gameOver()
      return
    }
    // 撞自己判断（排除尾巴：尾巴这一步会移走，不算撞）
    if (snake.slice(0, -1).some((s) => s.x === newHead.x && s.y === newHead.y)) {
      gameOver()
      return
    }

    // 吃到食物？
    const ate = newHead.x === foodRef.current.x && newHead.y === foodRef.current.y
    const newSnake = [newHead, ...snake]
    if (!ate) newSnake.pop()

    snakeRef.current = newSnake

    if (ate) {
      setScore((prev) => prev + 1)
      foodRef.current = randomFood(newSnake)
      // 加速
      if (speedRef.current > MIN_SPEED) {
        speedRef.current = Math.max(MIN_SPEED, speedRef.current - SPEED_STEP)
        restartTimer()
      }
    }

    draw()
  }, [draw])

  // ===== 定时器管理 =====
  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const restartTimer = useCallback(() => {
    stopTimer()
    timerRef.current = window.setInterval(tick, speedRef.current)
  }, [stopTimer, tick])

  // ===== 游戏结束 =====
  const gameOver = useCallback(() => {
    stopTimer()
    setGameState('over')
    // 更新历史最高分（直接读 localStorage，避免闭包读到旧值）
    setScore((current) => {
      const saved = parseInt(localStorage.getItem('snake-best-score') || '0')
      if (current > saved) {
        setBestScore(current)
        localStorage.setItem('snake-best-score', String(current))
      }
      return current
    })
    draw()
  }, [stopTimer, draw])

  // ===== 开始游戏 =====
  const startGame = useCallback(() => {
    // 初始蛇：中间偏左，长度 3，向右移动
    const midY = Math.floor(GRID_SIZE / 2)
    snakeRef.current = [
      { x: 8, y: midY },
      { x: 7, y: midY },
      { x: 6, y: midY },
    ]
    directionRef.current = 'right'
    pendingDirectionRef.current = 'right'
    speedRef.current = INITIAL_SPEED
    setScore(0)
    foodRef.current = randomFood(snakeRef.current)
    setGameState('playing')
    draw()
    restartTimer()
  }, [draw, restartTimer])

  // ===== 暂停 / 继续 =====
  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      stopTimer()
      setGameState('paused')
    } else if (gameState === 'paused') {
      setGameState('playing')
      restartTimer()
    }
  }, [gameState, stopTimer, restartTimer])

  // ===== 转向（防止瞬间反向） =====
  const changeDirection = useCallback(
    (newDir: Direction) => {
      if (gameState !== 'playing') return
      const current = pendingDirectionRef.current
      if (newDir === current || newDir === OPPOSITE[current]) return
      pendingDirectionRef.current = newDir
    },
    [gameState]
  )

  // ===== 键盘控制 =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      }
      const dir = keyMap[e.key]
      if (!dir) {
        // 空格键暂停/继续
        if (e.key === ' ') {
          e.preventDefault()
          togglePause()
        }
        return
      }
      // 阻止页面滚动
      e.preventDefault()
      changeDirection(dir)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [changeDirection, togglePause])

  // ===== 清理定时器（切走页面时自动暂停） =====
  useEffect(() => {
    return () => {
      stopTimer()
      setGameState((s) => (s === 'playing' ? 'paused' : s))
    }
  }, [stopTimer])

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🐍 贪吃蛇</h1>
      </div>

      {/* 分数面板 */}
      <div className="stats-cards" style={{ margin: '0 16px' }}>
        <div className="stat-card">
          <div className="stat-value">{score}</div>
          <div className="stat-label">当前得分</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bestScore}</div>
          <div className="stat-label">历史最高</div>
        </div>
      </div>

      {/* 游戏画布 */}
      <div className="snake-board">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          style={{ maxWidth: '100%', height: 'auto', borderRadius: 'var(--radius-md)' }}
        />

        {/* 遮罩层：开始/暂停/结束提示 */}
        {gameState !== 'playing' && (
          <div className="snake-overlay">
            {gameState === 'ready' && (
              <>
                <div className="snake-overlay-title">🐍 贪吃蛇</div>
                <div className="snake-overlay-text">
                  方向键 / WASD 控制方向
                  <br />
                  空格键暂停
                </div>
                <button className="btn btn-primary btn-large" onClick={startGame}>
                  ▶ 开始游戏
                </button>
              </>
            )}
            {gameState === 'paused' && (
              <>
                <div className="snake-overlay-title">⏸ 已暂停</div>
                <button className="btn btn-primary btn-large" onClick={togglePause}>
                  ▶ 继续
                </button>
              </>
            )}
            {gameState === 'over' && (
              <>
                <div className="snake-overlay-title">💀 游戏结束</div>
                <div className="snake-overlay-text">
                  得分：{score}
                  {score >= bestScore && score > 0 ? ' 🎉 新纪录！' : ''}
                </div>
                <button className="btn btn-primary btn-large" onClick={startGame}>
                  🔄 再来一局
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 触屏方向键（手机也能玩） */}
      <div className="snake-controls">
        <div className="snake-controls-row">
          <button
            className="btn snake-btn"
            onClick={() => changeDirection('up')}
            onMouseDown={() => changeDirection('up')}
          >
            ↑
          </button>
        </div>
        <div className="snake-controls-row">
          <button
            className="btn snake-btn"
            onClick={() => changeDirection('left')}
            onMouseDown={() => changeDirection('left')}
          >
            ←
          </button>
          <button
            className="btn snake-btn snake-btn-center"
            onClick={gameState === 'ready' || gameState === 'over' ? startGame : togglePause}
          >
            {gameState === 'ready' ? '▶' : gameState === 'over' ? '↻' : '⏸'}
          </button>
          <button
            className="btn snake-btn"
            onClick={() => changeDirection('right')}
            onMouseDown={() => changeDirection('right')}
          >
            →
          </button>
        </div>
        <div className="snake-controls-row">
          <button
            className="btn snake-btn"
            onClick={() => changeDirection('down')}
            onMouseDown={() => changeDirection('down')}
          >
            ↓
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-hint)', marginTop: 16, paddingBottom: 8 }}>
        💡 电脑用键盘方向键，手机用下方按钮
      </div>
    </div>
  )
}

export default GamePage
