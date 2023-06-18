import { ComputedLayout, windowInfo } from '..'
import {
  AstFn,
  computeAstFnParam,
  getBorderRadiusByAst,
  getColorByAstItem,
  getLengthValue,
  LengthParseObj,
  parseLengthStr
} from '../util/common'
import { MT } from '../util/sample_matrix'
import { SpecifiedLengthTuple, UniqueStringCombinations } from '../util/type'
import { parseBackgroundShorthand } from './background'
import { getMarginOrPaddingValue } from './position'
import { BoxDir, LayoutRect } from './rect'

type TransformType =
  | {
      type: 'translate' | 'scale' | 'skew'
      value: {
        x: number
        y: number
      }
    }
  | {
      type: 'rotate'
      value: number
    }

const val2XY = (valArr: AstFn['params'], parentValWidth: number, parentValHeight: number) => {
  const res = {
    x: 0,
    y: 0
  }
  valArr.forEach((item, index) => {
    if (!index) {
      res.x = computeAstFnParam(item, parentValWidth)
    }
    if (valArr.length === 1 || index) {
      res.y = computeAstFnParam(item, parentValHeight)
    }
  })
  return res
}

function createMatrix(transforms: TransformType[]) {
  let matrix = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ]
  transforms.forEach(function (transform) {
    switch (transform.type) {
      case 'translate':
        matrix = MT(matrix, [
          [1, 0, transform.value.x],
          [0, 1, transform.value.y],
          [0, 0, 1]
        ])!
        break
      case 'rotate':
        {
          const angle = transform.value
          const cos = Math.cos(angle)
          const sin = Math.sin(angle)
          matrix = MT(matrix, [
            [cos, -sin, 0],
            [sin, cos, 0],
            [0, 0, 1]
          ])!
        }
        break
      case 'scale':
        matrix = MT(matrix, [
          [transform.value.x, 0, 0],
          [0, transform.value.y, 0],
          [0, 0, 1]
        ])!
        break
      case 'skew': {
        const xtan = Math.tan(transform.value.x)
        const ytan = Math.tan(transform.value.y)
        matrix = MT(matrix, [
          [1, xtan, 0],
          [ytan, 1, 0],
          [0, 0, 1]
        ])!
      }
    }
  })
  return [matrix[0][0], matrix[1][0], matrix[0][1], matrix[1][1], matrix[0][2], matrix[1][2]] as SpecifiedLengthTuple<
    number,
    6
  >
}

const drawImage = async ({
  canvas,
  ctx,
  canvasWidth,
  canvasHeight,
  imgSrc,
  size,
  postion,
  repeat
}: {
  canvas: SampleCanvas.Canvas
  ctx: any
  canvasWidth: number
  canvasHeight: number
  imgSrc: string
  postion?: 'top' | 'left' | 'bottom' | 'right' | 'center'
  size?: 'cover' | 'contain'
  repeat?: {
    top?: number
    left?: number
    bottom?: number
    right?: number
  }
}) => {
  const image = await windowInfo.createImage!(imgSrc, canvas)
  const { width, height } = image
  const chw = width / height
  let dWidth = 0
  let dHeight = 0
  if (postion === 'top') {
    dWidth = canvasWidth
    dHeight = canvasWidth / chw
    await ctx.drawImage(image, 0, 0, dWidth, dHeight)
  } else if (postion === 'bottom') {
    dWidth = canvasWidth
    dHeight = canvasWidth / chw
    await ctx.drawImage(image, 0, canvasHeight - canvasWidth / chw, dWidth, dHeight)
  } else if (postion === 'left') {
    dWidth = canvasHeight * chw
    dHeight = canvasHeight
    await ctx.drawImage(image, 0, 0, dWidth, dHeight)
  } else if (postion === 'right') {
    dWidth = canvasHeight * chw
    dHeight = canvasHeight
    await ctx.drawImage(image, canvasWidth - canvasHeight * chw, 0, dWidth, dHeight)
  } else if (postion === 'center') {
    let l, t, w, h, sx, sy, sw, sh
    const canvasWh = canvasWidth / canvasHeight
    if (size === 'contain') {
      if (canvasWh < chw) {
        l = 0
        t = (canvasHeight - canvasWidth / chw) / 2
        w = canvasWidth
        h = w / chw
      } else {
        l = (canvasWidth - canvasHeight * chw) / 2
        t = 0
        h = canvasHeight
        w = h * chw
      }
      await ctx.drawImage(image, l, t, w, h)
    } else if (size === 'cover') {
      if (canvasWh < chw) {
        sw = height * canvasWh
        sh = height
        sx = (width - sw) / 2
        sy = 0
        l = 0
        t = 0
        w = canvasWidth
        h = canvasHeight
      } else {
        sw = width
        sh = width / canvasWh
        sx = 0
        sy = (height - sh) / 2
        l = 0
        t = 0
        h = canvasHeight
        w = canvasWidth
      }
      await ctx.drawImage(image, sx, sy, sw, sh, l, t, w, h)
    }
  } else if (repeat) {
    if (repeat.top !== undefined && repeat.bottom !== undefined) {
      dWidth = canvasWidth
      dHeight = canvasHeight - repeat.top - repeat.bottom
      let len = dHeight
      const top = repeat.top
      while (len > 0) {
        await ctx.drawImage(image, 0, top + (dHeight - len), canvasWidth, len > width / chw ? width / chw : len)
        len -= width / chw
      }
    } else if (repeat.left !== undefined && repeat.right !== undefined) {
      dHeight = canvasHeight
      dWidth = canvasWidth - repeat.left - repeat.right
      let len = dWidth
      const left = repeat.left
      while (len > 0) {
        await ctx.drawImage(image, left + (dWidth - len), 0, len > height * chw ? height * chw : len, canvasHeight)
        len -= height * chw
      }
    }
  }
  return { width: dWidth, height: dHeight }
}
interface BoxShadowProps {
  blur: number
  x: number
  y: number
  color: string
  inset: boolean
  spread: number
}

const drawRadiusAndShadow = async ({
  ctx,
  x,
  y,
  width,
  height,
  radius,
  shadow,
  border
}: {
  ctx: SampleCanvas.RenderContext
  x: number
  y: number
  width: number
  height: number
  radius: Record<'x' | 'y', number>[]
  shadow: BoxShadowProps
  border: LayoutRect['border']
}) => {
  const bw = Math.max(shadow.blur * 5, 30)
  let computeSpread = 0
  if (shadow.inset) {
    if (shadow.spread) {
      if (shadow.spread > 0) {
        computeSpread = -Math.min(Math.min(width, height) / 2, shadow.spread)
      } else {
        computeSpread = -shadow.spread
      }
    }
  } else {
    if (shadow.spread) {
      if (shadow.spread < 0) {
        computeSpread = -Math.min(Math.min(width, height) / 2, -shadow.spread)
      } else {
        computeSpread = shadow.spread
      }
    }
  }
  const localRect = {
    width: shadow.inset ? width : width + computeSpread * 2 + shadow.blur * 2,
    height: shadow.inset ? height : height + computeSpread * 2 + shadow.blur * 2
  }
  const localCanvas = await windowInfo.createCanvas!(true, localRect.width, localRect.height)
  /* document.body.appendChild(localCanvas as HTMLCanvasElement)
  ;(localCanvas as HTMLCanvasElement).style.cssText = 'background:#ddd;position: fixed;right: 50px;top: 50px' */
  const localCtx = localCanvas.getContext('2d')
  if (shadow.inset) {
    localCtx.beginPath()
    drawBorder({
      ctx: localCtx,
      radius,
      border,
      px: 0,
      py: 0,
      bw: width,
      bh: height,
      mode: 'in-stroke'
    })
    localCtx.closePath()
    localCtx.clip()
    localCtx.fillStyle = shadow.color
    localCtx.fillRect(0, 0, width, height)
    localCtx.globalCompositeOperation = 'destination-out'
    localCtx.shadowBlur = 0
    localCtx.beginPath()
    drawBorder({
      ctx: localCtx,
      radius,
      border,
      px: shadow.x,
      py: shadow.y,
      bw: width,
      bh: height,
      spread: shadow.spread - shadow.blur,
      mode: 'in-stroke'
    }) // 扣掉阴影区域（含blur边界）
    localCtx.closePath()
    localCtx.save()
    localCtx.fill()
    localCtx.restore()
    localCtx.globalCompositeOperation = 'source-over'
    localCtx.clip()

    localCtx.beginPath()
    const sw = width + computeSpread * 2 - border.left.width - border.right.width
    const sh = height + computeSpread * 2 - border.top.width - border.bottom.width
    const sx = -sw - bw + computeSpread
    const sy = shadow.y
    localCtx.shadowBlur = shadow.blur * windowInfo.dpr
    localCtx.shadowOffsetX = (-sx + shadow.x) * windowInfo.dpr
    localCtx.shadowOffsetY = 0
    localCtx.shadowColor = shadow.color
    const radius0 = Math.max(radius[0].y - shadow.spread, 0)
    const fx = sx + border.left.width - computeSpread
    const fy = sy + border.top.width - computeSpread
    localCtx.moveTo(fx - bw, fy + radius0)
    drawBorder({
      ctx: localCtx,
      radius,
      border,
      px: sx,
      py: sy,
      bw: width,
      bh: height,
      spread: shadow.spread,
      mode: 'in-stroke'
    })
    localCtx.lineTo(fx - bw, fy + radius0)
    localCtx.lineTo(fx - bw, fy + sh + bw)
    localCtx.lineTo(fx + sw + bw, fy + sh + bw)
    localCtx.lineTo(fx + sw + bw, fy - bw)
    localCtx.lineTo(fx - bw, fy - bw)
    localCtx.closePath()
    localCtx.fillStyle = shadow.color
    localCtx.fill()
    await ctx.drawImage(localCanvas, x, y, localRect.width, localRect.height)
  } else {
    localCtx.fillStyle = shadow.color
    localCtx.shadowBlur = shadow.blur * windowInfo.dpr
    localCtx.shadowOffsetX = (width + computeSpread * 2 + shadow.blur) * windowInfo.dpr
    localCtx.shadowOffsetY = 0
    localCtx.shadowColor = shadow.color
    localCtx.beginPath()
    drawBorder({
      ctx: localCtx,
      radius,
      border,
      px: -width - computeSpread,
      py: shadow.blur + computeSpread,
      bw: width,
      bh: height,
      spread: shadow.spread,
      mode: 'out-stroke'
    })
    localCtx.closePath()
    localCtx.fill()
    localCtx.globalCompositeOperation = 'destination-out'
    localCtx.shadowBlur = 0
    localCtx.shadowOffsetX = 0
    localCtx.shadowOffsetY = 0
    localCtx.beginPath()
    drawBorder({
      ctx: localCtx,
      radius,
      border,
      px: shadow.blur + computeSpread - shadow.x,
      py: shadow.blur + computeSpread - shadow.y,
      bw: width,
      bh: height,
      mode: 'out-stroke'
    })
    localCtx.closePath()
    localCtx.fill()
    localCtx.globalCompositeOperation = 'source-over'
    await ctx.drawImage(
      localCanvas,
      x + shadow.x - shadow.blur - computeSpread,
      y + shadow.y - shadow.blur - computeSpread,
      localRect.width,
      localRect.height
    )
  }

  // localCtx.fillRect(-bw,radius[0],bw,height - radius[0] - radius[3])
  // ctx.drawImage(localCanvas, x, y)
}

export const drawItem = async (
  canvas: SampleCanvas.Canvas,
  ctx: SampleCanvas.RenderContext,
  layout: ComputedLayout,
  parentLeft = 0,
  parentTop = 0
) => {
  parentLeft += layout.rect.left || 0
  parentTop += layout.rect.top || 0
  const tempParentLeft = parentLeft
  const tempParentTop = parentTop
  const parentCtx = ctx
  if (layout.rect.styleSplits.transform) {
    canvas = await windowInfo.createCanvas!(true, layout.rect.boxWidth, layout.rect.boxHeight)
    ctx = canvas.getContext('2d')
    parentLeft = 0
    parentTop = 0
  }
  // const borderRadius = getBorderRadius(layout.styles['border-radius'])
  const borderRadius = getBorderRadiusByAst(layout.rect)
  if (layout.type === 'view') {
    if (layout.styles.background) {
      const bgWidth = layout.rect.boxWidth || 0
      const bgHeight = layout.rect.boxHeight || 0

      const bgCanvas = await windowInfo.createCanvas!(true, layout.rect.boxWidth!, layout.rect.boxHeight)
      const bgCtx = bgCanvas!.getContext('2d')
      /* document.body.appendChild(bgCanvas as HTMLCanvasElement)
      ;(bgCanvas as HTMLCanvasElement).style.cssText = 'background:#ddd;position: fixed;right: 10px;top: 10px' */
      /* if (layout.styles['border-radius']) {
        bgCtx.beginPath()
        drawBorder({
          ctx: bgCtx,
          radius: borderRadius,
          border: layout.rect.border,
          px: 0,
          py: 0,
          bw: bgWidth,
          bh: bgHeight,
          mode: 'out-stroke'
        })
        bgCtx.closePath()
        bgCtx.clip()
      } */
      await parseBackgroundShorthand(bgCanvas, layout.styles.background, layout.rect, borderRadius)
      if (bgCanvas && bgCanvas.width && bgCanvas.height) {
        if (Object.values(layout.rect.border).find(e => e.width)) {
          // ???
          drawBorder({
            ctx: bgCtx,
            radius: borderRadius,
            border: layout.rect.border,
            px: 0,
            py: 0,
            bw: bgWidth,
            bh: bgHeight,
            mode: 'fill'
          })
        }
        await ctx.drawImage(bgCanvas, parentLeft, parentTop, bgWidth, bgHeight)
      }
    }
  } else if (layout.type === 'img' && layout.content) {
    const bgWidth =
      (layout.rect.boxWidth || 0) +
      getMarginOrPaddingValue(layout.rect, 'padding-right') +
      getMarginOrPaddingValue(layout.rect, 'padding-left')
    const bgHeight =
      layout.rect.boxHeight! +
      getMarginOrPaddingValue(layout.rect, 'padding-bottom') +
      getMarginOrPaddingValue(layout.rect, 'padding-top')
    const bgCanvas = await windowInfo.createCanvas!(true, bgWidth * windowInfo.dpr, bgHeight * windowInfo.dpr)
    const bgCtx = bgCanvas.getContext('2d')
    bgCtx.scale(windowInfo.dpr, windowInfo.dpr)

    if (layout.styles['border-radius']) {
      bgCtx.beginPath()
      drawBorder({
        ctx: bgCtx,
        radius: borderRadius,
        border: layout.rect.border,
        px: 0,
        py: 0,
        bw: bgWidth,
        bh: bgHeight,
        mode: 'out-stroke'
      })
      bgCtx.closePath()
      bgCtx.clip()
    }

    const imgUrl = layout.content
    if (layout.styles['object-fit'] === undefined) {
      const image = await windowInfo.createImage!(layout.content!, canvas)
      const { width, height } = image
      await bgCtx.drawImage(
        image,
        0,
        0,
        layout.rect.boxWidth!,
        layout.rect.boxHeight || (layout.rect.boxWidth! * height) / width
      )
    } else {
      const size = layout.styles['object-fit'] === 'contain' ? 'contain' : 'cover'
      await drawImage({
        canvas: bgCanvas,
        ctx: bgCtx,
        canvasWidth: bgWidth,
        canvasHeight: bgHeight,
        imgSrc: imgUrl,
        postion: 'center',
        size
      })
    }
    await ctx.drawImage(bgCanvas, parentLeft, parentTop, bgWidth, bgHeight)
  }

  if (layout.styles['box-shadow']) {
    const defaultColor = getColorByAstItem(windowInfo.checkInherit(layout.rect, 'color')![0]) || 'rgba(0, 0, 0, 1)'
    let currentItem: BoxShadowProps = {
      x: 0,
      y: 0,
      blur: 0,
      color: defaultColor,
      spread: 0,
      inset: false
    }
    const shadows: BoxShadowProps[] = [currentItem]
    const lengthVals: (number | null)[] = []
    let shadowValid = true
    const len = layout.rect.styleSplits['box-shadow']!.length
    for (let index = 0; index < len; index++) {
      const astItem = layout.rect.styleSplits['box-shadow']![index]
      let itemIsLength = false
      if (astItem === 'inset') {
        currentItem.inset = true
      } else if (astItem instanceof LengthParseObj) {
        if (astItem.unit === '%') {
          shadowValid = false
          break
        }
        const lenVal = getLengthValue(astItem)
        lengthVals.push(lenVal)
        itemIsLength = true
      } else {
        const color = getColorByAstItem(astItem)
        if (color) {
          currentItem.color = color
        }
      }
      if (!itemIsLength) {
        lengthVals.push(null)
      }
      if (astItem === ',' || index === len - 1) {
        const numStartIndex = lengthVals.findIndex(e => e !== null)
        const numEndIndex = lengthVals.findIndex((_, i, a) => a[a.length - i - 1] !== null)
        const _lengthVals = lengthVals.slice(numStartIndex, numEndIndex ? -numEndIndex : lengthVals.length)
        const numArr = _lengthVals.filter(e => e !== null) as number[]
        if (numArr.length !== _lengthVals.length || numArr.length < 2) {
          shadowValid = false
          break
        } else {
          currentItem.x = numArr[0]
          currentItem.y = numArr[1]
          if (numArr.length === 3) {
            currentItem.blur = numArr[2]
          } else if (numArr.length === 4) {
            currentItem.blur = numArr[2]
            currentItem.spread = numArr[3]
          }
          lengthVals.length = 0
        }
        if (astItem === ',') {
          currentItem = {
            x: 0,
            y: 0,
            blur: 0,
            color: defaultColor,
            spread: 0,
            inset: false
          }
          shadows.push(currentItem)
        }
      }
    }
    if (shadowValid) {
      for (let shadowItem of shadows) {
        await drawRadiusAndShadow({
          ctx,
          x: parentLeft,
          y: parentTop,
          width: layout.rect.boxWidth!,
          height: layout.rect.boxHeight!,
          radius: borderRadius,
          shadow: shadowItem,
          border: layout.rect.border
        })
      }
    }
  }

  if (layout.type === 'view' && (!layout.children || !layout.children.length) && layout.content) {
    await windowInfo.drawTexts!(layout, ctx, parentTop, parentLeft)
  }

  if (layout.children && layout.children.length) {
    /* const contentWidth =
      (layout.rect.boxWidth || 0) +
      getMarginOrPaddingValue(layout.rect, 'padding-right') +
      getMarginOrPaddingValue(layout.rect, 'padding-left')
    const contentHeight =
      layout.rect.boxHeight! +
      getMarginOrPaddingValue(layout.rect, 'padding-top') +
      getMarginOrPaddingValue(layout.rect, 'padding-bottom') */
    const normalChildren: ComputedLayout[] = []
    const transformChildren: ComputedLayout[] = []
    const zIndexChildren: ComputedLayout[] = []
    layout.children.forEach(item => {
      if (item.styles.position === undefined) {
        if (item.rect.styleSplits.transform) {
          transformChildren.push(item)
        } else {
          normalChildren.push(item)
        }
      } else {
        zIndexChildren.push(item)
      }
    })
    const sortChildren: ComputedLayout[] = [
      ...normalChildren,
      ...transformChildren,
      ...zIndexChildren.sort((a, b) => (a.styles['z-index'] || 0) - (b.styles['z-index'] || 0))
    ]
    for (const item of sortChildren) {
      /* if (item.styles.position === 'absolute') {
        item.rect.left =
          item.rect.left === undefined
            ? contentWidth -
              item.rect.right! -
              item.rect.boxWidth! -
              getMarginOrPaddingValue(item.rect, 'padding-right') -
              getMarginOrPaddingValue(item.rect, 'padding-left')
            : item.rect.left
        item.rect.top =
          item.rect.top === undefined
            ? contentHeight -
              item.rect.bottom! -
              item.rect.boxHeight! -
              getMarginOrPaddingValue(item.rect, 'padding-top') -
              getMarginOrPaddingValue(item.rect, 'padding-bottom')
            : item.rect.top
      } */
      await drawItem(canvas, ctx, item, parentLeft, parentTop)
    }
  }
  if (layout.rect.styleSplits.transform) {
    const originX = layout.rect.transformOrigin.xPercent
      ? (layout.rect.boxWidth! * layout.rect.transformOrigin.x) / 100
      : layout.rect.transformOrigin.x
    const originY = layout.rect.transformOrigin.yPercent
      ? (layout.rect.boxHeight! * layout.rect.transformOrigin.y) / 100
      : layout.rect.transformOrigin.y
    const transform = layout.rect.styleSplits.transform
      .map(item => {
        if (item instanceof AstFn) {
          switch (item.type) {
            case 'translate': {
              const value = val2XY(
                item.params.filter(e => e !== ','),
                layout.rect.boxWidth!,
                layout.rect.boxHeight!
              )
              return {
                type: item.type,
                value: {
                  x: value.x / windowInfo.dpr,
                  y: value.y / windowInfo.dpr
                }
              }
            }
            case 'scale': {
              const params = item.params
                .filter(e => e !== ',')
                .map(e => {
                  return computeAstFnParam(e, 0, 1)
                })
              return {
                type: item.type,
                value: {
                  x: +params[0],
                  y: +(params.length > 1 ? params[1] : params[0])
                }
              }
            }
            case 'rotate':
              return {
                type: item.type,
                value: computeAstFnParam(item.params[0])
              }
            case 'skew': {
              const params = item.params
                .filter(e => e !== ',')
                .map(e => {
                  return computeAstFnParam(e)
                })
              return {
                type: item.type,
                value: {
                  x: parseLengthStr(params[0]).value,
                  y: params.length > 1 ? params[1] : 0
                }
              }
            }
            default:
              return null
          }
        }
      })
      .filter(item => item) as TransformType[]
    const matrix = createMatrix([
      {
        type: 'translate',
        value: { x: tempParentLeft + originX, y: tempParentTop + originY }
      },
      {
        type: 'scale',
        value: {
          x: windowInfo.dpr,
          y: windowInfo.dpr
        }
      },
      ...transform
    ])
    parentCtx.save()
    parentCtx.transform(...matrix)
    await parentCtx.drawImage(
      canvas,
      -originX / windowInfo.dpr,
      -originY / windowInfo.dpr,
      layout.rect.boxWidth! / windowInfo.dpr,
      layout.rect.boxHeight! / windowInfo.dpr
    )
    parentCtx.setTransform(windowInfo.dpr, 0, 0, windowInfo.dpr, 0, 0)
    parentCtx.restore()
  }
}

const getSplitAngle = (
  rx: number,
  ry: number,
  wx: number,
  wy: number,
  px: number,
  py: number,
  fy: 1 | -1 = 1,
  fx: 1 | -1 = 1
): number | null => {
  const isZero = (val: number) => Math.abs(val) < 1e-5
  const res: [number, number][] = []
  const A = wy * wy * rx * rx + wx * wx * ry * ry
  const B = -2 * (wy * px - wx * py) * wy * rx * rx
  let C = Math.pow(wy * px - wx * py, 2) * rx * rx - wx * wx * rx * rx * ry * ry
  if (isZero(C)) {
    C = 0
  }
  const isInFirstQuadrant = (x: number, y: number): boolean => {
    return x >= 0 && y >= 0
  }

  const getY = (x: number) => {
    if (wx) {
      return (wy * (x - rx - wx)) / wx + ry + wy
    } else {
      return Math.sqrt((1 - Math.pow(x / rx, 2)) * ry * ry)
    }
  }

  // 求解二元二次方程
  const delta = B * B - 4 * A * C
  if (isZero(delta)) {
    const x = -B / (2 * A)
    const y = getY(x)
    if (isInFirstQuadrant(x, y)) {
      res[0] = [y, x]
    } else {
      return null
    }
  } else if (delta < 0) {
    return null // 无实数解
  } else {
    const x1 = (-B + Math.sqrt(delta)) / (2 * A)
    const x2 = (-B - Math.sqrt(delta)) / (2 * A)
    const y1 = getY(x1)
    const y2 = getY(x2)
    if (isInFirstQuadrant(x1, y1)) {
      res.push([y1, x1])
    }
    if (isInFirstQuadrant(x2, y2)) {
      res.push([y2, x2])
    }
  }
  return res.length ? res.map(e => Math.atan2(e[0] * fy, e[1] * fx))[0] : null
}

type BorderItem = {
  width: number
  color: string
}
export const drawBorder = ({
  ctx,
  radius,
  border,
  px = 0,
  py = 0,
  bw = 0,
  bh = 0,
  mode = 'fill',
  spread = 0
}: {
  ctx: SampleCanvas.RenderContext
  px: number
  py: number
  bw: number
  bh: number
  spread?: number
  radius: Record<'x' | 'y', number>[]
  border: Record<BoxDir, BorderItem>
  mode: 'fill' | 'in-stroke' | 'out-stroke'
}) => {
  if (!ctx) {
    return
  }
  const borderDirRelation: Record<BoxDir, { prev: BoxDir; next: BoxDir }> = {
    top: {
      prev: 'left',
      next: 'right'
    },
    right: {
      prev: 'top',
      next: 'bottom'
    },
    bottom: {
      prev: 'right',
      next: 'left'
    },
    left: {
      prev: 'bottom',
      next: 'top'
    }
  }
  type OptionItem = {
    arc: {
      x: number
      y: number
      angles: number[]
      outRadius: {
        x: number
        y: number
        angle: number | null
      }
      inRadius: {
        x: number
        y: number
        angle: number | null
      }
      outPoint: Record<'x' | 'y', number>
      inPoint: Record<'x' | 'y', number>
    }
  }
  const options: Partial<Record<`${BoxDir}-${BoxDir}`, OptionItem>> = {}
  const dirArr = [
    ['left', -1, -1],
    ['top', -1, 1],
    ['right', 1, 1],
    ['bottom', 1, -1]
  ] as const
  let _spread = 0
  if (mode === 'in-stroke') {
    if (spread > 0) {
      _spread = -Math.min(
        (bw - border.left.width - border.right.width) / 2,
        (bh - border.top.width - border.bottom.width) / 2,
        spread
      )
    } else {
      _spread = -spread
    }
  } else if (mode === 'out-stroke') {
    if (spread > 0) {
      _spread = spread
    } else {
      _spread = -Math.min(bw / 2, bh / 2, -spread)
    }
  }
  dirArr.forEach((item, i) => {
    const nk = i === 3 ? 'left' : dirArr[i + 1][0]
    const [k, coey, coex] = item
    const xWidth = i % 2 ? border[nk].width : border[k].width
    const yWidth = i % 2 ? border[k].width : border[nk].width
    const arc: OptionItem['arc'] = {
      x: px + (coex > 0 ? bw - radius[i].x : radius[i].x),
      y: py + (coey > 0 ? bh - radius[i].y : radius[i].y),
      angles: [-Math.PI + (Math.PI / 2) * i, -Math.PI / 2 + (Math.PI / 2) * i],
      outRadius: {
        x: radius[i].x + _spread,
        y: radius[i].y + _spread,
        angle: null
      },
      inRadius: {
        x: radius[i].x - xWidth + _spread,
        y: radius[i].y - yWidth + _spread,
        angle: null
      },
      outPoint: {
        x: px + (coex > 0 ? bw : 0) + coex * _spread,
        y: py + (coey > 0 ? bh : 0) + coey * _spread
      },
      inPoint: {
        x: px + (coex > 0 ? bw - xWidth : xWidth) + coex * _spread,
        y: py + (coey > 0 ? bh - yWidth : yWidth) + coey * _spread
      }
    }
    if (arc.outRadius.x > 0 && arc.outRadius.y > 0) {
      arc.outRadius.angle = getSplitAngle(
        arc.outRadius.x,
        arc.outRadius.y,
        xWidth,
        yWidth,
        radius[i].x,
        radius[i].y,
        coey,
        coex
      )
    }
    if (arc.inRadius.x > 0 && arc.inRadius.y > 0) {
      arc.inRadius.angle = getSplitAngle(
        arc.inRadius.x,
        arc.inRadius.y,
        xWidth,
        yWidth,
        radius[i].x,
        radius[i].y,
        coey,
        coex
      )
    }
    options[`${k}-${nk}`] = { arc }
  })
  const borderIndexs = ['top', 'right', 'bottom', 'left'] as const
  for (const k of borderIndexs) {
    const borderItem = border[k]
    const dirRelation = borderDirRelation[k]
    const prevOption = options[`${dirRelation.prev}-${k}`]!
    const nextOption = options[`${k}-${dirRelation.next}`]!
    switch (mode) {
      case 'fill':
        ctx.beginPath()
        if (
          prevOption.arc.outRadius.x > 0 &&
          prevOption.arc.outRadius.y > 0 &&
          prevOption.arc.outRadius.angle !== null
        ) {
          ctx.ellipse(
            prevOption.arc.x,
            prevOption.arc.y,
            prevOption.arc.outRadius.x,
            prevOption.arc.outRadius.y,
            0,
            prevOption.arc.outRadius.angle,
            prevOption.arc.angles[1]
          )
        } else {
          ctx.lineTo(prevOption.arc.outPoint.x, prevOption.arc.outPoint.y)
        }
        if (
          nextOption.arc.outRadius.x > 0 &&
          nextOption.arc.outRadius.y > 0 &&
          nextOption.arc.outRadius.angle !== null
        ) {
          ctx.ellipse(
            nextOption.arc.x,
            nextOption.arc.y,
            nextOption.arc.outRadius.x,
            nextOption.arc.outRadius.y,
            0,
            nextOption.arc.angles[0],
            nextOption.arc.outRadius.angle
          )
        } else {
          ctx.lineTo(nextOption.arc.outPoint.x, nextOption.arc.outPoint.y)
        }
        if (nextOption.arc.inRadius.x > 0 && nextOption.arc.inRadius.y > 0 && nextOption.arc.inRadius.angle !== null) {
          ctx.ellipse(
            nextOption.arc.x,
            nextOption.arc.y,
            nextOption.arc.inRadius.x,
            nextOption.arc.inRadius.y,
            0,
            nextOption.arc.inRadius.angle,
            nextOption.arc.angles[0],
            true
          )
        } else {
          ctx.lineTo(nextOption.arc.inPoint.x, nextOption.arc.inPoint.y)
        }
        if (prevOption.arc.inRadius.x > 0 && prevOption.arc.inRadius.y > 0 && prevOption.arc.inRadius.angle !== null) {
          ctx.ellipse(
            prevOption.arc.x,
            prevOption.arc.y,
            prevOption.arc.inRadius.x,
            prevOption.arc.inRadius.y,
            0,
            prevOption.arc.angles[1],
            prevOption.arc.inRadius.angle,
            true
          )
        } else {
          ctx.lineTo(prevOption.arc.inPoint.x, prevOption.arc.inPoint.y)
        }
        ctx.closePath()
        ctx.fillStyle = borderItem.color
        ctx.fill()
        break
      case 'in-stroke':
        if (prevOption.arc.inRadius.x > 0 && prevOption.arc.inRadius.y > 0) {
          ctx.ellipse(
            prevOption.arc.x,
            prevOption.arc.y,
            prevOption.arc.inRadius.x,
            prevOption.arc.inRadius.y,
            0,
            prevOption.arc.angles[0],
            prevOption.arc.angles[1]
          )
        } else {
          ctx.lineTo(prevOption.arc.inPoint.x, prevOption.arc.inPoint.y)
        }
        if (k === 'left') {
          ctx.lineTo(nextOption.arc.inPoint.x, nextOption.arc.inPoint.y + nextOption.arc.inRadius.y)
        }
        break
      case 'out-stroke':
        if (prevOption.arc.outRadius.x > 0 && prevOption.arc.outRadius.y > 0) {
          ctx.ellipse(
            prevOption.arc.x,
            prevOption.arc.y,
            prevOption.arc.outRadius.x,
            prevOption.arc.outRadius.y,
            0,
            prevOption.arc.angles[0],
            prevOption.arc.angles[1]
          )
        } else {
          ctx.lineTo(prevOption.arc.outPoint.x, prevOption.arc.outPoint.y)
        }
        if (k === 'left') {
          ctx.lineTo(nextOption.arc.outPoint.x, nextOption.arc.outPoint.y + nextOption.arc.outRadius.y)
        }
        break
    }
  }
}
