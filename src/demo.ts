import { draw, initWindow, DrawLayout, SampleCanvasType, SampleImageType, windowInfo } from './json2canvas'
const layout: DrawLayout = {
  type: 'view',
  styles: {
    display: 'inline-flex',
    // display: 'inline-block',
    overflow: 'hidden',
    background: 'pink',
    // 'flex-direction': 'column',
    'flex-wrap': 'wrap',
    width: '350px',
    'font-size': 0,
    padding: '20px',
    position: 'relative',
    'justify-content': 'flex-end'
    // height: '250px'
  },
  children: [
    {
      type: 'view',
      styles: {
        width: 'calc(55% + 100px)',
        // width: '55%',
        height: '100px',
        background:
          'url("https://image.brightfuture360.com/static/temple/merit-box/btn-1.png") no-repeat center top calc(-15% + 10px)/cover,linear-gradient(135deg, red, orange 10%, yellow, green, blue 31%,40%,purple 50%,black calc(100% - 20px), #fff) repeat bottom 10px right/calc(100% - min(1%, 5px)) calc(calc(50% / 2) - calc(10px + 5px)) content-box,#ff0000 padding-box content-box',
        flex: '1 2 auto',
        // 'box-sizing': 'content-box',
        'box-sizing': 'border-box',
        display: 'inline-block',
        padding: '0 calc(3% + 5px)',
        'border-radius': '30px',
        'border-top': '10px solid #4335ec00',
        'border-right': '20px solid #29de9d7d'
      }
    },
    {
      type: 'view',
      styles: {
        width: 'auto',
        height: '100px',
        background: 'yellow',
        flex: '1 1 auto',
        overflow: 'hidden',
        display: 'inline-flex',
        'box-sizing': 'content-box',
        'transform-origin': 'right top',
        transform: 'scale(.8, .8) skew(20deg) rotate(30deg) translate(10px, calc(50px - 5%))'
      },
      children: [
        {
          type: 'view',
          styles: {
            width: '60px',
            height: '50px',
            background: 'purple',
            // margin: '20px 0',
            'align-self': 'flex-start',
            display: 'inline-block'
          }
        },
        {
          type: 'view',
          styles: {
            width: '90px',
            height: '50px',
            background: 'aqua',
            display: 'inline-block'
          }
        }
      ]
    },
    {
      type: 'view',
      styles: {
        width: '100px',
        // height: 'auto',
        height: '50px',
        background: 'green',
        flex: '0 1 auto',
        'box-sizing': 'content-box',
        display: 'block',
        margin: '0 0 30px 0'
        // position: 'absolute'
        // right: '0'
        // padding: '0 min(5%, 20px)'
      },
      children: [
        {
          type: 'view',
          styles: {
            width: '20px',
            height: '20px',
            background: 'black',
            position: 'absolute',
            bottom: 'calc(20px + 30%)',
            transform: 'translate(100%, -17px) scale(1.5)'
          }
        },
        {
          type: 'view',
          styles: {
            width: '100px',
            position: 'absolute',
            top: '10px',
            left: '20px',
            'font-size': '14px',
            color: '#333',
            'font-weight': 500,
            background: '#eee',
            'line-height': 1.4,
            // 'line-break': 'anywhere',
            'white-space': 'normal', // normal,nowrap,pre,pre-line
            'word-break': 'normal', // keep-all,break-all,normal
            'overflow-wrap': 'anywhere' // anywhere,normal,break-word
          },
          content: `This is a long》 and
          Honorificabilitudinitatibus califragilisticexpialidocious Taumatawhakatangihangakoauauotamateaturipukakapikimaungahoronukupokaiwhenuakitanatahu
          abcグレートブリテンdefおよび北アイルランド連合王国という言葉は本当に長い言葉`
        }
      ]
    },
    {
      type: 'view',
      styles: {
        width: '100px',
        height: '100px',
        background: 'blue',
        'border-radius': '25px',
        flex: '0 2 auto',
        padding: '0 20px',
        // 'box-sizing': 'border-box',
        display: 'inline-block',
        'box-shadow': 'inset -20px -10px 10px 20px #000, 5px 5px 5px',
        'align-self': 'center',
        'font-size': '14px',
        'line-height': '20px',
        color: '#ffffff'
      },
      content: 'Json2canvas'
    },
    {
      type: 'view',
      styles: {
        width: '100px',
        height: '100px',
        background: 'plum',
        flex: '0 1 auto',
        'box-sizing': 'content-box',
        margin: '20px 0',
        display: 'block',
        'align-self': 'center'
        // padding: '0 max(5%, 20px)'
      }
    },
    {
      type: 'view',
      styles: {
        width: '200px',
        height: '200px',
        background: 'orange content-box',
        flex: '0 1 auto',
        'box-sizing': 'content-box',
        margin: '10px 0 0',
        display: 'inline-block',
        'align-self': 'center',
        'border-top': '10px solid #fff',
        'border-left': '20px solid transparent',
        'border-right': '40px solid',
        'border-radius': '50px 20px',
        'box-shadow': '0px -90px 10px 10px #4751bb, inset 10px 10px 10px 20px #fff440'
      }
    }
  ]
}
const layout2: DrawLayout = {
  type: 'view',
  content: '',
  styles: {
    width: '750rpx',
    'border-radius': '15rpx',
    'transform-origin': 'left top',
    transform: 'scale(0.5)',
    overflow: 'hidden',
    position: 'relative',
    background:
      'url(https://image.brightfuture360.com/static/temple/practice-together/canvas/background-0-0.png) no-repeat top/contain,url(https://image.brightfuture360.com/static/temple/practice-together/canvas/background-0-1.png) no-repeat bottom/contain,#f3c992'
  },
  children: [
    {
      type: 'img',
      content: 'https://image.brightfuture360.com/static/temple/practice-together/canvas/title-dktj.png',
      styles: {
        display: 'block',
        width: '288rpx',
        height: '77rpx',
        'object-fit': 'contain',
        margin: '77rpx auto 0'
      }
    },
    {
      type: 'view',
      content: '2023-03-24',
      styles: {
        width: '212rpx',
        height: '50rpx',
        'border-radius': '25rpx',
        background: 'rgba(207, 146, 83, 0.8)',
        margin: '19rpx auto 0',
        'font-size': '25rpx',
        'font-weight': 400,
        color: '#fff7cf',
        'line-height': '50rpx',
        'text-align': 'center'
      }
    },
    {
      type: 'view',
      content: '',
      styles: {
        margin: '38rpx auto 0',
        width: '673rpx',
        padding: '56rpx 0',
        'box-sizing': 'border-box',
        background:
          'url(https://image.brightfuture360.com/static/temple/practice-together/canvas/box-0-0.png) no-repeat top/contain,url(https://image.brightfuture360.com/static/temple/practice-together/canvas/box-0-1.png) repeat-y center/contain content-box,url(https://image.brightfuture360.com/static/temple/practice-together/canvas/box-0-2.png) no-repeat bottom/contain'
      },
      children: [
        {
          type: 'view',
          content: `收到大家发心恭送：


          我是谁101遍
          你是哪个200遍
          他又是谁啊321遍
          
          共同虔诚回向：呕拎油共修打卡详细数量统计（遍）：
          
          统计日期：2023-06-5`,
          styles: {
            'white-space': 'pre-line',
            padding: '0 58rpx',
            'font-size': '31rpx',
            'font-weight': 400,
            'line-height': '50rpx',
            color: '#222220'
          }
        }
      ]
    },
    {
      type: 'view',
      content: '大德寺共修打卡',
      styles: {
        'font-size': '35rpx',
        'font-weight': 400,
        color: '#4d2607',
        'line-height': '48rpx',
        margin: '58rpx 0 0 50rpx'
      }
    },
    {
      type: 'view',
      content: '扫码加入小组，一起共修打卡',
      styles: {
        'font-size': '25rpx',
        'font-weight': 200,
        color: '#7d3d0a',
        'line-height': '35rpx',
        margin: '15rpx 0 91rpx 50rpx'
      }
    },
    {
      type: 'view',
      content: '',
      styles: {
        position: 'absolute',
        right: '50rpx',
        bottom: '71rpx',
        width: '138rpx',
        height: '138rpx',
        background: '#ffffff',
        'border-radius': '8rpx'
      }
    },
    {
      type: 'img',
      content: 'https://image.brightfuture360.com/static/temple/practice-together/share/img-qrcode.png',
      styles: {
        position: 'absolute',
        width: '115rpx',
        height: '115rpx',
        bottom: '82rpx',
        right: '62rpx',
        'object-fit': 'contain'
      }
    }
  ]
}
const layout3: DrawLayout = {
  type: 'view',
  styles: {
    padding: '250rpx 50rpx 50rpx',
    display: 'inline-block',
    background: 'pink'
  },
  children: [
    {
      type: 'view',
      styles: {
        width: '400rpx',
        height: '400rpx',
        background: 'orange content-box',
        flex: '0 1 auto',
        'box-sizing': 'content-box',
        margin: '20rpx 0 0',
        display: 'inline-block',
        'align-self': 'center',
        'border-top': '20rpx solid #fff',
        'border-left': '40rpx solid transparent',
        'border-right': '80rpx solid',
        'border-radius': '100rpx 40rpx',
        'box-shadow': '0rpx -180rpx 20rpx 20rpx #4751bb, inset 20rpx 20rpx 20rpx 40rpx #fff440'
      }
    }
  ]
}
const layout4: DrawLayout = {
  type: 'view',
  styles: {
    display: 'inline-flex',
    // display: 'inline-block',
    overflow: 'hidden',
    background: 'pink',
    // 'flex-direction': 'column',
    'flex-wrap': 'wrap',
    width: '660rpx',
    'font-size': 0,
    padding: '40rpx',
    position: 'relative',
    'justify-content': 'flex-start'
    // height: '250rpx'
  },
  children: [
    {
      type: 'view',
      styles: {
        width: 'calc(55% + 200rpx)',
        // width: '55%',
        height: '200rpx',
        background:
          'url("https://image.brightfuture360.com/static/temple/merit-box/btn-1.png") no-repeat center top calc(-15% + 20rpx)/cover,linear-gradient(135deg, red, orange 10%, yellow, green, blue 31%,40%,purple 50%,black calc(100% - 40rpx), #fff) repeat bottom 20rpx right/calc(100% - min(1%, 10rpx)) calc(calc(50% / 2) - calc(20rpx + 10rpx)) content-box,#ff0000 padding-box content-box',
        flex: '1 2 auto',
        // 'box-sizing': 'content-box',
        'box-sizing': 'border-box',
        display: 'inline-block',
        padding: '0 calc(3% + 10rpx)',
        'border-radius': '60rpx',
        'border-top': '20rpx solid #4335ec00',
        'border-right': '40rpx solid #29de9d7d'
      }
    },
    {
      type: 'view',
      styles: {
        width: 'auto',
        height: '200rpx',
        background: 'yellow',
        flex: '1 1 auto',
        overflow: 'hidden',
        display: 'inline-flex',
        'box-sizing': 'content-box',
        'transform-origin': 'right top',
        transform: 'scale(.8, .8) skew(20deg) rotate(30deg) translate(20rpx, calc(100rpx - 5%))'
      }
      /* children: [
        {
          type: 'view',
          styles: {
            width: '120rpx',
            height: '100rpx',
            background: 'purple',
            // margin: '20rpx 0',
            'align-self': 'flex-start',
            display: 'inline-block'
          }
        },
        {
          type: 'view',
          styles: {
            width: '180rpx',
            height: '100rpx',
            background: 'aqua',
            display: 'inline-block'
          }
        }
      ] */
    },
    {
      type: 'view',
      styles: {
        width: '200rpx',
        // height: 'auto',
        height: '100rpx',
        background: 'green',
        flex: '0 1 auto',
        'box-sizing': 'content-box',
        display: 'block',
        margin: '0 0 60rpx 0'
        // position: 'absolute'
        // right: '0'
        // padding: '0 min(5%, 20rpx)'
      },
      children: [
        {
          type: 'view',
          styles: {
            width: '400rpx',
            height: '400rpx',
            background: 'rgba(0,0,0,0.3)',
            position: 'absolute',
            // 'z-index': -1,
            left: '0',
            bottom: '600rpx'
            // transform: 'translate(10%, -34rpx) scale(1.5)'
          }
        },
        {
          type: 'view',
          styles: {
            width: '95rpx',
            height: '95rpx',
            background: 'rgba(0,0,255,0.3)',
            position: 'absolute',
            right: 0,
            top: 0
            // transform: 'translate(10%, -34rpx) scale(1.5)'
          }
        }
      ]
    },
    {
      type: 'view',
      styles: {
        width: '100rpx',
        height: '100rpx',
        background: 'blue',
        'border-radius': '25rpx',
        flex: '0 2 auto',
        padding: '0 20rpx',
        // 'box-sizing': 'border-box',
        display: 'inline-block',
        'box-shadow': 'inset -20rpx -10rpx 10rpx 20rpx #000, 5rpx 5rpx 5rpx',
        'align-self': 'center',
        'font-size': '14rpx',
        'line-height': '20rpx',
        color: '#ffffff'
      },
      content: 'Json2canvas'
    },
    {
      type: 'view',
      styles: {
        width: '200rpx',
        height: '200rpx',
        background: 'plum',
        flex: '0 1 auto',
        'box-sizing': 'content-box',
        margin: '40rpx 0',
        display: 'block',
        'align-self': 'center'
        // padding: '0 max(5%, 20rpx)'
      }
    },
    {
      type: 'view',
      styles: {
        width: '400rpx',
        height: '400rpx',
        background: 'orange content-box',
        flex: '0 1 auto',
        'box-sizing': 'content-box',
        margin: '20rpx 0 0',
        display: 'inline-block',
        'align-self': 'center',
        'border-top': '20rpx solid #fff',
        'border-left': '40rpx solid transparent',
        'border-right': '80rpx solid',
        'border-radius': '100rpx 40rpx',
        'box-shadow': '0rpx -180rpx 20rpx 20rpx #4751bb, inset 20rpx 20rpx 20rpx 40rpx #fff440'
      }
    }
  ]
}
window.onload = () => {
  const demoLayout = layout
  const h = (l: DrawLayout): HTMLDivElement | HTMLImageElement => {
    const _children = l.children ? l.children.map(e => h(e)) : l.type === 'view' && l.content ? l.content : ''
    const tag = l.type === 'view' ? 'div' : 'img'
    const el = document.createElement(tag)
    el.style.cssText = Object.entries(l.styles)
      .map(e => `${e[0]}:${e[1]}`)
      .join(';')
      .replace(/([\d\.]+)rpx/g, (_, v) => `${v * windowInfo.unit.rpx}px`)
    if (tag === 'img' && l.content) {
      el.setAttribute('src', l.content)
    }
    if (_children) {
      if (Array.isArray(_children)) {
        _children.forEach(e => el.appendChild(e))
      } else {
        el.textContent = _children
      }
    }
    return el
  }
  const demoDom = document.getElementById('demo_dom')
  const demoCanvas = document.getElementById('demo_canvas') as HTMLCanvasElement
  function createCanvas(isOffScreen: false): Promise<SampleCanvas.Canvas<true>>
  function createCanvas(isOffScreen: true, width?: number, height?: number): Promise<SampleCanvas.Canvas<false>>
  function createCanvas(isOffScreen: boolean, width = 1, height = 1) {
    if (isOffScreen) {
      return new Promise<SampleCanvasType<false>>(resolve => {
        const dpr = windowInfo.dpr || 1
        const offCanvas = new OffscreenCanvas(
          (width as number) * dpr,
          (height as number) * dpr
        ) as unknown as SampleCanvasType<false>
        //
        /* const offCanvas = document.createElement('canvas') as unknown as SampleCanvasType<false>
        offCanvas.width = (width as number) * dpr
        offCanvas.height = (height as number) * dpr */
        //
        offCanvas.getContext('2d')!.scale(dpr, dpr)
        resolve(offCanvas)
      })
    } else {
      return new Promise<SampleCanvasType<true>>(resolve => {
        resolve(document.createElement('canvas') as unknown as SampleCanvasType<true>)
      })
    }
  }
  initWindow({
    // dpr: window.devicePixelRatio,
    dpr: 1,
    unit: {
      rpx: 0.5
    },
    createCanvas,
    createImage: (src: string) =>
      new Promise(resolve => {
        const img = new Image() as SampleImageType
        img.onload = () => resolve(img)
        img.src = src
      }),
    baseInheritMap: {
      'font-size': {
        rootValue: '14px',
        inheritFn(rect, commonGetInherit) {
          const fontSizeAst = commonGetInherit(rect, 'font-size')![0]
          if (typeof fontSizeAst === 'object' && 'value' in fontSizeAst) {
            const rate = windowInfo.unit[fontSizeAst.unit] || 1
            const val = fontSizeAst.value * rate
            fontSizeAst.value = Math.max(12, val) / rate
          }
          return [fontSizeAst]
        }
      }
    }
  })
  demoDom!.appendChild(h(demoLayout))
  draw(demoLayout).then(res => {
    const { canvas, width, height, layout } = res! || {}
    console.log(137, canvas, width, height, layout)
    if (demoCanvas) {
      const canvasEl = demoCanvas
      canvasEl.width = width
      canvasEl.height = height
      canvasEl.style.width = width + 'px'
      const ctx = canvasEl.getContext('2d')
      ctx?.drawImage(canvas as OffscreenCanvas, 0, 0, width, height)
    }
  })
}
