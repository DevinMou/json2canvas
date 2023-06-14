/// <reference path="../types/sample_canvas.d.ts" />
/// <reference path="../types/supported_css_props.d.ts" />
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { drawItem } from './lib/draw'
import { getLayoutPosition, getMarginOrPaddingValue } from './lib/position'
import { LayoutRect, LayoutStyle, Rect } from './lib/rect'
import { ReactCompute } from './util/react_compute'
import { PickRequried } from './util/type'

declare global {
  interface Array<T> {
    includes(searchElement: T | any, fromIndex?: number): boolean
  }
  interface ReadonlyArray<T> {
    includes(searchElement: T | any, fromIndex?: number): boolean
  }
}

export type SampleCanvasType<T extends boolean = false> = SampleCanvas.Canvas<T>
export type SampleImageType = SampleImage
const drawTexts = (layout: ComputedLayout, ctx: SampleCanvas.RenderContext, parentTop: number, parentLeft: number) => {
  if (layout.content) {
    let fontWeight: 'normal' | 'bold' = 'normal'
    if (layout.styles['font-weight']) {
      if (typeof layout.styles['font-weight'] === 'string') {
        if (layout.styles['font-weight'] === 'bold') {
          fontWeight = 'bold'
        }
      } else {
        if (layout.styles['font-weight'] > 500) {
          fontWeight = 'bold'
        }
      }
    }
    ctx.font = `${layout.styles['font-style'] || ''} ${fontWeight} ${layout.styles['font-size']}px/${layout.styles['line-height']
      }px PingFangSC-Medium, "PingFang SC", sans-serif`.trim()
    ctx.fillStyle = layout.styles.color!
    const offsetX = {
      left: 0,
      center: (layout.rect.boxWidth || 0) / 2,
      right: layout.rect.boxWidth || 0
    }
    ctx.textAlign = layout.styles['text-align'] || 'left'
    ctx.textBaseline = 'middle'
    const offsetY = -layout.styles['line-height']! / 2
    if (layout.rect.textLines) {
      let lines = [...layout.rect.textLines]
      if (layout.styles['line-clamp']) {
        const clamp = layout.styles['line-clamp']
        if (lines.length > clamp) {
          lines[clamp - 1] = lines[clamp - 1].replace(/.{1}$/, '...')
          lines = lines.slice(0, clamp)
        }
      }
      lines.forEach((e, i) => {
        ctx.fillText(
          e,
          parentLeft +
          getMarginOrPaddingValue(layout.rect, 'padding-left') +
          offsetX[layout.styles['text-align'] || 'left'] || 0,
          parentTop +
          getMarginOrPaddingValue(layout.rect, 'padding-top') +
          (i + 1) * layout.styles['line-height']! +
          offsetY,
          layout.rect.boxWidth
        )
      })
    } else {
      ctx.fillText(
        layout.content,
        parentLeft +
        getMarginOrPaddingValue(layout.rect, 'padding-left') +
        offsetX[layout.styles['text-align'] || 'left'] || 0,
        parentTop + getMarginOrPaddingValue(layout.rect, 'padding-top') + layout.styles['line-height']! + offsetY,
        layout.rect.boxWidth
      )
    }
  }
}
export const windowInfo: Record<string, unknown> & {
  dpr: number
  unit: {
    [k: string]: number
  }
  createCanvas?: {
    (isOffScreen: false): Promise<SampleCanvas.Canvas<true>>
    (isOffScreen: true, width?: number, height?: number): Promise<SampleCanvas.Canvas<false>>
  }
  clearCanvas?: () => void
  createImage?: (src: string,canvas?: SampleCanvas.Canvas) => Promise<SampleImage>
  drawTexts: (layout: ComputedLayout, ctx: SampleCanvas.RenderContext, parentTop: number, parentLeft: number) => void
} = {
  dpr: 1,
  unit: {
    px: 1,
    rpx: 1,
    deg: Math.PI / 180
  },
  drawTexts
}
export const initWindow = (_windowInfo: Partial<typeof windowInfo>) => {
  for (const k in _windowInfo) {
    windowInfo[k] = _windowInfo[k]
  }
}

export interface DrawLayout {
  type: 'view' | 'img'
  styles: Partial<DrawStyles>
  children?: DrawLayout[]
  content?: string
  rect?: LayoutRect
}

export const setWidthOrHeightByStyle = (rect: LayoutRect, length: number, isBorderBox: boolean, isHeight = false) => {
  const dir = getDir(isHeight)
  const padding = getMarginOrPaddingValue(rect, isHeight ? 'padding-height' : 'padding-width')
  if (isBorderBox) {
    rect[dir.box] = length
    rect[dir.content] = rect[dir.box]! - padding - rect[dir.border]
  } else {
    rect[dir.content] = length
    rect[dir.box] = rect[dir.content]! + padding + rect[dir.border]
  }
}

export interface ComputedLayout extends PickRequried<DrawLayout, 'rect'> {
  styles: LayoutStyle
  children?: ComputedLayout[]
}

export const getDir = (isColumn = false, isRe?: boolean) => {
  const isHeight = isRe ? !isColumn : isColumn
  return {
    default: isHeight ? 'height' : 'width',
    box: isHeight ? 'boxHeight' : 'boxWidth',
    margin: isHeight ? 'marginHeight' : 'marginWidth',
    content: isHeight ? 'contentHeight' : 'contentWidth',
    border: isHeight ? 'borderHeight' : 'borderWidth',
    padding: isHeight ? 'paddingHeight' : 'paddingWidth'
  } as const
}

export const draw = async (layout: DrawLayout) => {
  try {
    const reactCompute = new ReactCompute()
    const parsedRect = new Rect(reactCompute)
    reactCompute.resetWatchWaiting()
    const computedLayout = parsedRect.parseLayout(layout)
    await reactCompute.getWatchWaiting()
    await new Promise(r => setTimeout(r, 0))
    const layoutRect = getLayoutPosition(computedLayout)
    const rootWidth = getMarginOrPaddingValue(layoutRect.rect, 'padding-width') + (layoutRect.rect.boxWidth || 0)
    const rootHeight = getMarginOrPaddingValue(layoutRect.rect, 'padding-height') + layoutRect.rect.boxHeight!
    const canvas = await windowInfo.createCanvas!(true, rootWidth, rootHeight)
    const ctx = canvas.getContext('2d')
    await drawItem(canvas, ctx, layoutRect)
    if (windowInfo.clearCanvas) {
      windowInfo.clearCanvas()
    }
    return { canvas, width: rootWidth, height: rootHeight, layout: layoutRect }
  } catch (err) {
    console.log(1958, err)
  }}

/*
eg: index.ts (in browser)
*/
/*
import { draw, initWindow, DrawLayout, SampleCanvasType, SampleImageType } from './node2canvas'
const testLayout: DrawLayout = {
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

draw(testLayout).then(({ canvas, width, height }) => {
  document.body.appendChild(canvas)
})

*/
