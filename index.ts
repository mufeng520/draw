import { definePlugin } from 'mioki'
import fs from 'fs'
import path from 'path'
import { createCanvas, registerFont, loadImage } from 'canvas'

// Canvas 封装类
class CanvasWrapper {
  private canvas: any
  private ctx: any

  constructor(width: number, height: number) {
    this.canvas = createCanvas(width, height)
    this.ctx = this.canvas.getContext('2d')
  }

  // 设置背景
  setBackground(color: string = '#ffffff') {
    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    return this
  }

  // 绘制矩形
  drawRect(x: number, y: number, width: number, height: number, fillColor: string = '#000000', strokeColor: string | null = null, lineWidth: number = 1) {
    // 填充矩形
    this.ctx.fillStyle = fillColor
    this.ctx.fillRect(x, y, width, height)
    
    // 绘制边框
    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor
      this.ctx.lineWidth = lineWidth
      this.ctx.strokeRect(x, y, width, height)
    }
    return this
  }

  // 绘制圆形
  drawCircle(x: number, y: number, radius: number, fillColor: string = '#000000', strokeColor: string | null = null, lineWidth: number = 1) {
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, Math.PI * 2)
    
    // 填充圆形
    this.ctx.fillStyle = fillColor
    this.ctx.fill()
    
    // 绘制边框
    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor
      this.ctx.lineWidth = lineWidth
      this.ctx.stroke()
    }
    return this
  }

  // 绘制三角形
  drawTriangle(points: [number, number][], fillColor: string = '#000000', strokeColor: string | null = null, lineWidth: number = 1) {
    if (points.length < 3) {
      throw new Error('三角形至少需要3个点')
    }

    this.ctx.beginPath()
    this.ctx.moveTo(points[0][0], points[0][1])
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i][0], points[i][1])
    }
    this.ctx.closePath()
    
    // 填充三角形
    this.ctx.fillStyle = fillColor
    this.ctx.fill()
    
    // 绘制边框
    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor
      this.ctx.lineWidth = lineWidth
      this.ctx.stroke()
    }
    return this
  }

  // 添加文本
  addText(text: string, x: number, y: number, options: {
    fontSize?: number
    fontColor?: string
    fontFamily?: string
    textAlign?: 'left' | 'center' | 'right'
    textBaseline?: 'top' | 'middle' | 'bottom'
  } = {}) {
    const {
      fontSize = 16,
      fontColor = '#000000',
      fontFamily = 'Arial',
      textAlign = 'left',
      textBaseline = 'top'
    } = options

    this.ctx.font = `${fontSize}px ${fontFamily}`
    this.ctx.fillStyle = fontColor
    this.ctx.textAlign = textAlign
    this.ctx.textBaseline = textBaseline
    this.ctx.fillText(text, x, y)
    return this
  }

  // 添加图片
  async addImage(imagePath: string, x: number, y: number, width?: number, height?: number) {
    try {
      const image = await loadImage(imagePath)
      if (width && height) {
        this.ctx.drawImage(image, x, y, width, height)
      } else {
        this.ctx.drawImage(image, x, y)
      }
      return this
    } catch (error) {
      throw new Error(`加载图片失败: ${error}`)
    }
  }

  // 转换为 buffer
  toBuffer(format: string = 'image/png') {
    return this.canvas.toBuffer(format)
  }

  // 获取画布宽度
  getWidth() {
    return this.canvas.width
  }

  // 获取画布高度
  getHeight() {
    return this.canvas.height
  }
}

export default definePlugin({
  name: 'text2image',
  version: '1.0.0',
  async setup(ctx) {
    // 确保字体目录存在
    const fontDir = ctx.path.join(__dirname, 'fonts')
    if (!fs.existsSync(fontDir)) {
      fs.mkdirSync(fontDir, { recursive: true })
    }

    // 注册默认字体（如果需要）
    // 这里可以添加字体文件，然后使用 registerFont 注册

    // 生成图片的函数
    const generateImage = (text: string): Buffer => {
      // 计算文本长度，确定画布大小
      const lines = text.split('\n')
      const maxLineLength = Math.max(...lines.map(line => line.length))
      const width = Math.max(400, maxLineLength * 16 + 40)
      const height = lines.length * 30 + 40

      // 创建画布包装器
      const canvas = new CanvasWrapper(width, height)
      
      // 设置背景和边框
      canvas.setBackground('#ffffff')
        .drawRect(0, 0, width, height, 'transparent', '#e0e0e0', 2)

      // 绘制文本
      lines.forEach((line, index) => {
        canvas.addText(line, 20, 20 + index * 30, {
          fontSize: 16,
          fontColor: '#333333',
          fontFamily: 'Arial'
        })
      })

      // 转换为 buffer
      return canvas.toBuffer('image/png')
    }

    // 生成带图形的图片的函数（异步）
    const generateImageWithShapes = async (text: string): Promise<Buffer> => {
      // 计算文本长度，确定画布大小
      const lines = text.split('\n')
      const maxLineLength = Math.max(...lines.map(line => line.length))
      const width = Math.max(500, maxLineLength * 16 + 100)
      const height = Math.max(400, lines.length * 30 + 150)

      // 创建画布包装器
      const canvas = new CanvasWrapper(width, height)
      
      // 设置背景
      canvas.setBackground('#f5f5f5')
        .drawRect(0, 0, width, height, 'transparent', '#dddddd', 2)

      // 绘制装饰图形
      canvas.drawCircle(50, 50, 30, '#ff6b6b', '#333333', 2)
        .drawRect(100, 20, 80, 60, '#4ecdc4', '#333333', 2)
        .drawTriangle([[200, 20], [240, 80], [160, 80]], '#45b7d1', '#333333', 2)

      // 绘制文本
      lines.forEach((line, index) => {
        canvas.addText(line, 50, 120 + index * 30, {
          fontSize: 16,
          fontColor: '#333333',
          fontFamily: 'Arial'
        })
      })

      // 转换为 buffer
      return canvas.toBuffer('image/png')
    }

    // 处理私聊消息
    ctx.handle('message.private', async (e) => {
      const text = ctx.text(e)
      
      // 忽略空消息或命令消息
      if (!text || text.startsWith('#')) {
        return
      }

      try {
        // 生成带图形的图片
        const imageBuffer = await generateImageWithShapes(text)

        // 发送图片
        await e.reply([
          ctx.segment.image(imageBuffer)
        ])

        ctx.logger.info(`已将消息转换为图片发送给用户 ${e.user_id}`)
      } catch (error) {
        ctx.logger.error('生成图片失败:', error)
        await e.reply('生成图片失败，请稍后再试')
      }
    })

    // 处理群消息（可选）
    ctx.handle('message.group', async (e) => {
      const text = ctx.text(e)

      // 只处理特定命令
      if (text.startsWith('#转图片')) {
        const content = text.slice(4).trim()
        if (!content) {
          await e.reply('请输入要转换的文本，格式：#转图片 文本内容')
          return
        }

        try {
          // 生成带图形的图片
          const imageBuffer = await generateImageWithShapes(content)

          // 发送图片
          await e.reply([
            ctx.segment.image(imageBuffer)
          ])

          ctx.logger.info(`已将群消息转换为图片发送`)
        } catch (error) {
          ctx.logger.error('生成图片失败:', error)
          await e.reply('生成图片失败，请稍后再试')
        }
      }
    })

    ctx.logger.info('文字转图片插件已加载')
  }
})
