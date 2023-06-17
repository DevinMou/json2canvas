// component/canvas/index.ts
import { draw, DrawLayout, initWindow, windowInfo, SampleCanvasType } from '../../utils/json2canvas/json2canvas/index' // Replace it with your built file path
const ramStr = (n = 6) => {
  return Array(n)
    .fill(1)
    .map(_ => ((Math.random() * 36) | 0).toString(36))
    .join('')
}

Component({
  /**
   * 组件的属性列表
   */
  properties: {},
  /**
   * 组件的初始数据
   */
  data: {
    canvas: []
  },
  /**
   * 组件的方法列表
   */
  methods: {
    createCanvas(_isOffscreen: boolean, width = 1, height = 1) {
      const _this = this
      return new Promise<SampleCanvasType<false>>(resolve => {
        if (width && height) {
          width = +width.toFixed(3)
          height = +height.toFixed(3)
        }
        const id = `canvas_${ramStr(4)}`
        const k = `canvas[${this.data.canvas.length}]`
        this.setData({
          [k]: {
            id,
            width,
            height
          }
        })
        wx.nextTick(() => {
          const query = wx.createSelectorQuery().in(this)
          query
            .select(`#${id}`)
            .fields({ node: true, size: true })
            .exec(res => {
              if (res[0] && res[0].node) {
                const canvas = res[0].node
                if (width !== undefined) {
                  canvas.width = width
                }
                if (height !== undefined) {
                  canvas.height = height
                }
                canvas._id = id
                //
                canvas._getContext = canvas.getContext
                canvas.getContext = (type: '2d' | 'webgl') => {
                  const ctx = canvas._getContext(type)
                  if (type === '2d') {
                    const _ctx = new Proxy({}, {
                      get(_target, prop) {
                        if (prop === 'drawImage') {
                          return async (...args: any[]) => {
                            const param_1st = args[0]
                            const options = args.slice(1)
                            if (param_1st.getContext) {
                              let url = ''
                              if ('toDataURL' in param_1st) {
                                url = param_1st.toDataURL()
                              }
                              if (!url) {
                                url = await new Promise(r2 => {
                                  wx.canvasToTempFilePath({
                                    param_1st,
                                    success: res => r2(res.tempFilePath),
                                    fail: err => console.log(586, err)
                                  }, _this)
                                })
                              }
                              const img = await windowInfo.createImage!(url)
                              return ctx.drawImage(img, ...options)
                            } else {
                              return ctx.drawImage(...args)
                            }
                          }
                        } else {
                          const val = ctx[prop]
                          return typeof val === 'function' ? val.bind(ctx) : val
                        }
                      },
                      set(_target, prop, val) {
                        ctx[prop] = val
                        return true
                      }
                    })
                    return _ctx
                  }
                  return ctx
                }
                //
                resolve(canvas as SampleCanvasType<false>)
              }
            })
        })
      })
    },
    clearCanvas() {
      this.setData({
        canvas: []
      })
    },
    draw(layout: DrawLayout) {
      const _this = this
      return draw(layout).then(res => {
        const { canvas, width, height, layout } = res!
        return new Promise(resolve => {
          wx.canvasToTempFilePath({
            success: res => {
              resolve({ path: res.tempFilePath, width: width * windowInfo.dpr, height: height * windowInfo.dpr })
            },
            fail: err => {
              console.log(802, err)
            },
            canvas
          }, _this)
        })
      })
    }
  },
  lifetimes: {
    ready() {
      if (!windowInfo.createCanvas) {
        const systemInfo = wx.getSystemInfoSync()
        initWindow({
          unit: {
            rpx: systemInfo.windowWidth / 750
          },
          dpr: systemInfo.platform === 'android' ? systemInfo.pixelRatio : 1,
          createCanvas: this.createCanvas.bind(this) as typeof windowInfo['createCanvas'],
          // clearCanvas: this.clearCanvas.bind(this)
        })
      }
      windowInfo.createCanvas!(false).then(imageCanvas => {
        initWindow({
          createImage(src) {
            return new Promise(resolve => {
              const img = (imageCanvas as unknown as WechatMiniprogram.Canvas).createImage()
              img.onload = () => resolve(img)
              img.src = src
            })
          }
        })
      })
    }
  }
})
