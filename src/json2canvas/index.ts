/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { parseBackgroundShorthand } from './lib/background'
import { drawItem } from './lib/draw'
import { parseFlex, setFlexSizeLength, FlexItemProp } from './lib/flex'
import { getBorderArr, getMarginOrPadding, getRealValue, precentStrReg } from './util/common'
import { ReactCompute } from './util/react_compute'
import { PickRequried, PickKeyByValueType, NOS } from './util/type'

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
  background:
    | {
        image?: string
        size?: NOS
        position?: NOS
        repeat?: string
        clip?: string
        color?: string
      }[]
    | string
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
  textLines?: string[]
  rect?: LayoutRect
}

const computedText: {
  canvas?: SampleCanvas.Canvas
  context?: SampleCanvas.RenderContext
} = {}

const getTextLines = (
  content: string,
  styles: PickRequried<ReturnType<typeof coverStyles2RealValue>, 'font-size' | 'font-weight' | 'line-height'>,
  padding: number[]
) => {
  if (!computedText.canvas) {
    computedText.canvas = windowInfo.createCanvas!(true)
    computedText.context = computedText.canvas!.getContext('2d')
  }
  computedText.context!.font = `${styles['font-weight'] || 'normal'} ${styles['font-size']}px sans-serif`
  if (styles.width === undefined) {
    const width = computedText.context!.measureText(content).width
    return {
      textWidth: width,
      lines: [{ sites: [[0, content.length - 1, content]] as [number, number, string][], content }],
      flatLines: [content]
    }
  } else {
    const baseNum = Math.floor(+styles.width / styles['font-size'])
    const width = +styles.width - (styles['box-sizing'] === 'content-box' ? 0 : padding[1] + padding[3])
    const getLine = (str: string) => {
      const len = str.length
      let startIndex = 0
      let endIndex = baseNum
      let ok: undefined | boolean | null = undefined
      const siteArr: [number, number, string][] = []
      const lineBreakStr = `,，.。”！》、：；】〉!:;]>`
      const isEnd = () => {
        if (endIndex >= len - 1) {
          endIndex = len
          siteArr.push([startIndex, endIndex, str.slice(startIndex, endIndex)])
          ok = null
          return true
        } else {
          return false
        }
      }
      const lineAdd = (offset = 0) => {
        siteArr.push([startIndex, endIndex, str.slice(startIndex, endIndex + offset)])
        startIndex = endIndex + offset
        endIndex = startIndex + baseNum
        ok = undefined
      }
      while (ok !== null) {
        if (styles['line-break'] !== 'anywhere' && siteArr.length) {
          const lastLine = siteArr[siteArr.length - 1]
          const lastLineStr = lastLine[2].charAt(0)
          const currentFirstChart = str.charAt(startIndex)
          if (lineBreakStr.includes(currentFirstChart)) {
            const lastNoBreakCharIndex = lastLineStr
              .split('')
              .reverse()
              .findIndex(e => !lineBreakStr.includes(e))
            if (lastNoBreakCharIndex > -1) {
              startIndex -= lastNoBreakCharIndex + 1
              lastLine[2] = lastLine[2].slice(0, -lastNoBreakCharIndex - 1)
              lastLine[1] -= lastNoBreakCharIndex + 1
            }
          }
        }
        const w = computedText.context!.measureText(str.slice(startIndex, endIndex)).width
        if (ok === undefined) {
          if (w === width) {
            if (!isEnd()) {
              lineAdd()
            }
          } else {
            ok = w < width
            if (ok) {
              if (!isEnd()) {
                endIndex += 1
              }
            } else {
              endIndex -= 1
            }
          }
        } else {
          if (ok) {
            if (w === width) {
              if (!isEnd()) {
                lineAdd()
              }
            } else if (w < width) {
              if (!isEnd()) {
                endIndex += 1
              }
            } else {
              lineAdd(-1)
            }
          } else {
            if (w === width) {
              lineAdd()
            } else if (w > width) {
              endIndex -= 1
            } else {
              lineAdd()
            }
          }
        }
      }
      return { sites: siteArr, content: str }
    }
    const res = content.split(/\n/g).map(e => {
      if (e) {
        return getLine(e)
      } else {
        return { sites: [[0, 0, '']] as [number, number, string][], content: '' }
      }
    })
    return {
      textWidth: width,
      lines: res,
      flatLines: res
        .map(e => e.sites)
        .flat()
        .map(e => e[2])
    }
  }
}
const coverStyles2RealValue = (styles: DrawLayout['styles']) => {
  type NosKeys = PickKeyByValueType<DrawStyles, NOS>
  const needRealValueStyles: NosKeys[] = [
    'border',
    'border-radius',
    'bottom',
    'font-size',
    'height',
    'left',
    'line-height',
    'margin',
    'padding',
    'right',
    'top',
    'width'
  ]
  const res = { ...styles }
  type kds = keyof DrawStyles
  for (const k in styles) {
    if (Object.prototype.hasOwnProperty.call(styles, k)) {
      const v = styles[k as kds]
      if (needRealValueStyles.includes(k as NosKeys)) {
        ;(res as Record<string, any>)[k] = getRealValue(v as NOS)
      } else if (k === 'background' && Array.isArray(v)) {
        res['background'] = v.map(e => {
          e = { ...e }
          if (e.position) {
            e.position = getRealValue(e.position)
          }
          return e
        })
      }
    }
  }
  return res as Partial<DrawStyles & Record<Exclude<NosKeys, 'width' | 'height'>, number> & { width: NOS; height: NOS }>
}

const parseOrigin = (val?: NOS) => {
  const res = {
    xPrecent: true,
    yPrecent: true,
    x: 50,
    y: 50
  }
  if (typeof val === 'number') {
    res.xPrecent = false
    res.yPrecent = false
    res.x = val
    res.y = val
  } else if (typeof val === 'string' && val) {
    const karr = val.split(/\s+/g)
    karr.forEach((item, index) => {
      switch (item) {
        case 'top':
          res.y = 0
          res.yPrecent = true
          break
        case 'left':
          res.x = 0
          res.xPrecent = true
          break
        case 'right':
          res.x = 100
          res.xPrecent = true
          break
        case 'bottom':
          res.y = 100
          res.yPrecent = true
          break
        case 'center':
          if (index === 0) {
            res.x = 50
            res.xPrecent = true
          }
          if (karr.length === 1 || index === 1) {
            res.y = 50
            res.yPrecent = true
          }
          break
        default:
          if (precentStrReg.test(item)) {
            const pv = +precentStrReg.exec(item)![1]
            if (index === 0) {
              res.x = pv
              res.xPrecent = true
            }
            if (karr.length === 1 || index === 1) {
              res.y = pv
              res.yPrecent = true
            }
          }
          break
      }
    })
  }
  return res
}
const parseTransformStr = (str?: string) => {
  if (str) {
    const transformReg = /\b(\w+)\(([^)]+)\)/g
    const matches: [string, NOS[]][] = []
    let m
    while (((m = transformReg.exec(str)), m !== null)) {
      matches.push([m[1], m[2].split(/\s*,\s*/g).map(item => getRealValue(item))])
    }
    return matches.map(item => ({ type: item[0], value: item[1] }))
  } else {
    return undefined
  }
}
type RectAndStyleType = {
  rect: ReturnType<typeof initRectAndStyle>['rect']
  style: ReturnType<typeof coverStyles2RealValue>
}

const setWidthOrHeightByStyle = (
  rect: ReturnType<typeof initRectAndStyle>['rect'],
  length: number,
  isBorderBox: boolean,
  isHeight = false
) => {
  const boxDir = isHeight ? 'boxHeight' : 'boxWidth'
  const paddingDir = isHeight ? 'paddingHeight' : 'paddingWidth'
  const borderDir = isHeight ? 'borderHeight' : 'borderWidth'
  const contentDir = isHeight ? 'contentHeight' : 'contentWidth'
  if (isBorderBox) {
    rect[boxDir] = length
    rect[contentDir] = rect[boxDir]! - rect[paddingDir] - rect[borderDir]
  } else {
    rect[contentDir] = length
    rect[boxDir] = rect[contentDir]! + rect[paddingDir] + rect[borderDir]
  }
}
const initRectAndStyle = (layout: DrawLayout, parentRAT?: RectAndStyleType) => {
  // @1:初始化rect,设置固定/响应宽高
  const { styles } = layout
  const style = coverStyles2RealValue(styles)
  const border = getBorderArr(styles)
  const borderLength = border.map(e => (e ? e[0] : 0))
  const margin = getMarginOrPadding(style.margin)
  const padding = getMarginOrPadding(style.padding)
  const transformOrigin = parseOrigin(style['transform-origin'])
  const transform = parseTransformStr(style.transform)
  const rect = ReactCompute.reactive({
    index: undefined,
    boxWidth: undefined,
    boxHeight: undefined,
    contentWidth: undefined,
    contentHeight: undefined,
    childrenWidth: undefined,
    childrenHeight: undefined,
    isFlex: false,
    isFlexItem: false,
    isInline: false,
    flexBasis: undefined,
    flexGrow: undefined,
    flexShrink: undefined,
    flexIsColumn: false,
    flexIsWrap: false,
    crossLength: undefined,
    crossIndex: 0,
    flexBaseOutHeight: 0,
    flexCrossLength: undefined,
    alignSelf: undefined,
    precentValues: {},
    width: undefined,
    height: undefined,
    left: undefined,
    top: undefined,
    transformOrigin,
    transform,
    right: undefined,
    bottom: undefined,
    computedMarginLeft: undefined,
    border,
    borderWidth: borderLength[1] + borderLength[3],
    borderHeight: borderLength[0] + borderLength[2],
    margin,
    padding,
    paddingWidth: padding[1] + padding[3],
    paddingHeight: padding[0] + padding[2],
    marginWidth: margin[1] + margin[3],
    marginHeight: margin[0] + margin[2],
    parentRect: undefined,
    parentStyle: undefined
  }).value<
    number,
    {
      flexBasis: NOS
      margin: number[]
      padding: number[]
      border: number[]
      alignSelf: DrawStyles['align-self']
      parentStyle: RectAndStyleType['style']
      precentValues: { [k in 'width' | 'height']?: number }
    },
    'parentRect'
  >()
  if (/flex$/.test(layout.styles.display || '')) {
    rect.isFlex = true
    if (style['flex-direction'] === 'column') {
      rect.flexIsColumn = true
    }
    if (style['flex-wrap'] === 'wrap') {
      rect.flexIsWrap = true
    }
  }
  if (parentRAT) {
    if (parentRAT.rect.isFlex && styles.position !== 'absolute') {
      const { grow, shrink, basis } = parseFlex(style.flex || '')
      rect.flexGrow = grow
      rect.flexShrink = shrink
      rect.flexBasis = basis
      rect.isFlexItem = true
      rect.alignSelf = parentRAT.style['align-items'] || layout.styles['align-self'] || 'stretch'
    }
    rect.parentRect = parentRAT.rect
    rect.parentStyle = parentRAT.style
  }
  if (/^inline-/.test(styles.display || '')) {
    rect.isInline = true
  }
  if (!layout.children || !layout.children.length) {
    if (layout.type === 'view' && style['font-size'] && style['line-height'] && !style.height && layout.content) {
      const { flatLines, textWidth } = getTextLines(
        layout.content,
        style as Parameters<typeof getTextLines>[1],
        padding
      )
      rect.contentWidth = textWidth
      layout.textLines = flatLines
      rect.contentHeight = flatLines.length * style['line-height']
    }
  }

  const isBorderBox = style['box-sizing'] === 'border-box'
  let isRecentStr = false
  if (typeof style.width === 'number') {
    setWidthOrHeightByStyle(rect, style.width, isBorderBox)
  } else if (
    ((isRecentStr = precentStrReg.test(style.width || '')),
    isRecentStr ||
      ((style.width === 'auto' || style.width === undefined) &&
        (style.display === 'block' ||
          style.display === 'flex' ||
          style.display === undefined ||
          (rect.isFlexItem && rect.parentRect.flexIsColumn && rect.alignSelf === 'stretch'))))
  ) {
    if (isRecentStr) {
      rect.precentValues.width = +precentStrReg.exec(style.width!)![1] / 100
    }
    if (rect.parentRect && (rect.isFlexItem ? rect.parentRect.flexIsColumn : true)) {
      if (rect.parentRect.contentWidth === undefined) {
        ReactCompute.watch(
          rect.isFlexItem ? () => rect.flexCrossLength : () => rect.parentRect.contentWidth,
          contentWidth => {
            if (contentWidth !== undefined) {
              if (isRecentStr) {
                const tempWidth = contentWidth * rect.precentValues.width!
                setWidthOrHeightByStyle(rect, tempWidth, isBorderBox)
              } else {
                setWidthOrHeightByStyle(rect, contentWidth - rect.marginWidth, true)
              }
            }
          }
        )
      } else {
        if (isRecentStr) {
          const tempWidth = rect.parentRect.contentWidth * rect.precentValues.width!
          setWidthOrHeightByStyle(rect, tempWidth, isBorderBox)
        } else {
          setWidthOrHeightByStyle(rect, rect.parentRect.contentWidth - rect.marginWidth, true)
        }
      }
    }
  }
  if (typeof style.height === 'number') {
    setWidthOrHeightByStyle(rect, style.height, isBorderBox, true)
  } else if (precentStrReg.test(style.height || '')) {
    rect.precentValues.height = +precentStrReg.exec(style.height!)![1] / 100
    if (rect.parentRect && (rect.isFlexItem ? !rect.parentRect.flexIsColumn : true)) {
      if (rect.parentRect.contentHeight !== undefined) {
        const tempHeight = rect.parentRect.contentHeight * rect.precentValues.height
        setWidthOrHeightByStyle(rect, tempHeight, isBorderBox, true)
      } else {
        ReactCompute.watch(
          rect.isFlexItem ? () => rect.flexCrossLength : () => rect.parentRect.contentHeight,
          contentHeight => {
            if (contentHeight !== undefined) {
              const tempHeight = contentHeight * rect.precentValues.height!
              setWidthOrHeightByStyle(rect, tempHeight, isBorderBox, true)
            }
          }
        )
      }
    }
  } else if (
    ['auto', undefined].includes(layout.styles.height) &&
    rect.isFlexItem &&
    !rect.parentRect.flexIsColumn &&
    rect.alignSelf === 'stretch'
  ) {
    ReactCompute.watch(
      rect.isFlexItem ? () => rect.flexCrossLength : () => rect.parentRect.contentHeight,
      contentHeight => {
        if (contentHeight !== undefined) {
          const tempHeight = contentHeight - rect.marginHeight
          setWidthOrHeightByStyle(rect, tempHeight, true, true)
        }
      },
      { immediate: true }
    )
  } else if (!layout.children || !layout.children.length) {
    setWidthOrHeightByStyle(rect, 0, false, true)
  }

  return {
    rect, // 未计算padding的宽高
    style
  }
}

export const getFlexLayout = (...args: Parameters<typeof setFlexSizeLength>) => {
  const { flexBoxLength, children } = setFlexSizeLength(...args)
  return {
    flexBoxLength,
    children: children.map(e => {
      setWidthOrHeightByStyle(e.layout.rect, e.sizeLength!, !!e.borderBox, args[2])
      return e
    })
  }
}

const computeFlexRect = async (layout: ComputedLayout) => {
  if (layout.rect.isFlex) {
    const isColumn = layout.styles['flex-direction'] === 'column'
    const dir = isColumn ? 'height' : 'width'
    const contentDir = isColumn ? 'contentHeight' : 'contentWidth'
    if (layout.children && layout.children.length) {
      const flexItemGroup: FlexItemProp[] = []
      layout.children
        .filter(e => e.styles.position !== 'absolute')
        .forEach(e => {
          const flexItem: FlexItemProp = {
            flexGrow: e.rect.flexGrow!,
            flexShrink: e.rect.flexShrink!,
            padding: isColumn ? e.rect.paddingHeight + e.rect.borderHeight : e.rect.paddingWidth + e.rect.borderWidth,
            margin: isColumn ? e.rect.marginHeight : e.rect.marginWidth,
            layout: e
          }
          if (e.styles.overflow === 'hidden' || e.styles.overflow === 'auto') {
            flexItem.overflow = true
          } else {
            //
          }
          if (e.styles['box-sizing'] === 'border-box') {
            flexItem.borderBox = true
          }
          const direction = isColumn ? 'height' : 'width'
          if (e.rect.precentValues[direction] !== undefined) {
            flexItem.precentLength = e.rect.precentValues[direction]
          } else if (typeof e.styles[direction] === 'number') {
            flexItem.styleLength = e.styles[direction] as number
          } else if (e.rect[isColumn ? 'contentHeight' : 'contentWidth'] !== undefined) {
            flexItem.contentLength = e.rect[isColumn ? 'contentHeight' : 'contentWidth']
            flexItem.borderBox = false
          }
          flexItemGroup.push(flexItem)
        })
      const innerCompute = (flexInitLength?: number) => {
        setWidthOrHeightByStyle(
          layout.rect,
          getFlexLayout(flexItemGroup, flexInitLength, isColumn, layout.rect.flexIsWrap).flexBoxLength,
          false,
          isColumn
        )
        /* Promise.all(
          flexLayouts.map(flexLayout => {
            return Promise.all(
              flexLayout
                .filter(item => item.layout.rect.precentValues[reDir] === undefined)
                .map(item => {
                  return new Promise<number>(resolve => {
                    if (item.layout.rect[reContentDir] !== undefined) {
                      resolve(item.layout.rect[reContentDir]!)
                    } else {
                      ReactCompute.watch(
                        () => item.layout.rect[reContentDir],
                        contentLength => {
                          if (contentLength !== undefined) {
                            resolve(contentLength)
                          }
                        }
                      )
                    }
                  }).then(
                    contentLength =>
                      (item.layout.styles['box-sizing'] === 'border-box'
                        ? 0
                        : isColumn
                        ? item.layout.rect.paddingWidth + item.layout.rect.borderWidth
                        : item.layout.rect.paddingHeight + item.layout.rect.borderHeight) +
                      contentLength +
                      (isColumn ? item.layout.rect.marginWidth : item.layout.rect.marginHeight)
                  )
                })
            ).then(lengthArr => {
              const flexCrossLength = Math.max(...lengthArr)
              flexLayout.forEach(item => (item.layout.rect.flexCrossLength = flexCrossLength))
              return flexCrossLength
            })
          })
        ).then(flexCrossLengthArr => {
          layout.rect[reContentDir] = flexCrossLengthArr.reduce((a, b) => a + b, 0)
        }) */
      }
      if (['auto', undefined].includes(layout.styles[dir])) {
        innerCompute()
      } else {
        await new Promise<number>(resolve => {
          if (layout.rect[contentDir] === undefined) {
            ReactCompute.watch(
              () => layout.rect[contentDir],
              contentLength => contentLength !== undefined && resolve(contentLength)
            )
          } else {
            resolve(layout.rect[contentDir]!)
          }
        }).then(contentLength => {
          innerCompute(contentLength)
        })
      }
      if (
        layout.rect.isFlexItem &&
        layout.rect.parentRect.flexIsColumn === isColumn &&
        (layout.styles.overflow === 'hidden' || layout.styles.overflow === 'auto')
      ) {
        if (layout.rect.parentRect[contentDir] !== undefined) {
          innerCompute(layout.rect[contentDir])
        } else {
          ReactCompute.watch(
            () => layout.rect.parentRect[contentDir],
            () => {
              innerCompute(layout.rect[contentDir])
            }
          )
        }
      }
    } else {
      // layout.rect.contentWidth = layout.rect.styleWidth || 0
    }
  }
}

const mergeRect = (layout: ComputedLayout) => {
  //@2:计算flex布局和合并children宽高
  if (layout.children && layout.children.length) {
    if (layout.rect.isFlex) {
      computeFlexRect(layout)
      if (layout.rect.flexIsColumn) {
        mergeSize(layout)
      } else {
        mergeSize(layout, true)
      }
    } else {
      mergeSize(layout)
      mergeSize(layout, true)
    }
  } else {
    //
  }
}

export type LayoutRect = ReturnType<typeof initRectAndStyle>['rect']
export interface ComputedLayout extends PickRequried<DrawLayout, 'rect'> {
  styles: ReturnType<typeof initRectAndStyle>['style']
  children?: ComputedLayout[]
}

const getRectsPropPromise = <T>(
  rects: ComputedLayout['rect'][],
  fn: (rect: ComputedLayout['rect']) => T | undefined
) => {
  return Promise.all(
    rects.map(rect => {
      return new Promise<T>(resolve => {
        const current = fn(rect)
        if (current === undefined) {
          ReactCompute.watch(
            () => fn(rect),
            val => {
              if (val !== undefined) {
                resolve(val)
              }
            }
          )
        } else {
          resolve(current)
        }
      })
    })
  )
}
const getDir = (isColumn = false, isRe?: boolean) => {
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
const mergeSize = (layout: ComputedLayout, isHeight = false) => {
  const dir = isHeight ? 'height' : 'width'
  const contentDir = isHeight ? 'contentHeight' : 'contentWidth'

  if (layout.rect.isFlex) {
    const levels: ComputedLayout[][] = []
    const positionChildren = layout.children!.filter(item => item.styles.position !== 'absolute')
    getRectsPropPromise(
      positionChildren.map(item => item.rect),
      _rect => _rect[getDir(isHeight, true).content]
    ).then(() => {
      positionChildren.forEach(item => {
        if (levels.length !== item.rect.crossIndex + 1) {
          levels.push([])
        }
        const level = levels[levels.length - 1]
        if (
          ['auto', undefined].includes(item.styles[dir]) &&
          item.rect[getDir(isHeight).content] === undefined &&
          item.rect.alignSelf === 'stretch'
        ) {
          ReactCompute.watch(
            () => item.rect.crossLength,
            crossLength => {
              if (crossLength !== undefined) {
                setWidthOrHeightByStyle(item.rect, crossLength - item.rect[getDir(isHeight).margin], false, isHeight)
              }
            },
            { immediate: true }
          )
        } else if (item.rect.precentValues[dir] !== undefined) {
          if (isHeight) {
            setWidthOrHeightByStyle(item.rect, 0, false, true)
          } else {
            ReactCompute.watch(
              () => layout.rect.contentWidth,
              contentWidth => {
                if (contentWidth !== undefined) {
                  setWidthOrHeightByStyle(
                    item.rect,
                    contentWidth * item.rect.precentValues.width!,
                    item.styles['box-sizing'] === 'border-box',
                    false
                  )
                }
              },
              { immediate: true }
            )
          }
        } else {
          level.push(item)
        }
      })
      const crossLengthArr: number[] = []
      Promise.all(
        levels.map((level, index) => {
          return getRectsPropPromise(
            level.map(item => item.rect),
            _rect => _rect[contentDir]
          ).then(() => {
            const crossLength = Math.max(
              ...level.map(item => item.rect[getDir(isHeight).box]! + item.rect[getDir(isHeight).margin])
            )
            crossLengthArr[index] = crossLength
            return crossLength
          })
        })
      ).then(lengthArr => {
        if (crossLengthArr.length === 1 && layout.rect[getDir(isHeight).content] !== undefined) {
          crossLengthArr[0] = layout.rect[getDir(isHeight).content]!
        }
        positionChildren.forEach((item, index) => {
          item.rect.crossLength = crossLengthArr[item.rect.crossIndex] || 0
          if (isHeight && !index) {
            ReactCompute.watch(
              () => layout.rect.contentHeight,
              contentHeight => {
                if (contentHeight === undefined) {
                  return
                }
                const rest = item.rect.crossLength! - item.rect.margin[0] - item.rect.boxHeight! - item.rect.margin[2]
                layout.rect.flexBaseOutHeight =
                  contentHeight -
                  item.rect.boxHeight! -
                  item.rect.marginHeight -
                  (item.rect.alignSelf === 'center' ? rest / 2 : item.rect.alignSelf === 'flex-end' ? rest : 0)
              },
              { immediate: true }
            )
          }
        })
        if (isHeight) {
          if (['auto', undefined].includes(layout.styles.height)) {
            setWidthOrHeightByStyle(
              layout.rect,
              lengthArr.reduce((a, b) => a + b, 0),
              false,
              true
            )
          }
        } else {
          if (['auto', undefined].includes(layout.styles.width)) {
            setWidthOrHeightByStyle(layout.rect, Math.max(...lengthArr), false)
          }
        }
      })
    })
  } else if (layout.rect[contentDir] === undefined && ['auto', undefined].includes(layout.styles[dir])) {
    if (isHeight) {
      if (
        (!['auto', undefined].includes(layout.styles.width) || layout.rect.isInline) &&
        ['normal', undefined].includes(layout.styles['white-space'])
      ) {
        const relationChildren = layout.children!.filter(item => item.styles.position !== 'absolute')
        getRectsPropPromise([layout.rect, ...relationChildren.map(e => e.rect)], _rect => _rect.contentWidth).then(
          contentWidthArr => {
            const parentWidth = contentWidthArr[0]
            const childrenWidths = relationChildren.map(e => e.rect.boxWidth! + e.rect.marginWidth)
            const levels: {
              isLine: boolean
              children: ComputedLayout[]
              // height?: number
            }[] = []
            let tempWidth = 0
            if (childrenWidths.length) {
              levels.push({
                isLine: false,
                children: []
              })
            }
            childrenWidths.forEach((_width, index) => {
              const item = relationChildren[index]
              const lastLevel = levels[levels.length - 1]
              if (
                tempWidth + _width > parentWidth ||
                !item.rect.isInline ||
                (lastLevel.children.length && lastLevel.isLine !== item.rect.isInline)
              ) {
                levels.push({
                  isLine: false,
                  children: []
                })
                tempWidth = _width
              } else {
                tempWidth += _width
              }
              const currentLevel = levels[levels.length - 1]
              if (!currentLevel.children.length) {
                currentLevel.isLine = item.rect.isInline
              }
              item.rect.crossIndex = levels.length - 1
              currentLevel.children.push(item)
            })
            Promise.all(
              levels.map(async level => {
                await getRectsPropPromise(
                  level.children.map(item => item.rect),
                  _rect => _rect.boxHeight
                )
                let maxHeight = 0
                let maxItem: ComputedLayout | null = null
                const flexItemFixedHeights: number[] = [0]
                level.children.forEach(item => {
                  let _height = item.rect.boxHeight! + item.rect.marginHeight
                  if (level.isLine && item.rect.isFlex) {
                    const _fixedHeight = item.rect.flexBaseOutHeight + item.rect.margin[2]
                    _height -= _fixedHeight
                    flexItemFixedHeights.push(_fixedHeight)
                  }
                  if (_height >= maxHeight) {
                    maxHeight = _height
                    maxItem = item
                  }
                })
                maxHeight += Math.max(...flexItemFixedHeights)
                level.children.forEach(item => {
                  item.rect.crossLength = maxHeight
                })
                return {
                  isInline: level.isLine,
                  maxHeight,
                  maxItem: maxItem!
                }
              })
            ).then(itemArr => {
              let preMarginBottom: number | null = null
              let tempHeight = 0
              itemArr.forEach(item => {
                const marginTop = item.maxItem.rect.margin[0]
                const marginBottom = item.maxItem.rect.margin[2]
                tempHeight +=
                  item.maxHeight -
                  (!item.maxItem.rect.isInline && preMarginBottom !== null ? Math.min(marginTop, preMarginBottom) : 0)
                if (item.maxItem.rect.isInline) {
                  preMarginBottom = null
                } else {
                  preMarginBottom = marginBottom
                }
              })
              setWidthOrHeightByStyle(layout.rect, tempHeight, false, true)
            })
          }
        )
      } else {
        //
      }
    } else {
      if (layout.rect.isInline) {
        const relationChildren = layout.children!.filter(item => item.styles.position !== 'absolute')
        getRectsPropPromise(
          relationChildren
            .filter(
              item =>
                item.rect.precentValues.width === undefined &&
                (item.rect.isInline || !['auto', undefined].includes(item.styles.width))
            )
            .map(item => item.rect),
          _rect => _rect.contentWidth
        ).then(() => {
          const levels: {
            widthBySelf: boolean
            isInline: boolean
            children: ComputedLayout[]
          }[] = []
          let lastIsInline = false
          relationChildren.forEach(item => {
            const widthBySelf = item.rect.precentValues.width === undefined
            if (!item.rect.isInline || !lastIsInline) {
              levels.push({
                isInline: item.rect.isInline,
                widthBySelf,
                children: []
              })
            }
            levels[levels.length - 1].children.push(item)
            // item.rect.crossIndex = levels.length - 1
            lastIsInline = item.rect.isInline
          })
          Promise.all(
            levels.map(level =>
              getRectsPropPromise(
                level.children.map(item => item.rect),
                _rect => _rect.boxHeight
              ).then(() => {
                let maxHeightItem: ComputedLayout | null = null
                let maxHeight = 0
                level.children.forEach(item => {
                  const _height = item.rect.boxHeight! + item.rect.marginHeight
                  if (_height >= maxHeight) {
                    maxHeight = _height
                    maxHeightItem = item
                  }
                })
                return {
                  isInline: level.isInline,
                  maxHeightItem: maxHeightItem!,
                  maxHeight
                }
              })
            )
          ).then(levelArr => {
            let preMarginBottom: null | number = null
            let tempHeight = 0
            levelArr
              .filter(item => item && item.maxHeightItem)
              .forEach(item => {
                tempHeight += item.maxHeight
                if (!item.isInline && preMarginBottom !== null) {
                  tempHeight -= Math.min(preMarginBottom, item.maxHeightItem!.rect.margin[0])
                }
                if (item.isInline) {
                  preMarginBottom = null
                } else {
                  preMarginBottom = item.maxHeightItem.rect.margin[2]
                }
              })
            setWidthOrHeightByStyle(layout.rect, tempHeight, false, true)
          })
          const maxWidth = Math.max(
            ...levels
              // .filter(item => item.widthBySelf)
              .map(({ children: level }) =>
                level
                  .map(item =>
                    item.rect.precentValues.width === undefined
                      ? item.rect.boxWidth! + item.rect.marginWidth
                      : item.styles['box-sizing'] === 'border-box'
                      ? item.rect.marginWidth
                      : item.rect.paddingWidth + item.rect.marginWidth
                  )
                  .reduce((a, b) => a + b, 0)
              )
          )
          /* let _crossIndex = 0
          let _levelLength = 0
          levels.forEach(level => {

          }) */
          setWidthOrHeightByStyle(layout.rect, maxWidth, false)
        })
      } else {
        //
      }
    }
  }
  /* if (
    (isHeight || layout.rect.isInline) &&
    layout.rect[contentDir] === undefined &&
    ['auto', undefined].includes(layout.styles[dir])
  ) {
    const childrens: NonNullable<ComputedLayout['children']>[] = []
    if (layout.rect.isFlex) {
      childrens.push([])
      layout.children?.forEach(item => {
        if (item.rect.crossIndex !== childrens.length - 1) {
          childrens.push([])
        }
        childrens[childrens.length - 1].push(item)
      })
    } else {
      childrens.push(layout.children!)
    }
    Promise.all(
      childrens.map(item => {
        return computeChildrenSubLength(item, isHeight)
      })
    ).then(lengthArr => {
      console.log(1289, lengthArr)
      setWidthOrHeightByStyle(
        layout.rect,
        lengthArr.reduce((a, b) => a + b, 0),
        false,
        isHeight
      )
    })
  } */
}
const parseLayout = (layout: DrawLayout, parentRAT?: RectAndStyleType) => {
  const { rect, style } = initRectAndStyle(layout, parentRAT)
  const computedLayout = { ...layout, styles: style } as ComputedLayout
  if (computedLayout.children && computedLayout.children.length) {
    const children = computedLayout.children.map(e => parseLayout(e, { rect, style })) as ComputedLayout['children']
    computedLayout.children = children as ComputedLayout[]
  }
  computedLayout.rect = rect
  mergeRect(computedLayout)
  return computedLayout as ComputedLayout
}
const positionKeys = ['top', 'left', 'right', 'bottom'] as const
type PositionKey = (typeof positionKeys)[number]
const getLayoutPosition = (layout: ComputedLayout) => {
  const layoutPaddingLeft = layout.rect.padding[3]
  const layoutPaddingTop = layout.rect.padding[0]
  // let preMarginBottom: null | number = null
  if (layout.children) {
    const position = {
      left: layoutPaddingLeft,
      top: layoutPaddingTop
    }
    let tempCrossIndex: number | null = null
    let tempCrossLength = 0
    let tempMainLength = 0
    const flexCrossFixedArr: number[] = []
    const flexMainFixedArr: { contentLength: number; count: number; rest: number; space: number }[] = []
    let flexCrossRestLength = 0
    if (layout.rect.isFlex) {
      layout.children
        .filter(item => item.styles.position !== 'absolute')
        .forEach(item => {
          if (flexCrossFixedArr.length !== item.rect.crossIndex + 1) {
            flexCrossFixedArr[item.rect.crossIndex] = item.rect.crossLength!
            flexMainFixedArr.push({
              contentLength: 0,
              count: 0,
              rest: 0,
              space: 0
            })
          }
          flexMainFixedArr[item.rect.crossIndex].contentLength +=
            item.rect[getDir(layout.rect.flexIsColumn).box]! + item.rect[getDir(layout.rect.flexIsColumn).margin]
          flexMainFixedArr[item.rect.crossIndex].count += 1
        })
      flexMainFixedArr.forEach(item => {
        item.rest = layout.rect[getDir(layout.rect.flexIsColumn).content]! - item.contentLength
        if (layout.styles['justify-content'] === 'space-between' && item.count > 1) {
          item.space = item.rest / (item.count - 1)
        } else if (layout.styles['justify-content'] === 'space-around' && item.count > 1) {
          item.space = item.rest / item.count
        }
      })
      const restLength =
        (layout.rect.flexIsColumn ? layout.rect.boxWidth! : layout.rect.boxHeight!) -
        flexCrossFixedArr.reduce((a, b) => a + b, 0)
      flexCrossRestLength = restLength / flexCrossFixedArr.length
    }
    let mainFixedLength = 0
    layout.children.forEach(item => {
      const marginTop = item.rect.margin[0]
      // const marginBottom = item.rect.margin[2]
      if (item.styles.position === 'absolute') {
        for (const k in item.styles) {
          if (positionKeys.includes(k)) {
            switch (k as PositionKey) {
              case 'top':
                item.rect.top = item.styles.top
                break
              case 'bottom':
                item.rect.top = layout.rect.boxHeight! - layout.rect.borderHeight - item.styles.bottom!
                break
              case 'left':
                item.rect.left = item.styles.left
                break
              case 'right':
                item.rect.left = layout.rect.boxWidth! - layout.rect.borderWidth - item.styles.right!
                break
            }
          }
        }
        if (item.rect.left === undefined) {
          item.rect.left = layout.rect.padding[3]
        }
        if (item.rect.top === undefined) {
          item.rect.top = layout.rect.padding[0]
        }
      } else if (layout.rect.isFlex) {
        const newLine = item.rect.crossIndex !== tempCrossIndex
        const mainFixedItem = flexMainFixedArr[item.rect.crossIndex]
        if (newLine) {
          mainFixedLength = 0
        }
        switch (layout.styles['justify-content']) {
          case 'flex-end':
            mainFixedLength += newLine ? mainFixedItem.rest : 0
            break
          case 'center':
            mainFixedLength += newLine ? mainFixedItem.rest / 2 : 0
            break
          default:
            if (mainFixedItem.space) {
              mainFixedLength +=
                layout.styles['justify-content'] === 'space-around' && newLine
                  ? mainFixedItem.space / 2
                  : newLine
                  ? 0
                  : mainFixedItem.space
            }
            break
        }
        if (layout.rect.flexIsColumn) {
          if (newLine) {
            tempCrossIndex = item.rect.crossIndex
            position.left += tempCrossLength
            tempCrossLength = item.rect.crossLength! + flexCrossRestLength
            position.top = layoutPaddingTop
            tempMainLength = 0
          } else {
            position.top += tempMainLength
          }
          const crossFixedLength =
            item.rect.crossLength! + flexCrossRestLength - item.rect.boxWidth! - item.rect.marginWidth
          item.rect.top = position.top + marginTop + mainFixedLength
          item.rect.left =
            position.left +
            item.rect.margin[3] +
            (item.rect.alignSelf === 'center'
              ? crossFixedLength / 2
              : item.rect.alignSelf === 'flex-end'
              ? crossFixedLength
              : 0)
          tempMainLength = item.rect.marginHeight + item.rect.boxHeight!
          if (item.rect.alignSelf === 'stretch' && ['auto', undefined].includes(item.styles.width)) {
            item.rect.boxWidth! += flexCrossRestLength
          }
        } else {
          if (newLine) {
            tempCrossIndex = item.rect.crossIndex
            position.top += tempCrossLength
            tempCrossLength = Math.max(
              item.rect.crossLength! + flexCrossRestLength,
              item.rect.boxHeight! + item.rect.marginHeight
            )
            position.left = layoutPaddingLeft
            tempMainLength = 0
          } else {
            position.left += tempMainLength
            // tempCrossLength = Math.max(tempCrossLength, item.rect.boxHeight! + item.rect.marginHeight)
          }
          const crossFixedLength =
            item.rect.crossLength! + flexCrossRestLength - item.rect.boxHeight! - item.rect.marginHeight
          item.rect.top =
            position.top +
            marginTop +
            (item.rect.alignSelf === 'center'
              ? crossFixedLength / 2
              : item.rect.alignSelf === 'flex-end'
              ? crossFixedLength
              : 0)
          item.rect.left = position.left + item.rect.margin[3] + mainFixedLength
          tempMainLength = item.rect.margin[3] + item.rect.boxWidth!
          if (item.rect.alignSelf === 'stretch' && ['auto', undefined].includes(item.styles.height)) {
            item.rect.boxHeight! += flexCrossRestLength
          }
        }
      } else {
        const newLine =
          item.rect.crossIndex !== tempCrossIndex ||
          position.left + tempMainLength + item.rect.marginWidth + item.rect.boxWidth! > layout.rect.contentWidth!
        if (newLine) {
          tempCrossIndex = item.rect.crossIndex
          position.top += tempCrossLength
          tempCrossLength = Math.max(item.rect.crossLength || 0, item.rect.boxHeight! + item.rect.marginHeight)
          position.left = layoutPaddingLeft
          tempMainLength = 0
        } else {
          position.left += tempMainLength
          tempCrossLength = Math.max(tempCrossLength, item.rect.boxHeight! + item.rect.marginHeight)
        }
        item.rect.top =
          position.top +
          marginTop +
          (item.rect.isFlex && item.rect.isInline ? item.rect.crossLength! - item.rect.boxHeight! : 0)
        item.rect.left = position.left + item.rect.margin[3]
        tempMainLength = item.rect.margin[3] + item.rect.boxWidth!
      }
      getLayoutPosition(item)
    })
  }
  return layout
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
    const rootWidth = (layoutRect.rect.boxWidth || 0) + layoutRect.rect.padding[1] + layoutRect.rect.padding[3]
    const rootHeight = layoutRect.rect.boxHeight! + layoutRect.rect.padding[2] + layoutRect.rect.padding[0]
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

export const ParseBackgroundShorthand2 = (background: string) => {
  const reg_split = /\b/
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
