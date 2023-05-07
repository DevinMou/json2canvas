/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

/*
reactive,compute
*/
type UndefinedValueKeysType<O extends object> = PickKeyByValueType<O, undefined>
type KK<V, O extends object> = V extends Partial<Record<keyof O, any>> ? keyof V : never
type MergeDefaultType<
  T = never,
  O extends object = object,
  V extends keyof O | undefined | Partial<Record<keyof O, any>> = undefined,
  KS extends keyof O | undefined = undefined
> = {
  [k in keyof O]: k extends KK<V, O>
    ? V extends Partial<Record<keyof O, any>>
      ? O[k] extends undefined
        ? V[k] | O[k]
        : V[k]
      : T extends never
      ? O[k]
      : T | O[k]
    : k extends UndefinedValueKeysType<O>
    ? k extends KS
      ? MergeDefaultType<T, O, V, KS>
      : T extends never
      ? O[k]
      : T | O[k]
    : O[k]
}
interface ReactComputeType {
  _computer_proxy: null | {
    target: object
    prop: string
    computer: {
      _current?: any
      _resolve: null | ((value: void | PromiseLike<void>) => void)
      _compute: () => void
      trigger: () => void
    }
  }
  reactive: <O extends Record<string, any> = object>(
    obj: O
  ) => {
    value: <
      T = never,
      V extends keyof O | undefined | Partial<Record<keyof O, any>> = undefined,
      KS extends keyof O | undefined = undefined
    >() => MergeDefaultType<T, O, V, KS>
  }
  compute: (obj: object | InstanceType<ProxyConstructor>, prop: string, valFn: () => any) => object
}

const ReactCompute: ReactComputeType = {
  _computer_proxy: null,
  reactive(obj) {
    return {
      value() {
        const _this = ReactCompute
        if (obj._IS_REACT_COMPUTE) {
          return Object.assign(obj)
        }
        Object.defineProperty(obj, '_IS_REACT_COMPUTE', {
          value: true
        })
        return new Proxy(obj, {
          get(target, prop) {
            if (typeof prop === 'string' && _this._computer_proxy) {
              const listenerProp = `_listener_${prop}`
              if (!target[listenerProp]) {
                Object.defineProperty(target, listenerProp, {
                  value: []
                })
              }
              target[listenerProp].push(_this._computer_proxy.computer)
            }
            return target[prop as string]
          },
          set(target, prop, value) {
            target[prop as keyof typeof target] = value
            const listenerProp = `_listener_${prop.toString()}`
            if (target[listenerProp]) {
              target[listenerProp].forEach((item: NonNullable<ReactComputeType['_computer_proxy']>['computer']) => {
                item.trigger()
              })
            }
            return true
          }
        })
      }
    }
  },
  compute(obj, prop, valFn) {
    const _this = ReactCompute
    obj = _this.reactive(obj)
    const computer = {
      _current: undefined,
      _resolve: null as null | ((value: void | PromiseLike<void>) => void),
      _compute() {
        const current = valFn()
        if (current !== this._current) {
          this._current = current
          ;(obj as Record<string, any>)[prop] = current
        }
      },
      trigger() {
        if (!this._resolve) {
          new Promise<void>(resolve => {
            this._resolve = resolve
          }).then(() => {
            this._resolve = null
            this._compute()
          })
        }
        this._resolve!()
      }
    }
    _this._computer_proxy = { target: obj, prop, computer }
    computer._compute()
    _this._computer_proxy = null
    return obj
  }
}
const precentStrReg = /^([\d.]+)%$/
type IsSameType<T, K> = [T] extends [K] ? ([K] extends [T] ? true : false) : false
export type PickKeyByValueType<T extends Record<string, any>, K> = {
  [k in keyof T]: IsSameType<T[k], K> extends true ? k : never
}[keyof T]
type NOS = number | string
export type SampleCanvasType<T extends boolean = false> = SampleCanvas<T>
export type SampleImageType = SampleImage
const windowInfo: Record<string, unknown> & {
  dpr: number
  unit: {
    [k: string]: number
  }
  createCanvas?: {
    <T extends boolean>(isOffScreen: false): SampleCanvas<T>
    <T extends boolean>(isOffScreen: true, width?: number, height?: number): SampleCanvas<T>
  }
  createImage?: (canvas?: SampleCanvas) => SampleImage
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
interface DrawStyles {
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
  display: 'block' | 'flex' | 'inline-block' | 'inline-flex'
  'flex-direction': 'column' | 'row'
  flex: string
  'flex-wrap': 'wrap' | 'nowrap'
  'align-self': 'flex-start' | 'flex-end' | 'center'
  'align-items': 'flex-start' | 'flex-end' | 'center'
  'justify-content': 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-arround'
  'box-sizing': 'border-box' | 'content-box'
  'object-fit': 'contain' | 'cover'
  'border-radius': NOS
  'line-height': NOS
  'font-size': NOS
  'font-style': 'normal' | 'italic'
  'font-weight': NOS
  'text-align': 'center' | 'left' | 'right'
  'white-space': 'nowrap' | 'wrap'
  'line-clamp': number
  'line-break': 'anywhere' | 'normal'
  overflow: 'hidden' | 'auto' | 'visible'
  color: string
  margin: NOS
  padding: NOS
  border: NOS
}
export interface DrawLayout {
  type: 'view' | 'img'
  styles: Partial<DrawStyles>
  children?: DrawLayout[]
  content?: string
  textLines?: string[]
  rect?: LayoutRect
}
const styleStringReg = /^([\d.]+)([a-zA-Z]+)?$/
const getRealValue = <T extends NOS = NOS>(val: NOS): T => {
  const reg = styleStringReg
  let res = val
  if (typeof val === 'number') {
    !0
  } else if (typeof val === 'string') {
    const match = reg.exec(val)
    if (match) {
      let value = 0
      const num = +match[1]
      const unit = match[2]
      switch (unit) {
        case 'rpx':
          value = num * windowInfo.unit!.rpx
          break
        case undefined:
        case 'px':
          value = num * 1
          break
      }
      res = value
    }
  } else {
    res = 0
  }
  return res as T
}
type PickRequried<T, K extends keyof T> = T & Required<Pick<T, K>>
const computedText: {
  canvas?: SampleCanvas
  context?: SamepleRenderContext
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
  computedText.context!.font = `${styles['font-weight'] | 500} ${styles['font-size']}px sans-serif`
  if (styles.width === undefined) {
    const width = computedText.context!.measureText(content).width
    return {
      textWidth: width,
      lines: [{ sites: [[0, content.length - 1, content]] as [number, number, string][], content }],
      flatLines: [content]
    }
  } else {
    const baseNum = Math.floor(styles.width / styles['font-size'])
    const width = styles.width - (styles['box-sizing'] === 'content-box' ? 0 : padding[1] + padding[3])
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
const getMarginOrPadding = (str?: NOS): number[] => {
  let matchNum: number[] = [0, 0, 0, 0]
  if (typeof str === 'string') {
    const reg = /\b(?:([\d.]+)([a-zA-Z]+)?)|auto\b/g
    const matches = str.match(reg)
    if (matches) {
      const len = matches.length
      matchNum = matches.map(e => (e === 'auto' ? 0 : getRealValue(e)))
      if (len === 3) {
        matchNum = [matchNum[0], matchNum[1], matchNum[2], matchNum[1]]
      } else if (len === 2) {
        matchNum = [matchNum[0], matchNum[1], matchNum[0], matchNum[1]]
      } else if (len === 1) {
        matchNum = Array(4).fill(matchNum[0])
      }
    }
    return matchNum
  } else if (str === undefined) {
    return matchNum
  } else {
    return Array(4).fill(str)
  }
}

const getBorderOption = (str: NOS) => {
  const reg = /^([\d.]+(?:[a-zA-Z]+)?)\s+(solid)\s+(\S[\s\S]+)$/
  if (typeof str === 'string') {
    str = getRealValue(str)
    if (typeof str === 'string' && reg.test(str)) {
      const match = reg.exec(str)
      return [getRealValue(match![1]), match![2], match![3]] as [number, string, string]
    } else {
      return null
    }
  } else {
    return null
  }
}
type RectAndStyleType = {
  rect: ReturnType<typeof initRectAndStyle>['rect']
  style: ReturnType<typeof coverStyles2RealValue>
}
const parseFlex = (flexStr: string) => {
  let grow = 0
  let shrink = 0
  let basis = 'auto'
  if (flexStr) {
    let m = /^[\d.]+$/.exec(flexStr)
    if (m !== null) {
      grow = +flexStr
    } else if (((m = /^[\d.]+[a-zA-Z%]+$/.exec(flexStr)), m !== null)) {
      basis = getRealValue(flexStr)
    } else if (((m = /^([\d.]+)\s+([a-zA-Z0-9.%]+)$/.exec(flexStr)), m !== null)) {
      grow = +m[1]
      m = /^([\d.]+)?([a-zA-Z%]+)?$/.exec(m[2])
      if (m !== null) {
        if (m[2]) {
          basis = getRealValue(m[0])
        } else if (m[1] && !m[2]) {
          shrink = +m[1]
        }
      }
    } else if (((m = /^([\d.]+)\s+([a-zA-Z0-9.%]+)\s+([a-zA-Z0-9.%]+)$/.exec(flexStr)), m !== null)) {
      grow = +m[1]
      shrink = +m[2]
      m = /^([\d.]+)?([a-zA-Z%]+)?$/.exec(m[3])
      if (m !== null) {
        if (m[2]) {
          basis = getRealValue(m[0])
        }
      }
    }
  }
  return { grow, shrink, basis }
}

const initRectAndStyle = (layout: DrawLayout, parentRAT?: RectAndStyleType) => {
  const { styles } = layout
  const style = coverStyles2RealValue(styles)

  const margin = getMarginOrPadding(style.margin)
  const padding = getMarginOrPadding(style.padding)
  const rect = ReactCompute.reactive({
    index: undefined,
    contentWidth: undefined,
    contentHeight: undefined,
    isFlex: false,
    isFlexItem: false,
    styleWidth: undefined,
    styleHeight: undefined,
    flexBasis: undefined,
    flexGrow: undefined,
    flexShrink: undefined,
    precentValues: {},
    width: 0,
    height: 0,
    left: undefined,
    top: undefined,
    right: undefined,
    bottom: undefined,
    computedMarginLeft: undefined,
    margin,
    padding,
    paddintWidth: padding[1] + padding[3],
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
      parentStyle: RectAndStyleType['style']
      precentValues: { [k in 'width' | 'height']?: number }
    },
    'parentRect'
  >()
  if (/flex$/.test(layout.styles.display || '')) {
    rect.isFlex = true
  }
  if (parentRAT) {
    if (parentRAT.rect.isFlex) {
      const { grow, shrink, basis } = parseFlex(style.flex || '')
      rect.flexGrow = grow
      rect.flexShrink = shrink
      rect.flexBasis = basis
      rect.isFlexItem = true
    }
    rect.parentRect = parentRAT.rect
    rect.parentStyle = parentRAT.style
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
  if (typeof style.width === 'number') {
    rect.styleWidth = style.width
  } else if (precentStrReg.test(style.width || '')) {
    rect.precentValues.width = +precentStrReg.exec(style.width!)![1] / 100
  }
  if (typeof style.height === 'number') {
    rect.styleHeight = style.height
  } else if (precentStrReg.test(style.height || '')) {
    rect.precentValues.height = +precentStrReg.exec(style.height!)![1] / 100
  }

  return {
    rect, // 未计算padding的宽高
    style
  }
}
interface FlexItemBaseProp {
  sizeLength: number
  styleLength: number
  contentLength: number
  borderBox: boolean
  overflow: boolean
  padding: number
  flexGrow: number
  flexShrink: number
  precentLength: number
  originPrecentLength: number
  fixedLength: number
}
type FlexItemProp = PickRequried<Partial<FlexItemBaseProp>, 'flexGrow' | 'flexShrink'>
export const getFlexLayout = (arr: FlexItemProp[], flexBoxInitLength?: number, isColumn?: boolean) => {
  let flexLength = 0
  const precentArr: PickRequried<FlexItemProp, 'precentLength'>[] = []
  const fixedArr: PickRequried<FlexItemProp, 'fixedLength'>[] = []
  const flexArr: PickRequried<FlexItemProp, 'styleLength' | 'contentLength'>[] = []
  let paddingContentSum = 0
  let paddingBorderSum = 0
  const marginSum = 0
  arr = arr.map(e => {
    e = { ...e }
    if (e.padding) {
      if (e.borderBox) {
        paddingBorderSum += e.padding
      } else {
        paddingContentSum += e.padding
      }
    }
    if (e.precentLength !== undefined) {
      precentArr.push(e as typeof precentArr[0])
      if (isColumn && flexBoxInitLength === undefined) {
        e.originPrecentLength = e.precentLength
        e.precentLength = 0
      }
    } else if (e.styleLength === undefined && e.contentLength) {
      if (e.overflow) {
        flexArr.push(e as typeof flexArr[0])
      } else {
        e.fixedLength = e.contentLength
        fixedArr.push(e as typeof fixedArr[0])
      }
      flexLength += e.contentLength
    } else if (e.styleLength !== undefined) {
      flexArr.push(e as typeof flexArr[0])
      flexLength += e.styleLength
    }
    return e
  })
  flexLength += paddingContentSum + marginSum
  let restRoomLength = 0
  let shrinkLength = 0
  const computeRestRoomLength = () => {
    flexLength =
      fixedArr.map(e => e.fixedLength).reduce((a, b) => a + b, 0) +
      flexArr.map(e => e.styleLength || e.contentLength).reduce((a, b) => a + b, 0) +
      paddingContentSum +
      marginSum
    flexBoxLength = flexBoxInitLength || flexLength
    restRoomLength =
      precentArr.map(e => e.precentLength * flexBoxLength).reduce((a, b) => a + b, 0) + flexLength - flexBoxLength
    if (restRoomLength > 0) {
      shrinkLength = [
        ...precentArr.map(
          e => (e.precentLength * flexBoxLength - (e.borderBox && e.padding ? e.padding : 0)) * e.flexShrink
        ),
        ...flexArr.map(
          e => ((e.styleLength || e.contentLength) - (e.borderBox && e.padding ? e.padding : 0)) * e.flexShrink
        )
      ].reduce((a, b) => a + b, 0)
    }
  }
  let flexBoxLength = flexBoxInitLength || flexLength
  computeRestRoomLength()
  if (restRoomLength < 0) {
    // grow
  } else {
    const _flexArr: typeof flexArr = []
    const paddingArr: PickRequried<FlexItemProp, 'padding'>[] = []
    let flexChanged = true
    let needComputeRestRoom = false
    while (flexChanged) {
      if (needComputeRestRoom) {
        computeRestRoomLength()
      } else {
        needComputeRestRoom = true
      }
      flexArr.forEach(e => {
        const item = e.styleLength || e.contentLength || 0
        const padding = e.borderBox ? e.padding || 0 : 0
        const maxItem = Math.max(item, padding)
        e.sizeLength = item - (((maxItem - padding) * e.flexShrink) / shrinkLength) * restRoomLength
        if (e.borderBox && e.padding && e.sizeLength < e.padding) {
          paddingArr.push(e as typeof paddingArr[0])
        } else if (!e.overflow && e.contentLength && e.contentLength > e.sizeLength) {
          e.fixedLength =
            e.styleLength !== undefined && e.styleLength < e.contentLength ? e.styleLength : e.contentLength
          fixedArr.push(e as typeof fixedArr[0])
        } else {
          _flexArr.push(e)
        }
      })
      if (flexArr.length !== _flexArr.length) {
        flexArr.splice(0, flexArr.length, ..._flexArr)
        _flexArr.length = 0
        continue
      } else {
        flexChanged = false
      }
      precentArr.forEach(e => {
        const item = e.precentLength! * flexBoxLength
        const padding = e.borderBox ? e.padding || 0 : 0
        const maxItem = Math.max(item, padding)
        e.sizeLength = item - (((maxItem - padding) * e.flexShrink) / shrinkLength) * restRoomLength
        if (e.borderBox && e.padding && e.sizeLength < e.padding) {
          paddingArr.push(e as typeof paddingArr[0])
        }
      })
      fixedArr.forEach(e => {
        e.sizeLength = e.fixedLength
      })
    }
  }
  return arr.map(e => {
    if (!e.borderBox && e.padding) {
      e.sizeLength! += e.padding
    }
    return e
  })
}

const computeFlexRect = (layout: ComputedLayout) => {
  if (layout.rect.isFlex) {
    let flexWidth = 0
    if (layout.children && layout.children.length) {
      const percentGroup: ComputedLayout[] = []
      const fixedGroup: ComputedLayout[] = []
      const flexGroup: ComputedLayout[] = []
      layout.children
        .filter(e => e.styles.position !== 'absolute')
        .forEach(e => {
          if (typeof e.styles.width === 'string') {
            if (e.styles.width === 'auto') {
              if (e.styles.overflow === 'hidden' || e.styles.overflow === 'auto') {
                flexGroup.push(e)
              } else {
                fixedGroup.push(e)
              }
            } else if (layout.rect.precentValues.width !== undefined) {
              percentGroup.push(e)
            }
          } else if (e.styles.width) {
            flexGroup.push(e)
          }
        })
      flexWidth = [...flexGroup, ...fixedGroup]
        .map(e => (e.rect.contentWidth || 0) + e.rect.padding[1] + e.rect.padding[3])
        .reduce((a, b) => a + b)
      if (layout.rect.styleWidth) {
        layout.rect.contentWidth = layout.rect.styleWidth
      } else {
        layout.rect.contentWidth = flexWidth
      }
      const fw = flexWidth
      const cw = layout.rect.contentWidth
      const sub_pg = percentGroup.map(e => e.rect.precentValues.width!).reduce((a, b) => a + b)
      const sub_fixed = fixedGroup
        .map(e => (e.rect.contentWidth || 0) + e.rect.padding[1] + e.rect.padding[3])
        .reduce((a, b) => a + b)
      const restWidth = cw * sub_pg + fw + sub_fixed - cw
      if (restWidth > 0) {
        // shrink
        percentGroup.forEach(e => {})
      }
    } else {
      layout.rect.contentWidth = layout.rect.styleWidth || 0
    }
    console.log(559, flexWidth)
  }
}

const mergeRect = (layout: ComputedLayout) => {
  if (layout.children && layout.children.length) {
    const isInline = layout.rect.isFlexItem ? false : /^inline-/.test(layout.styles.display || '')
    if (layout.rect.isFlex) {
      computeFlexRect(layout)
    } else {
      layout.rect.width = mergeSize('width', layout)
      layout.rect.height = mergeSize('height', layout)
    }
  } else {
    if (typeof layout.rect.styleWidth === 'number') {
      if (!layout.rect.contentWidth) {
        layout.rect.contentWidth = layout.rect.styleWidth
      }
    } else if (typeof layout.rect.styleWidth === 'string') {
      if (layout.rect.precentValues.width !== undefined) {
        if (!layout.rect.isFlexItem) {
          ReactCompute.compute(layout.rect, 'contentWidth', () => {
            if (layout.rect.parentRect && layout.rect.parentRect.contentWidth) {
              return (
                (layout.styles.position !== 'absolute'
                  ? layout.rect.parentRect.contentWidth
                  : layout.rect.parentRect.contentWidth +
                    layout.rect.parentRect.padding[1] +
                    layout.rect.parentRect.padding[3]) * +layout.rect.precentValues.width!
              )
            } else {
              return 0
            }
          })
        }
      }
    }
  }
}

type LayoutRect = ReturnType<typeof initRectAndStyle>['rect']
interface ComputedLayout extends PickRequried<DrawLayout, 'rect'> {
  styles: ReturnType<typeof initRectAndStyle>['style']
  children?: ComputedLayout[]
}
const mergeSize = (valType: 'width' | 'height', layout: ComputedLayout) => {
  let val = layout.styles[valType]
  const needReducePadding = val === undefined ? false : layout.styles['box-sizing'] !== 'content-box'
  const mi = valType === 'width' ? [3, 1] : [0, 2]
  const getChildrenSubSize = (type: 'width' | 'height', children?: ComputedLayout[]) => {
    const isWidth = type === 'width'
    if (children && children.length) {
      const len = children.length
      let res = 0
      const md = isWidth ? [3, 1] : [0, 2]
      children.forEach((e, i) => {
        const lv =
          ((isWidth ? e.rect.contentWidth : e.rect.contentHeight) || 0) +
          (isWidth ? e.rect.padding[1] + e.rect.padding[3] : e.rect.padding[0] + e.rect.padding[2])
        if (i === 0) {
          res += lv + e.rect.margin[md[0]]
        } else {
          res +=
            lv +
            (isWidth
              ? e.rect.margin[md[0]] + layout.children![i - 1].rect.margin[md[1]]
              : Math.max(e.rect.margin[md[0]], layout.children![i - 1].rect.margin[md[1]]))
        }
        if (i === len! - 1) {
          res += e.rect.margin[md[1]]
        }
      })
      return res
    } else {
      return 0
    }
  }
  if (val === undefined) {
    const filterChildren = layout.children && layout.children.filter(e => e.styles.position !== 'absolute')
    const len = filterChildren && filterChildren.length
    if (valType === 'height') {
      val = getChildrenSubSize('height', filterChildren)
      if (valType === 'height' && layout.type === 'view' && layout.content) {
        val += layout.rect.contentHeight || 0
      }
    } else {
      const groups: ComputedLayout[][] = []
      let tempLineWidth = 0
      let tempMarginRight = 0
      if (filterChildren && len) {
        filterChildren.forEach(e => {
          if ([undefined, 'block', 'flex'].includes(e.styles.display)) {
            e.rect.index = groups.length
            groups.push([e])
          } else {
            if (!groups.length || !groups[groups.length - 1].length) {
              groups.push([])
              tempLineWidth = (e.rect.width || 0) + e.rect.padding[1] + e.rect.padding[3] + e.rect.margin[3]
              tempMarginRight = e.rect.margin[1]
            } else {
              if (layout.rect.width !== undefined) {
                const localWidth = (e.rect.width || 0) + e.rect.padding[1] + e.rect.padding[3]
                const maxMargin = Math.max(tempMarginRight, e.rect.margin[3])
                if (tempLineWidth + maxMargin + localWidth + e.rect.margin[1] > layout.rect.width) {
                  groups.push([])
                  tempLineWidth = localWidth + e.rect.margin[3]
                } else {
                  tempLineWidth += localWidth + maxMargin
                  e.rect.computedMarginLeft = maxMargin
                }
                tempMarginRight = e.rect.margin[1]
              }
            }
            e.rect.index = groups.length - 1
            groups[groups.length - 1].push(e)
          }
        })
      }
      val = Math.max(
        ...groups
          .filter(e => e.length)
          .map(e => {
            if (e.length === 1) {
              const itemRect = e[0].rect
              return (
                (itemRect.width || 0) +
                itemRect.padding[1] +
                itemRect.padding[3] +
                itemRect.margin[1] +
                itemRect.margin[3]
              )
            } else {
              return getChildrenSubSize('width', e)
            }
          })
      )
    }
  }
  if (needReducePadding && typeof val === 'number') {
    val -= layout.rect.padding[mi[0]] + layout.rect.padding[mi[1]]
  }
  return val as number
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

const getLayoutRect = (layout: ComputedLayout) => {
  if (layout.children && layout.children.length) {
    let left = layout.rect.padding[3]
    let top = layout.rect.padding[0]
    let tempMarginBottom = 0
    const k = ['top', 'left', 'right', 'bottom'] as ('top' | 'left' | 'right' | 'bottom')[]
    const groups: { layouts: ComputedLayout[]; type: 'absolute' | 'inline' | 'block' }[] = []
    let lastIndex = -1
    layout.children.forEach(item => {
      if (item.styles.position === 'absolute') {
        groups.push({ layouts: [item], type: 'absolute' })
      } else if ([undefined, 'block', 'flex'].includes(item.styles.display)) {
        groups.push({ layouts: [item], type: 'block' })
        lastIndex = item.rect.index!
      } else {
        if (item.rect.index !== lastIndex) {
          groups.push({ layouts: [item], type: 'inline' })
        } else {
          groups[groups.length - 1].layouts.push(item)
        }
      }
      getLayoutRect(item)
    })
    groups.map(item => {
      if (item.type === 'absolute') {
        const el = item.layouts[0]
        k.forEach(e => {
          if (el.styles[e] !== undefined) {
            el.rect[e] = el.styles[e]
          }
        })
      } else if (item.type === 'block') {
        const el = item.layouts[0]
        left = layout.rect.padding[3]
        if (el.rect.margin[1] === 0 && el.rect.margin[3] === 0 && layout.styles.width && layout.rect.width) {
          el.rect.left = left + (layout.rect.width - (el.rect.width || 0) - el.rect.padding[1] - el.rect.padding[3]) / 2
        } else {
          el.rect.left = left + el.rect.margin[3]
        }
        tempMarginBottom = Math.max(tempMarginBottom, el.rect.margin[0])
        el.rect.top = top + tempMarginBottom
        top = top + tempMarginBottom + el.rect.height + el.rect.padding[0] + el.rect.padding[2]
        tempMarginBottom = el.rect.margin[2]
      } else {
        left = layout.rect.padding[3]
        const tempLineHeight = Math.max(
          ...item.layouts.map(
            e => e.rect.height + e.rect.padding[0] + e.rect.padding[2] + e.rect.margin[0] + e.rect.margin[2]
          )
        )
        item.layouts.forEach(el => {
          el.rect.left = left + (el.rect.computedMarginLeft || 0)
          left = el.rect.left + (el.rect.width || 0) + el.rect.padding[3] + el.rect.padding[1]
          el.rect.top =
            top +
            tempMarginBottom +
            (tempLineHeight - el.rect.height - el.rect.padding[0] - el.rect.padding[2] - el.rect.margin[2])
        })
        top = top + tempMarginBottom + tempLineHeight
        tempMarginBottom = 0
      }
    })
  }
  return layout
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
  canvas: SampleCanvas
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
const drawItem = async (canvas: SampleCanvas, ctx: any, layout: ComputedLayout, parentLeft = 0, parentTop = 0) => {
  parentLeft += layout.rect.left || 0
  parentTop += layout.rect.top || 0
  if (layout.type === 'view') {
    if (layout.styles.background) {
      if (Array.isArray(layout.styles.background)) {
        const bgWidth = (layout.rect.width || 0) + layout.rect.padding[1] + layout.rect.padding[3]
        const bgHeight = layout.rect.height + layout.rect.padding[2] + layout.rect.padding[0]
        const bgCanvas = windowInfo.createCanvas!(true, bgWidth * windowInfo.dpr, bgHeight * windowInfo.dpr)
        const bgCtx = bgCanvas.getContext('2d')
        bgCtx.scale(windowInfo.dpr, windowInfo.dpr)

        if (layout.styles['border-radius']) {
          const width = bgWidth
          const height = bgHeight

          const borderRadius = getMarginOrPadding(layout.styles['border-radius'])
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
                if (isVertical(startPostionIndex)) {
                  bgCtx.fillRect(0, startHeight, bgWidth, bgHeight - startHeight - endHeight)
                } else {
                  bgCtx.fillRect(startWidth, 0, bgWidth - startWidth - endWidth, bgHeight)
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
        if (layout.styles['border-radius']) {
          const width = (layout.rect.width || 0) + layout.rect.padding[1] + layout.rect.padding[3]
          const height = layout.rect.height + layout.rect.padding[0] + layout.rect.padding[2]

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
        }
      }
    }
    if (layout.content) {
      ctx.font = `${layout.styles['font-style'] || ''} ${layout.styles['font-weight'] || ''} ${
        layout.styles['font-size']
      }px/${layout.styles['line-height']}px PingFangSC-Medium, "PingFang SC", sans-serif`
      ctx.fillStyle = layout.styles.color
      const offsetX = {
        left: 0,
        center: (layout.rect.width || 0) / 2,
        right: layout.rect.width || 0
      }
      ctx.textAlign = layout.styles['text-align'] || 'left'
      ctx.textBaseline = 'bottom'
      const offsetY = -(layout.styles['line-height']! - layout.styles['font-size']!) / 2
      if (layout.textLines) {
        // ctx.strokeRect(parentLeft + layout.rect.padding[3], parentTop + layout.rect.padding[0], layout.rect.width, layout.styles['line-height'])
        let lines = [...layout.textLines]
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
            parentLeft + layout.rect.padding[3] + offsetX[ctx.textAlign as keyof typeof offsetX] || 0,
            parentTop + layout.rect.padding[0] + (i + 1) * layout.styles['line-height']! + offsetY,
            layout.rect.width
          )
        })
      } else {
        // ctx.strokeRect(parentLeft + layout.rect.padding[3], parentTop + layout.rect.padding[0], layout.rect.width, layout.styles['line-height'])
        ctx.fillText(
          layout.content,
          parentLeft + layout.rect.padding[3] + offsetX[ctx.textAlign as keyof typeof offsetX] || 0,
          parentTop + layout.rect.padding[0] + layout.styles['line-height']! + offsetY,
          layout.rect.width
        )
      }
    }
  } else if (layout.type === 'img' && layout.content) {
    const bgWidth = (layout.rect.width || 0) + layout.rect.padding[1] + layout.rect.padding[3]
    const bgHeight = layout.rect.height + layout.rect.padding[2] + layout.rect.padding[0]
    const bgCanvas = windowInfo.createCanvas!(true, bgWidth * windowInfo.dpr, bgHeight * windowInfo.dpr)
    const bgCtx = bgCanvas.getContext('2d')
    bgCtx.scale(windowInfo.dpr, windowInfo.dpr)

    if (layout.styles['border-radius']) {
      const width = bgWidth
      const height = bgHeight

      const borderRadius = getMarginOrPadding(layout.styles['border-radius'])
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
      bgCtx.drawImage(image, 0, 0, layout.rect.width!, layout.rect.height || (layout.rect.width! * height) / width)
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
    const contentWidth = (layout.rect.width || 0) + layout.rect.padding[1] + layout.rect.padding[3]
    const contentHeight = layout.rect.height + layout.rect.padding[0] + layout.rect.padding[2]
    for (const item of layout.children) {
      if (item.styles.position === 'absolute') {
        item.rect.left =
          item.rect.left === undefined
            ? contentWidth - item.rect.right! - item.rect.width! - item.rect.padding[1] - item.rect.padding[3]
            : item.rect.left
        item.rect.top =
          item.rect.top === undefined
            ? contentHeight - item.rect.bottom! - item.rect.height! - item.rect.padding[0] - item.rect.padding[2]
            : item.rect.top
      }
      await drawItem(canvas, ctx, item, parentLeft, parentTop)
    }
  }
}
export const draw = async (layout: DrawLayout) => {
  const layoutRect = getLayoutRect(parseLayout(layout))
  const rootWidth = (layoutRect.rect.width || 0) + layoutRect.rect.padding[1] + layoutRect.rect.padding[3]
  const rootHeight = layoutRect.rect.height + layoutRect.rect.padding[2] + layoutRect.rect.padding[0]
  const canvas = windowInfo.createCanvas!(true, rootWidth * windowInfo.dpr, rootHeight * windowInfo.dpr)
  const ctx = canvas.getContext('2d')
  ctx.scale(windowInfo.dpr, windowInfo.dpr)
  await drawItem(canvas, ctx, layoutRect)
  return { canvas, width: rootWidth, height: rootHeight }
  /* return await new Promise<{ path: string; width: number; height: number }>(resolve => {
    wx.canvasToTempFilePath({
      canvas,
      success: res =>
        resolve({ path: res.tempFilePath, width: rootWidth * windowInfo.dpr, height: rootHeight * windowInfo.dpr })
    })
  }) */
}
/*
eg: draw(testLayout)
*/
/*export const testLayout: DrawLayout = {
  type: 'view',
  content: '',
  styles: {
    width: '750rpx',
    'border-radius': '15rpx',
    background: [
      {
        image: 'url(https://image.brightfuture360.com/static/temple/practice-together/canvas/background-0-0.png)',
        position: 'top',
      },
      {
        color: '#f3c992'
      },
      {
        image: 'url(https://image.brightfuture360.com/static/temple/practice-together/canvas/background-0-1.png)',
        position: 'bottom',
      }]
  },
  children: [
    {
      type: 'img',
      content: 'https://image.brightfuture360.com/static/temple/practice-together/canvas/title-dktj.png',
      styles: {
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
        "border-radius": '25rpx',
        background: 'rgba(207, 146, 83, 0.8)',
        margin: '19rpx auto 0',
        "font-size": '25rpx',
        "font-weight": 500,
        color: '#fff7cf',
        "line-height": '50rpx',
        "text-align": 'center'
      }
    },
    {
      type: 'view',
      content: `收到大家发心恭送：
大悲咒40遍
莲师心咒88遍

共同虔诚回向：


详细数量统计（遍）：
大悲咒——合计：40
1、张三10
2、李四30

莲师心咒——合计：88
1、张三8
2、李四80

统计日期：
2022-03-09`,
      styles: {
        "white-space": 'wrap',
        margin: '38rpx auto 0',
        width: '673rpx',
        padding: '58rpx',
        "font-size": '31rpx',
        "font-weight": 500,
        "line-height": '50rpx',
        color: '#222220',
        background: [
          {
            image: 'url(https://image.brightfuture360.com/static/temple/practice-together/canvas/box-0-0.png)',
            position: 'top',
          },
          {
            image: 'url(https://image.brightfuture360.com/static/temple/practice-together/canvas/box-0-1.png)',
            repeat: 'repeat-y',
          },
          {
            image: 'url(https://image.brightfuture360.com/static/temple/practice-together/canvas/box-0-2.png)',
            position: 'bottom'
          }
        ]
      }
    },
    {
      type: 'view',
      content: '大德寺共修打卡',
      styles: {
        "font-size": '35rpx',
        "font-weight": 500,
        color: '#4d2607',
        "line-height": '48rpx',
        margin: '58rpx 0 0 50rpx'
      }
    },
    {
      type: 'view',
      content: '扫码加入小组，一起共修打卡',
      styles: {
        "font-size": '25rpx',
        "font-weight": 400,
        color: '#7d3d0a',
        "line-height": '35rpx',
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
        "border-radius": '8rpx'
      }
    }
  ]
}

*/
