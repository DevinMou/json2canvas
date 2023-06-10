import { ComputedLayout, windowInfo } from '..'
import {
  AstFn,
  computeAstFnParam,
  getBorderOption,
  getBorderRadius,
  getLengthValue,
  LengthParseObj,
  lengthReg,
  parseFnParams,
  parseLengthStr,
  percentStrReg
} from '../util/common'
import { MT } from '../util/sample_matrix'
import { NOS, SpecifiedLengthTuple } from '../util/type'
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
  /* let matrix = MT(
    [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ],
    [
      [windowInfo.dpr, 0, 0],
      [0, windowInfo.dpr, 0],
      [0, 0, 1]
    ]
  )! */
  let matrix = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ]
  transforms.forEach(function (transform) {
    switch (transform.type) {
      case 'translate':
        // matrix[0][2] += transform.value.x
        // matrix[1][2] += transform.value.y
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
  const image = windowInfo.createImage!(canvas)
  await new Promise(resolve => {
    image.onload = resolve
    image.src = imgSrc
  })
  const { width, height } = image
  const chw = width / height
  let dWidth = 0
  let dHeight = 0
  if (postion === 'top') {
    dWidth = canvasWidth
    dHeight = canvasWidth / chw
    ctx.drawImage(image, 0, 0, dWidth, dHeight)
  } else if (postion === 'bottom') {
    dWidth = canvasWidth
    dHeight = canvasWidth / chw
    ctx.drawImage(image, 0, canvasHeight - canvasWidth / chw, dWidth, dHeight)
  } else if (postion === 'left') {
    dWidth = canvasHeight * chw
    dHeight = canvasHeight
    ctx.drawImage(image, 0, 0, dWidth, dHeight)
  } else if (postion === 'right') {
    dWidth = canvasHeight * chw
    dHeight = canvasHeight
    ctx.drawImage(image, canvasWidth - canvasHeight * chw, 0, dWidth, dHeight)
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
      ctx.drawImage(image, l, t, w, h)
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
      ctx.drawImage(image, sx, sy, sw, sh, l, t, w, h)
    }
  } else if (repeat) {
    if (repeat.top !== undefined && repeat.bottom !== undefined) {
      dWidth = canvasWidth
      dHeight = canvasHeight - repeat.top - repeat.bottom
      let len = dHeight
      const top = repeat.top
      while (len > 0) {
        ctx.drawImage(image, 0, top + (dHeight - len), canvasWidth, len > width / chw ? width / chw : len)
        len -= width / chw
      }
    } else if (repeat.left !== undefined && repeat.right !== undefined) {
      dHeight = canvasHeight
      dWidth = canvasWidth - repeat.left - repeat.right
      let len = dWidth
      const left = repeat.left
      while (len > 0) {
        ctx.drawImage(image, left + (dWidth - len), 0, len > height * chw ? height * chw : len, canvasHeight)
        len -= height * chw
      }
    }
  }
  return { width: dWidth, height: dHeight }
}
const getImgUrl = (str: string) => {
  const match = /url\(('|")?([^)(\1]+)\1\)$/.exec(str)
  return match ? match[2] : ''
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
    canvas = windowInfo.createCanvas!(true, layout.rect.boxWidth, layout.rect.boxHeight)
    ctx = canvas.getContext('2d')
    parentLeft = 0
    parentTop = 0
  }
  if (layout.type === 'view') {
    if (layout.styles.background) {
      const bgWidth = layout.rect.boxWidth || 0
      const bgHeight = layout.rect.boxHeight || 0
      if (Array.isArray(layout.styles.background)) {
        const bgCanvas = windowInfo.createCanvas!(true, bgWidth * windowInfo.dpr, bgHeight * windowInfo.dpr)
        const bgCtx = bgCanvas.getContext('2d')
        bgCtx.scale(windowInfo.dpr, windowInfo.dpr)

        if (layout.styles['border-radius']) {
          const width = bgWidth
          const height = bgHeight

          const borderRadius = getBorderRadius(layout.styles['border-radius'])
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
        const bgs = layout.styles.background
        if (bgs.length === 3) {
          const postion_str = ['top', 'left', 'bottom', 'right']
          type Ps = 'top' | 'left' | 'bottom' | 'right'
          const [startBg, centerBg, endBg] = bgs
          const startPostionIndex = postion_str.indexOf(startBg.position as string)
          const endPostionIndex = postion_str.indexOf(endBg.position as string)
          const isVertical = (index: number) => ['top', 'bottom'].includes(postion_str[index])
          if (Math.abs(startPostionIndex - endPostionIndex) === 2) {
            const startImgUrl = getImgUrl(startBg.image || '')
            const endImgUrl = getImgUrl(endBg.image || '')
            if (startImgUrl && endImgUrl) {
              const { width: startWidth, height: startHeight } = await drawImage({
                canvas: bgCanvas,
                ctx: bgCtx,
                canvasWidth: bgWidth,
                canvasHeight: bgHeight,
                imgSrc: startImgUrl,
                postion: startBg.position as Ps
              })
              const { width: endWidth, height: endHeight } = await drawImage({
                canvas: bgCanvas,
                ctx: bgCtx,
                canvasWidth: bgWidth,
                canvasHeight: bgHeight,
                imgSrc: endImgUrl,
                postion: endBg.position as Ps
              })
              if (centerBg.color) {
                bgCtx.fillStyle = centerBg.color
                // const fixErr = 0.5
                const fixErr = 0
                if (isVertical(startPostionIndex)) {
                  bgCtx.fillRect(0, startHeight - fixErr, bgWidth, bgHeight - startHeight - endHeight + fixErr * 2)
                } else {
                  bgCtx.fillRect(startWidth - fixErr, 0, bgWidth - startWidth - endWidth + fixErr * 2, bgHeight)
                }
              } else if (centerBg.repeat) {
                if (centerBg.repeat === 'repeat-y') {
                  const centerImgUrl = getImgUrl(centerBg.image || '')
                  centerImgUrl &&
                    (await drawImage({
                      canvas: bgCanvas,
                      ctx: bgCtx,
                      canvasWidth: bgWidth,
                      canvasHeight: bgHeight,
                      imgSrc: centerImgUrl,
                      repeat: {
                        [startBg.position as Ps]: isVertical(startPostionIndex) ? startHeight : startWidth,
                        [endBg.position as Ps]: isVertical(endPostionIndex) ? endHeight : endWidth
                      }
                    }))
                }
              }
            }
          }
        } else if (bgs.length === 1) {
          const bg = bgs[0]
          const imgUrl = getImgUrl(bg.image || '')
          if (bg.position === 'center') {
            const size = bg.size === 'contain' ? 'contain' : 'cover'
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
        }
        ctx.drawImage(bgCanvas, parentLeft, parentTop, bgWidth, bgHeight)
        if (layout.styles.border) {
          // ???
          const borderArr = getBorderOption(layout.styles.border)
          if (borderArr) {
            bgCtx.lineWidth = borderArr[0]
            bgCtx.strokeStyle = borderArr[2]
            bgCtx.stroke()
          }
        }
      } else {
        const bgCanvas = windowInfo.createCanvas!(true, layout.rect.boxWidth!, layout.rect.boxHeight)
        const bgCtx = bgCanvas!.getContext('2d')
        if (layout.styles['border-radius']) {
          const width = bgWidth
          const height = bgHeight

          const borderRadius = getBorderRadius(layout.styles['border-radius'])
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
          ctx.drawImage(bgCanvas, parentLeft, parentTop, bgWidth, bgHeight)
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
        /* if (layout.styles['border-radius']) {
          const width = (layout.rect.boxWidth || 0) + getMarginOrPaddingValue(layout.rect, 'padding-right') + getMarginOrPaddingValue(layout.rect, 'padding-left')
          const height = layout.rect.boxHeight! + getMarginOrPaddingValue(layout.rect, 'padding-top') + getMarginOrPaddingValue(layout.rect, 'padding-bottom')

          const borderRadius = getMarginOrPadding(layout.styles['border-radius'])
          ctx.beginPath()
          const pramas = [
            { l: parentLeft, t: parentTop, x: 1, y: 1, a: -Math.PI },
            { l: parentLeft + width, t: parentTop, x: -1, y: 1, a: -Math.PI / 2 },
            { l: parentLeft + width, t: parentTop + height, x: -1, y: -1, a: 0 },
            { l: parentLeft, t: parentTop + height, x: 1, y: -1, a: Math.PI / 2 }
          ]
          borderRadius.forEach((radius, index) => {
            const prama = pramas[index]
            if (radius) {
              ctx.arc(prama.l + prama.x * radius, prama.t + prama.y * radius, radius, prama.a, prama.a + Math.PI / 2)
            } else {
              ctx.lineTo(prama.l, prama.t)
            }
          })
          ctx.closePath()
          if (layout.styles.border) {
            const borderArr = getBorderOption(layout.styles.border)
            if (borderArr) {
              ctx.lineWidth = borderArr[0]
              ctx.strokeStyle = borderArr[2]
              ctx.stroke()
            }
          }
          ctx.fillStyle = layout.styles.background
          ctx.fill()
        } else {
          ctx.fillStyle = layout.styles.background
          ctx.fillRect(parentLeft, parentTop, bgWidth, bgHeight)
        } */
      }
    }
    if (layout.content) {
      let fontWeight: 'normal' | 'bold' = 'normal'
      if (layout.styles['font-size']) {
        if (typeof layout.styles['font-size'] === 'string') {
          if (layout.styles['font-size'] === 'bold') {
            fontWeight = 'bold'
          }
        } else {
          if (layout.styles['font-size'] > 500) {
            fontWeight = 'bold'
          }
        }
      }
      ctx.font = `${layout.styles['font-style'] || ''} ${fontWeight} ${layout.styles['font-size']}px/${
        layout.styles['line-height']
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
        // ctx.strokeRect(parentLeft + getMarginOrPaddingValue(layout.rect, 'padding-left'), parentTop + getMarginOrPaddingValue(layout.rect, 'padding-top'), layout.rect.boxWidth, layout.styles['line-height'])
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
        // ctx.strokeRect(parentLeft + getMarginOrPaddingValue(layout.rect, 'padding-left'), parentTop + getMarginOrPaddingValue(layout.rect, 'padding-top'), layout.rect.boxWidth, layout.styles['line-height'])
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
  } else if (layout.type === 'img' && layout.content) {
    const bgWidth =
      (layout.rect.boxWidth || 0) +
      getMarginOrPaddingValue(layout.rect, 'padding-right') +
      getMarginOrPaddingValue(layout.rect, 'padding-left')
    const bgHeight =
      layout.rect.boxHeight! +
      getMarginOrPaddingValue(layout.rect, 'padding-bottom') +
      getMarginOrPaddingValue(layout.rect, 'padding-top')
    const bgCanvas = windowInfo.createCanvas!(true, bgWidth * windowInfo.dpr, bgHeight * windowInfo.dpr)
    const bgCtx = bgCanvas.getContext('2d')
    bgCtx.scale(windowInfo.dpr, windowInfo.dpr)

    if (layout.styles['border-radius']) {
      const width = bgWidth
      const height = bgHeight

      const borderRadius = getBorderRadius(layout.styles['border-radius'])
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
      const image = windowInfo.createImage!(canvas)
      await new Promise(resolve => {
        image.onload = resolve
        image.src = layout.content!
      })
      const { width, height } = image
      bgCtx.drawImage(
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
    ctx.drawImage(bgCanvas, parentLeft, parentTop, bgWidth, bgHeight)
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
    parentCtx.drawImage(
      canvas,
      -originX / windowInfo.dpr,
      -originY / windowInfo.dpr,
      layout.rect.boxWidth! / windowInfo.dpr,
      layout.rect.boxHeight! / windowInfo.dpr
    )
    parentCtx.setTransform(windowInfo.dpr, 0, 0, windowInfo.dpr, 0, 0)
  }
}
