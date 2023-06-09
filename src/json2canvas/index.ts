/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { drawItem } from './lib/draw'
import { setFlexSizeLength } from './lib/flex'
import { getLayoutPosition, getMarginOrPaddingValue } from './lib/position'
import { LayoutRect, LayoutStyle, parseLayout, getMarginOrPaddingValuePromise } from './lib/rect'
import { ReactCompute } from './util/react_compute'
import { PickRequried, NOS } from './util/type'

/*
reactive,compute
*/
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
export const windowInfo: Record<string, unknown> & {
  dpr: number
  unit: {
    [k: string]: number
  }
  createCanvas?: {
    <T extends boolean = true>(isOffScreen: false): SampleCanvas.Canvas<T>
    <T extends boolean = false>(isOffScreen: true, width?: number, height?: number): SampleCanvas.Canvas<T>
  }
  createImage?: (canvas?: SampleCanvas.Canvas) => SampleImage
} = {
  dpr: 1,
  unit: {
    px: 1,
    rpx: 1
  }
}
export const initWindow = (_windowInfo: Partial<typeof windowInfo>) => {
  for (const k in _windowInfo) {
    windowInfo[k] = _windowInfo[k]
  }
}
export interface DrawStyles {
  width: NOS
  height: NOS
  top: NOS
  left: NOS
  right: NOS
  bottom: NOS
  background: string
  position: 'relative' | 'absolute'
  'z-index': number
  display: 'block' | 'flex' | 'inline-block' | 'inline-flex'
  'flex-direction': 'column' | 'row'
  flex: string
  'flex-wrap': 'wrap' | 'nowrap'
  'align-self': 'flex-start' | 'flex-end' | 'center' | 'stretch'
  'align-items': 'flex-start' | 'flex-end' | 'center' | 'stretch'
  'justify-content': 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'
  'box-sizing': 'border-box' | 'content-box'
  'object-fit': 'contain' | 'cover'
  'border-radius': NOS
  'line-height': NOS
  'font-size': NOS
  'font-style': 'normal' | 'italic'
  'font-weight': NOS
  'text-align': 'center' | 'left' | 'right'
  'white-space': 'nowrap' | 'normal' | 'pre' | 'pre-line'
  'line-clamp': number
  'line-break': 'anywhere' | 'normal'
  overflow: 'hidden' | 'auto' | 'visible'
  color: string
  margin: NOS
  padding: NOS
  border: NOS
  'border-top': NOS
  'border-left': NOS
  'border-right': NOS
  'border-bottom': NOS
  'transform-origin': NOS
  transform: string
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

export const getFlexLayout = (...args: Parameters<typeof setFlexSizeLength>) => {
  const { flexBoxLength, children } = setFlexSizeLength(...args)
  if (children.length && children[0].layout.rect.parentRect) {
    ReactCompute.watch(
      () => children[0].layout.rect.parentRect.contentWidth,
      _ => _ !== undefined
    ).then(() => {
      children.forEach(e => setWidthOrHeightByStyle(e.layout.rect, e.sizeLength!, !!e.borderBox, args[2]))
    })
  }
  return {
    flexBoxLength,
    children
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

/* function createMatrix2(transforms: TransformType[]) {
  const matrix = [1, 0, 0, 1, 0, 0] as SpecifiedLengthTuple<number, 6>
  transforms.forEach(function (transform) {
    switch (transform.type) {
      case 'translate':
        matrix[4] += transform.value.x
        matrix[5] += transform.value.y
        break
      case 'rotate':
        {
          const angle = (transform.value.deg * Math.PI) / 180
          const cos = Math.cos(angle)
          const sin = Math.sin(angle)
          const m11 = matrix[0] * cos + matrix[2] * sin
          const m12 = matrix[1] * cos + matrix[3] * sin
          const m21 = -matrix[0] * sin + matrix[2] * cos
          const m22 = -matrix[1] * sin + matrix[3] * cos
          matrix[0] = m11
          matrix[1] = m12
          matrix[2] = m21
          matrix[3] = m22
        }
        break
      case 'scale':
        matrix[0] *= transform.value.x
        matrix[1] *= transform.value.x
        matrix[2] *= transform.value.y
        matrix[3] *= transform.value.y
        break
      case 'skew': {
        const xtan = Math.tan((transform.value.x * Math.PI) / 180)
        const ytan = Math.tan((transform.value.y * Math.PI) / 180)
        const m11 = matrix[0] + matrix[2] * ytan
        const m12 = matrix[1] + matrix[3] * ytan
        const m21 = matrix[2] + matrix[0] * xtan
        const m22 = matrix[3] + matrix[1] * xtan
        matrix[0] = m11
        matrix[1] = m12
        matrix[2] = m21
        matrix[3] = m22
      }
    }
  })
  return matrix
} */

export const draw = async (layout: DrawLayout) => {
  try {
    const computedLayout = parseLayout(layout)
    await new Promise<void>(resolve => setTimeout(resolve, 0))
    const layoutRect = getLayoutPosition(computedLayout)
    const rootWidth = getMarginOrPaddingValue(layoutRect.rect, 'padding-width') + (layoutRect.rect.boxWidth || 0)
    const rootHeight = getMarginOrPaddingValue(layoutRect.rect, 'padding-height') + layoutRect.rect.boxHeight!
    const canvas = windowInfo.createCanvas!(true, rootWidth * windowInfo.dpr, rootHeight * windowInfo.dpr)
    const ctx = canvas.getContext('2d')
    ctx.scale(windowInfo.dpr, windowInfo.dpr)
    await drawItem(canvas, ctx, layoutRect)
    return { canvas, width: rootWidth, height: rootHeight, layout: layoutRect }
  } catch (err) {
    console.log(1958, err)
  }
  /* return await new Promise<{ path: string; width: number; height: number }>(resolve => {
    wx.canvasToTempFilePath({
      canvas,
      success: res =>
        resolve({ path: res.tempFilePath, width: rootWidth * windowInfo.dpr, height: rootHeight * windowInfo.dpr })
    })
  }) */
}

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
