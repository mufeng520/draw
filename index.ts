import { definePlugin } from 'mioki'
import fs from 'fs'
import path from 'path'
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'

// Canvas 封装类
class CanvasWrapper {
  private canvas: any
  private ctx: any
  private defaultFontFamily: string

  constructor(width: number, height: number, fontFamily: string ) {
    this.canvas = createCanvas(width, height)
    this.ctx = this.canvas.getContext('2d')
    this.defaultFontFamily = fontFamily
  }

  // 设置背景
  setBackground(color: string = '#ffffff') {
    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    return this
  }

  // 设置背景图片（支持 SVG 格式）
  async setBackgroundImage(imagePath: string) {
    try {
      const image = await loadImage(imagePath)
      // 绘制背景图片，覆盖整个画布
      this.ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height)
      return this
    } catch (error) {
      throw new Error(`加载背景图片失败: ${error}`)
    }
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
    fontWeight?: string
    maxWidth?: number // 最大宽度，超过则自动换行
    lineHeight?: number // 行高
  } = {}) {
    const {
      fontSize = 16,
      fontColor = '#000000',
      fontFamily = this.defaultFontFamily,
      textAlign = 'left',
      textBaseline = 'top',
      fontWeight = 'normal',
      maxWidth = 400,
      lineHeight = fontSize * 1.5
    } = options

    // 确保字体设置正确
    try {
      this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    } catch (error) {
      // 如果字体设置失败，使用默认字体
      this.ctx.font = `${fontSize}px Arial`
    }
    
    // 设置文本样式
    this.ctx.fillStyle = fontColor
    this.ctx.textAlign = textAlign
    this.ctx.textBaseline = textBaseline
    
    // 自动换行处理
    if (maxWidth > 0) {
      const words = text.split(' ')
      let line = ''
      let currentY = y
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' '
        const metrics = this.ctx.measureText(testLine)
        const testWidth = metrics.width
        
        if (testWidth > maxWidth && i > 0) {
          // 绘制当前行
          this.ctx.fillText(line, x, currentY)
          // 开始新行
          line = words[i] + ' '
          currentY += lineHeight
        } else {
          line = testLine
        }
      }
      // 绘制最后一行
      this.ctx.fillText(line, x, currentY)
    } else {
      // 不换行，直接绘制
      this.ctx.fillText(text, x, y)
    }
    
    return this
  }

  // 添加图片（支持 SVG 格式）
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

  // 添加圆形图片（用于头像，支持 SVG 格式）
  async addCircleImage(imagePath: string, x: number, y: number, radius: number) {
    try {
      const image = await loadImage(imagePath)
      
      // 保存上下文
      this.ctx.save()
      
      // 绘制圆形遮罩
      this.ctx.beginPath()
      this.ctx.arc(x, y, radius, 0, Math.PI * 2)
      this.ctx.clip()
      
      // 绘制图片
      const diameter = radius * 2
      this.ctx.drawImage(image, x - radius, y - radius, diameter, diameter)
      
      // 恢复上下文
      this.ctx.restore()
      
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
  name: 'draw',
  version: '1.0.0',
  async setup(ctx) {
    // 尝试使用 GlobalFonts 注册 unifont 字体
    const unifontPath = ctx.path.join(__dirname, 'fonts', 'unifont-17.0.04.otf')
    let unifontRegistered = false
    try {
      if (fs.existsSync(unifontPath)) {
        if (GlobalFonts) {
          GlobalFonts.registerFromPath(unifontPath, 'Unifont')
          ctx.logger.info('unifont 字体注册成功')
          unifontRegistered = true
        } else {
          ctx.logger.warn('GlobalFonts 不可用，使用系统默认字体')
        }
      } else {
        ctx.logger.warn('unifont 字体文件不存在:', unifontPath)
      }
    } catch (error) {
      ctx.logger.error('注册 unifont 字体失败:', error)
    }

    // 全局字体配置 - 只使用 unifont 字体
    const defaultFontFamily = unifontRegistered ? 'Unifont' : 'Arial'
    ctx.logger.info('使用字体:', defaultFontFamily)

    // 生成图片的函数
    const generateImage = async (text: string): Promise<Buffer> => {
      // 计算文本长度，确定画布大小
      const lines = text.split('\n')
      const maxLineLength = Math.max(...lines.map(line => line.length))
      const width = Math.max(400, maxLineLength * 16 + 40)
      const height = lines.length * 30 + 40

      // 创建画布包装器
      const canvas = new CanvasWrapper(width, height, defaultFontFamily)
      
      // 尝试使用背景图片
      const backgroundImagePath = ctx.path.join(__dirname, '../../background.jpg')
      try {
        if (fs.existsSync(backgroundImagePath)) {
          await canvas.setBackgroundImage(backgroundImagePath)
          ctx.logger.info('使用背景图片:', backgroundImagePath)
        } else {
          // 如果没有背景图片，使用纯色背景
          canvas.setBackground('#ffffff')
            .drawRect(0, 0, width, height, 'transparent', '#e0e0e0', 2)
          ctx.logger.info('使用纯色背景')
        }
      } catch (error) {
        ctx.logger.error('设置背景失败:', error)
        // 出错时使用纯色背景
        canvas.setBackground('#ffffff')
          .drawRect(0, 0, width, height, 'transparent', '#e0e0e0', 2)
      }

      // 绘制文本 - 使用更深的文字颜色，提高对比度
      lines.forEach((line, index) => {
        canvas.addText(line, 20, 20 + index * 30, {
          fontSize: 16,
          fontColor: '#000000',
          fontFamily: defaultFontFamily,
          maxWidth: width - 40 // 左右各留 20 像素边距
        })
      })

      // 转换为 buffer
      return canvas.toBuffer('image/png')
    }

    // 生成带图形的图片的函数（异步）
    const generateImageWithShapes = async (text: string, userInfo?: { avatar: string; nickname: string }): Promise<Buffer> => {
      // 计算文本长度，确定画布大小
      const lines = text.split('\n')
      const maxLineLength = Math.max(...lines.map(line => line.length))
      const width = Math.max(500, maxLineLength * 16 + 100)
      const height = Math.max(400, lines.length * 30 + (userInfo ? 120 : 150))

      // 创建画布包装器
      const canvas = new CanvasWrapper(width, height, defaultFontFamily)
      
      // 尝试使用背景图片
      const backgroundImagePath = ctx.path.join(__dirname, '../../background.jpg')
      try {
        if (fs.existsSync(backgroundImagePath)) {
          await canvas.setBackgroundImage(backgroundImagePath)
          ctx.logger.info('使用背景图片:', backgroundImagePath)
        } else {
          // 如果没有背景图片，使用纯色背景
          canvas.setBackground('#ffffff')
            .drawRect(0, 0, width, height, 'transparent', '#e0e0e0', 2)
          ctx.logger.info('使用纯色背景')
        }
      } catch (error) {
        ctx.logger.error('设置背景失败:', error)
        // 出错时使用纯色背景
        canvas.setBackground('#ffffff')
          .drawRect(0, 0, width, height, 'transparent', '#e0e0e0', 2)
      }

      // 绘制用户头像和昵称
      if (userInfo) {
        try {
          // 绘制圆形头像
          await canvas.addCircleImage(userInfo.avatar, 80, 60, 30)
          // 绘制昵称 - 使用更深的文字颜色，提高对比度
          canvas.addText(userInfo.nickname, 130, 50, {
            fontSize: 18,
            fontColor: '#000000',
            fontFamily: defaultFontFamily,
            fontWeight: 'bold'
          })
        } catch (error) {
          ctx.logger.error('绘制用户信息失败:', error)
          // 如果头像加载失败，绘制默认圆形头像
          canvas.drawCircle(80, 60, 30, '#cccccc', '#999999', 2)
          canvas.addText(userInfo.nickname || '未知用户', 130, 50, {
            fontSize: 18,
            fontColor: '#000000',
            fontFamily: defaultFontFamily,
            fontWeight: 'bold'
          })
        }
      }

      // 绘制文本 - 使用更深的文字颜色，提高对比度
      const textStartY = userInfo ? 120 : 120
      lines.forEach((line, index) => {
        canvas.addText(line, 50, textStartY + index * 30, {
          fontSize: 16,
          fontColor: '#000000',
          fontFamily: defaultFontFamily,
          maxWidth: width - 100 // 左右各留 50 像素边距
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
        // 获取用户信息
        const userInfo = {
          avatar: `http://q2.qlogo.cn/headimg_dl?dst_uin=${e.user_id}&spec=100`,
          // http://q.qlogo.cn/headimg_dl?dst_uin=2018998107&spec=640&img_type=jpg
          nickname: e.sender.nickname || `用户${e.user_id}`
        }

        // 生成带图形的图片
        const imageBuffer = await generateImageWithShapes(text, userInfo)

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
          // 获取用户信息
          const userInfo = {
            avatar: `http://q2.qlogo.cn/headimg_dl?dst_uin=${e.user_id}&spec=100`,
            nickname: e.sender.nickname || `用户${e.user_id}`
          }

          // 生成带图形的图片
          const imageBuffer = await generateImageWithShapes(content, userInfo)

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
