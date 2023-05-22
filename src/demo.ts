import { draw, initWindow, DrawLayout, SampleCanvasType, SampleImageType } from './json2canvas'
  const layout: DrawLayout = {
    type: 'view',
    styles: {
      display: 'inline-block',
      background: 'pink',
      // 'flex-direction': 'column',
      'flex-wrap': 'wrap',
      'font-size': 0,
      'justify-content': 'flex-end'
      // height: '250px'
    },
    children: [
      {
        type: 'view',
        styles: {
          width: '55%',
          height: '100px',
          background: 'red',
          flex: '1 2 auto',
          'box-sizing': 'content-box',
          display: 'inline-block'
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
          transform: 'scale(1.5, 1.5) skew(20deg) rotate(30deg) translate(30px, 50px)'
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
          height: 'auto',
          background: 'green',
          flex: '0 1 auto',
          'box-sizing': 'content-box',
          display: 'inline-block',
          margin: '0 0 30px 0'
        }
      },
      {
        type: 'view',
        styles: {
          width: '100px',
          height: '100px',
          background: 'blue',
          flex: '0 2 auto',
          padding: '0 20px',
          'box-sizing': 'border-box',
          display: 'inline-block',
          'align-self': 'center'
        }
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
        }
      },
      {
        type: 'view',
        styles: {
          width: '100px',
          height: '100px',
          background: 'orange',
          flex: '0 1 auto',
          'box-sizing': 'content-box',
          margin: '10px 0 0',
          display: 'inline-block',
          'align-self': 'center'
        }
      }
    ]
}
window.onload = () => {
  const h = (l: DrawLayout): string => {
    const _children = l.children ? l.children.map(e => h(e)).join('') : ''
    const tag = l.type === 'view' ? 'div' : 'img'
    return `<${tag} style="${Object.entries(l.styles)
      .map(e => `${e[0]}:${e[1]}`)
      .join(';')}">${_children}</${tag}>`
  }
  const demoDom = document.getElementById('demo_dom')
  const demoCanvas = document.getElementById('demo_canvas') as HTMLCanvasElement
  demoDom!.innerHTML = h(layout)
  initWindow({
    dpr: window.devicePixelRatio,
    createCanvas: (isOffScreen: boolean, width?, height?) => {
      if (isOffScreen && OffscreenCanvas) {
        return new OffscreenCanvas(width as number, height as number) as SampleCanvasType<false>
      } else {
        return document.createElement('canvas') as unknown as SampleCanvasType<true>
      }
    },
    createImage: () => new Image() as SampleImageType
  })
  draw(layout).then(res => {
    const { canvas, width, height } = res! || {}
    console.log(137, canvas, width, height)
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