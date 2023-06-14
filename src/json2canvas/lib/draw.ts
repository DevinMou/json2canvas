import { ComputedLayout, windowInfo } from '..'
import { AstFn, computeAstFnParam, getBorderOption, getBorderRadius, getColorByAstItem, getLengthValue, LengthParseObj, parseLengthStr } from '../util/common'
import { MT } from '../util/sample_matrix'
import { SpecifiedLengthTuple } from '../util/type'
import { parseBackgroundShorthand } from './background'
import { getMarginOrPaddingValue } from './position'

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

const parseShadowAst = (astItems: AstFn['params']) => {
  
}

interface BoxShadowProps {
  blur: number
  x: number
  y: number
  color: string
  inset: boolean
  spread: number
}

const drawRadiusAndShadow = async ({ctx,x,y,width,height,radius,shadow}: {
  ctx: SampleCanvas.RenderContext
  x: number
  y: number
  width: number
  height: number
  radius: number[]
  shadow: BoxShadowProps
}) => {
  const bw = Math.max(shadow.blur * 5, 30)
  const options = {
    localRect: {
      width,
      height,
      x: 0,
      y: 0
    },
    shadowRect: {
      width,
      height,
      x: 0,
      y: 0
    }
  }
  if (shadow.inset) {
    if (shadow.spread) {
      if (shadow.spread > 0) {
        const _spread = Math.min(Math.min(width, height) / 2, shadow.spread)
        options.shadowRect.width -= _spread * 2
        options.shadowRect.height -= _spread * 2
        options.shadowRect.x += _spread
        options.shadowRect.y += _spread
      } else {
        const _spread = -shadow.spread
        options.shadowRect.width += _spread * 2
        options.shadowRect.height += _spread * 2
        options.shadowRect.x -= _spread
        options.shadowRect.y -= _spread
      }
    }
  } else {
    if (shadow.spread) {
      if (shadow.spread < 0) {
        const _spread = Math.min(Math.min(width, height) / 2, -shadow.spread)
        options.shadowRect.width -= _spread * 2
        options.shadowRect.height -= _spread * 2
        options.shadowRect.x += _spread
        options.shadowRect.y += _spread
      } else {
        const _spread = shadow.spread
        options.shadowRect.width += _spread * 2
        options.shadowRect.height += _spread * 2
        options.shadowRect.x -= _spread
        options.shadowRect.y -= _spread
      }
    }
    options.localRect.x = Math.min(options.shadowRect.x + shadow.x - shadow.blur, 0)
    options.localRect.y = Math.min(options.shadowRect.y + shadow.y - shadow.blur, 0)
    options.localRect.width = Math.max(options.shadowRect.x + shadow.x + options.shadowRect.width + shadow.blur, width) - options.localRect.x
    options.localRect.height = Math.max(options.shadowRect.y + shadow.y + options.shadowRect.height + shadow.blur, height) - options.localRect.y
  }
  const localCanvas = await windowInfo.createCanvas!(true, options.localRect.width, options.localRect.height)
  /* document.body.appendChild(localCanvas as HTMLCanvasElement)
  ;(localCanvas as HTMLCanvasElement).style.cssText = 'position: fixed;right: 50px;top: 50px' */
  const localCtx = localCanvas.getContext('2d')

  
  const drawPath = ({dl =0, dt =0, w = width, h = height, dr = 0} = {}) => {
    const pramas = [
      { l: dl, t: dt, x: 1, y: 1, a: -Math.PI },
      { l: dl + w, t: dt, x: -1, y: 1, a: -Math.PI / 2 },
      { l: dl + w, t: dt + h, x: -1, y: -1, a: 0 },
      { l: dl, t: dt + h, x: 1, y: -1, a: Math.PI / 2 }
    ]
    radius.forEach((radius, index) => {
      const prama = pramas[index]
      const _radius = Math.max(radius - dr, 0)
      if (_radius) {
        localCtx.arc(prama.l + prama.x * _radius, prama.t + prama.y * _radius, _radius, prama.a, prama.a + Math.PI / 2)
      } else {
      localCtx.lineTo(prama.l, prama.t)
      }
    })
    localCtx.lineTo(pramas[0].l, pramas[0].t + Math.max(radius[0] - dr,0))
  }

  if (shadow.inset) {
    localCtx.beginPath()
    drawPath()
    localCtx.closePath()
    localCtx.clip()
    localCtx.fillStyle = shadow.color
    localCtx.fillRect(0,0,width,height)
    localCtx.globalCompositeOperation = 'destination-out'
    localCtx.shadowBlur = 0
    localCtx.beginPath()
    drawPath({dl: options.shadowRect.x + shadow.x - shadow.blur, dt: options.shadowRect.y + shadow.y - shadow.blur, w: options.shadowRect.width + 2 * shadow.blur, h: options.shadowRect.height + 2 * shadow.blur, dr: shadow.spread + shadow.blur})
    localCtx.closePath()
    localCtx.save()
    localCtx.fill()
    localCtx.restore()
    localCtx.globalCompositeOperation = 'source-over'
    localCtx.clip()

    
    localCtx.beginPath()
    let {x: sx,y: sy, width: sw, height: sh} = options.shadowRect
    
    localCtx.shadowBlur = shadow.blur * windowInfo.dpr
    localCtx.shadowOffsetX = (sw + bw + sx + shadow.x) * windowInfo.dpr
    sx = -sw - bw
    localCtx.shadowOffsetY = shadow.y * windowInfo.dpr
    localCtx.shadowColor = shadow.color
    const radius0 = Math.max(radius[0] - shadow.spread, 0)
    localCtx.moveTo(sx- bw,sy + radius0)
    drawPath({dl: sx, dt: sy, w: sw, h: sh, dr: shadow.spread})
    localCtx.lineTo(sx - bw, sy + radius0)
    localCtx.lineTo(sx - bw, sy + sh + bw)
    localCtx.lineTo(sx + sw + bw, sy + sh + bw)
    localCtx.lineTo(sx + sw + bw, sy - bw)
    localCtx.lineTo(sx - bw, sy - bw)
    localCtx.closePath()
    localCtx.fillStyle = shadow.color
    localCtx.fill()
    
  } else {
    localCtx.fillStyle = shadow.color
    localCtx.shadowBlur = shadow.blur * windowInfo.dpr
    localCtx.shadowOffsetX = shadow.x * windowInfo.dpr
    localCtx.shadowOffsetY = shadow.y * windowInfo.dpr
    localCtx.shadowColor = shadow.color
    localCtx.beginPath()
    drawPath({dl: -options.localRect.x + options.shadowRect.x, dt: -options.localRect.y + options.shadowRect.y, w: options.shadowRect.width, h: options.shadowRect.height})
    localCtx.closePath()
    localCtx.fill()
    localCtx.globalCompositeOperation = 'destination-out'
    localCtx.shadowBlur = 0
    localCtx.shadowOffsetX = 0
    localCtx.shadowOffsetY = 0
    localCtx.beginPath()
    drawPath({dl: -options.localRect.x, dt: -options.localRect.y})
    localCtx.closePath()
    localCtx.fill()
    localCtx.globalCompositeOperation = 'source-over'
  }
  
  ctx.drawImage(localCanvas, x + options.localRect.x , y + options.localRect.y, options.localRect.width, options.localRect.height)
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
  const borderRadius = getBorderRadius(layout.styles['border-radius'])
  if (layout.type === 'view') {
    if (layout.styles.background) {
      const bgWidth = layout.rect.boxWidth || 0
      const bgHeight = layout.rect.boxHeight || 0
      
        const bgCanvas = await windowInfo.createCanvas!(true, layout.rect.boxWidth!, layout.rect.boxHeight)
        const bgCtx = bgCanvas!.getContext('2d')
        if (layout.styles['border-radius']) {
          const width = bgWidth
          const height = bgHeight
          bgCtx.beginPath()
          const pramas = [
            { l: 0, t: 0, x: 1, y: 1, a: -Math.PI },
            { l: width, t: 0, x: -1, y: 1, a: -Math.PI / 2 },
            { l: width, t: height, x: -1, y: -1, a: 0 },
            { l: 0, t: height, x: 1, y: -1, a: Math.PI / 2 }
          ]
          borderRadius.forEach((radius, index) => {
            const prama = pramas[index]
            if (radius) {
              bgCtx.arc(prama.l + prama.x * radius, prama.t + prama.y * radius, radius, prama.a, prama.a + Math.PI / 2)
            } else {
              bgCtx.lineTo(prama.l, prama.t)
            }
          })
          bgCtx.closePath()
          bgCtx.clip()
        }
        await parseBackgroundShorthand(bgCanvas, layout.styles.background, layout.rect)
        if (bgCanvas && bgCanvas.width && bgCanvas.height) {
          await ctx.drawImage(bgCanvas, parentLeft, parentTop, bgWidth, bgHeight)
          if (layout.styles.border) {
            // ???
            const borderArr = getBorderOption(layout.styles.border)
            if (borderArr) {
              bgCtx.lineWidth = borderArr[0]
              bgCtx.strokeStyle = borderArr[2]
              bgCtx.stroke()
            }
          }
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
      const width = bgWidth
      const height = bgHeight
      bgCtx.beginPath()
      const pramas = [
        { l: 0, t: 0, x: 1, y: 1, a: -Math.PI },
        { l: width, t: 0, x: -1, y: 1, a: -Math.PI / 2 },
        { l: width, t: height, x: -1, y: -1, a: 0 },
        { l: 0, t: height, x: 1, y: -1, a: Math.PI / 2 }
      ]
      borderRadius.forEach((radius, index) => {
        const prama = pramas[index]
        if (radius) {
          bgCtx.arc(prama.l + prama.x * radius, prama.t + prama.y * radius, radius, prama.a, prama.a + Math.PI / 2)
        } else {
          bgCtx.lineTo(prama.l, prama.t)
        }
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
    let currentItem: BoxShadowProps = {
      x: 0,
      y: 0,
      blur: 0,
      color: 'rgba(0, 0, 0, 1)',
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
            color: 'rgba(0, 0, 0, 1)',
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
          shadow: shadowItem
        })
      }
    }
  }

  if (layout.type === 'view' && (!layout.children || !layout.children.length) && layout.content) {
    await windowInfo.drawTexts!(layout, ctx, parentTop, parentLeft)
  }

  if (layout.children && layout.children.length) {
    const contentWidth =
      (layout.rect.boxWidth || 0) +
      getMarginOrPaddingValue(layout.rect, 'padding-right') +
      getMarginOrPaddingValue(layout.rect, 'padding-left')
    const contentHeight =
      layout.rect.boxHeight! +
      getMarginOrPaddingValue(layout.rect, 'padding-top') +
      getMarginOrPaddingValue(layout.rect, 'padding-bottom')
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
    parentCtx.transform(...matrix)
    await parentCtx.drawImage(
      canvas,
      -originX / windowInfo.dpr,
      -originY / windowInfo.dpr,
      layout.rect.boxWidth! / windowInfo.dpr,
      layout.rect.boxHeight! / windowInfo.dpr
    )
    parentCtx.setTransform(windowInfo.dpr, 0, 0, windowInfo.dpr, 0, 0)
  }
}
