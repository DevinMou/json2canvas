/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

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
type PrependTuple<A, T extends Array<any>> = ((a: A, ...b: T) => void) extends (...a: infer I) => void ? I : []

type SpecifiedLengthTuple<T, N extends number, L extends Array<any> = []> = {
  true: L
  false: SpecifiedLengthTuple<T, N, PrependTuple<T, L>>
}[L['length'] extends N ? 'true' : 'false']
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
    _current?: any
    _resolve: null | ((value: void | PromiseLike<void>) => void)
    _compute: (value?: any, oldValue?: any) => void
    trigger: (value: any, oldValue?: any) => void
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
  compute: <T extends object | InstanceType<ProxyConstructor>, K extends keyof T>(
    obj: T,
    prop: K,
    valFn: () => any
  ) => object
  /* watch: <T extends object | InstanceType<ProxyConstructor>, K extends keyof T>(
    obj: T,
    prop: K,
    watchFn: (value: T[K], oldValue?: T[K]) => any,
    watchOption?: { immediate: boolean; deep: boolean }
  ) => void */
  watch: (
    fn: () => any,
    callBack: (val: any, oldValue?: any) => void,
    watchOption?: { immediate?: boolean; deep?: boolean }
  ) => void
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
              target[listenerProp].push(_this._computer_proxy)
            }
            return target[prop as string]
          },
          set(target, prop, value) {
            const oldValue = target[prop as string]
            target[prop as keyof typeof target] = value
            const listenerProp = `_listener_${prop.toString()}`
            if (target[listenerProp]) {
              target[listenerProp].forEach((item: NonNullable<ReactComputeType['_computer_proxy']>) => {
                item.trigger(value, oldValue)
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
    obj = _this.reactive(obj) as typeof obj
    const computer: NonNullable<ReactComputeType['_computer_proxy']> = {
      _current: undefined,
      _resolve: null as null | ((value: void | PromiseLike<void>) => void),
      _compute() {
        const current = valFn()
        if (current !== this._current) {
          this._current = current
          obj[prop] = current
        }
      },
      trigger(value, oldValue) {
        if (value === oldValue) {
          return
        }
        if (!this._resolve) {
          new Promise<void>(resolve => {
            this._resolve = resolve
          }).then(() => {
            this._resolve = null
            this._compute(value, oldValue)
          })
        }
        this._resolve!()
      }
    }
    _this._computer_proxy = computer
    computer._compute()
    _this._computer_proxy = null
    return obj
  },
  /* watch(obj, prop, valFn, watchOption = { immediate: false, deep: false }) {
    const _this = ReactCompute
    obj = _this.reactive(obj)
    const computer: NonNullable<ReactComputeType['_computer_proxy']> = {
      _current: undefined,
      _resolve: null as null | ((value: void | PromiseLike<void>) => void),
      _compute(value, oldValue) {
        if (value !== oldValue) {
          valFn(value, oldValue)
        }
      },
      trigger(value, oldValue) {
        if (!this._resolve) {
          new Promise<void>(resolve => {
            this._resolve = resolve
          }).then(() => {
            this._resolve = null
            this._compute(value, oldValue)
          })
        }
        this._resolve!()
      }
    }
    _this._computer_proxy = computer
    const currentValue = obj[prop as keyof typeof obj]
    if (watchOption.immediate) {
      computer._compute(currentValue, undefined)
    }
    _this._computer_proxy = null
    return obj
  }, */
  watch(watchFn, callBackFn, watchOption) {
    watchOption = Object.assign({ immediate: false, deep: false }, watchOption)
    const _this = ReactCompute
    const computer: NonNullable<ReactComputeType['_computer_proxy']> = {
      _current: undefined,
      _resolve: null as null | ((value: void | PromiseLike<void>) => void),
      _compute: watchFn,
      trigger() {
        if (!this._resolve) {
          new Promise<void>(resolve => {
            this._resolve = resolve
          }).then(() => {
            this._resolve = null
            const current = this._compute()
            if (current !== this._current) {
              callBackFn(current, this._current)
              this._current = current
            }
          })
        }
        this._resolve!()
      }
    }
    _this._computer_proxy = computer
    const currentValue = computer._compute()
    if (watchOption.immediate) {
      callBackFn(currentValue, undefined)
    }
    _this._computer_proxy = null
    return
  }
}

// matrix tool
type Matrix = number[][]
type Vector = number[]
function getMRC(A: (number | number[])[]) {
  // get matrix number of row and column
  if (Array.isArray(A)) {
    const row = A.length
    const isVector = !Array.isArray(A[0])
    const col = isVector ? 1 : (A[0] as number[]).length
    const err = A.find(e => +!isVector ^ +Array.isArray(e) || (!isVector && Array.isArray(e) && e.length !== col))
    if (err) {
      return [null, null]
    } else {
      if (isVector) {
        A.forEach((e, i) => (A[i] = [e as number]))
      }
      return [row, col]
    }
  } else {
    return [null, null]
  }
}
function dot(A: Vector, B: Vector) {
  return A.reduce((a, b, c) => ((a += b * B[c]), a), 0)
}
function transpose(A: Matrix) {
  const [ra, ca] = getMRC(A)
  if (ra !== null) {
    return Array(ca)
      .fill(1)
      .map((e, i) => A.map(t => t[i]))
  } else {
    return null
  }
}

function MT(A: Matrix, B: Matrix) {
  // matrix time
  const [ra, ca] = getMRC(A)
  const [rb] = getMRC(B)
  if (ra !== null && rb !== null) {
    if (ca === rb) {
      const BT = transpose(B)
      if (BT) {
        return Array(ra)
          .fill(1)
          .map((e, i) => BT.map(b => dot(b, A[i])))
      } else {
        return null
      }
    }
  }
  return null
}
//

const precentStrReg = /^([\d.]+)%$/
type IsSameType<T, K> = [T] extends [K] ? ([K] extends [T] ? true : false) : false
export type PickKeyByValueType<T extends Record<string, any>, K> = {
  [k in keyof T]: IsSameType<T[k], K> extends true ? k : never
}[keyof T]
type NOS = number | string
export type SampleCanvasType<T extends boolean = false> = SampleCanvas.Canvas<T>
export type SampleImageType = SampleImage
const windowInfo: Record<string, unknown> & {
  dpr: number
  unit: {
    [k: string]: number
  }
  createCanvas?: {
    <T extends boolean>(isOffScreen: false): SampleCanvas.Canvas<T>
    <T extends boolean>(isOffScreen: true, width?: number, height?: number): SampleCanvas.Canvas<T>
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
        case 'deg':
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
  computedText.context!.font = `${styles['font-weight'] | 500} ${styles['font-size']}px sans-serif`
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
const getBorderArr = (style: Partial<DrawStyles>) => {
  let borderArr: (ReturnType<typeof getBorderOption> | null)[] = [null, null, null, null]
  const r = /^border(?:-(top|left|bottom|right))?$/
  const karr = ['top', 'left', 'bottom', 'right']
  for (const k in style) {
    if (r.test(k)) {
      const v = style[k as keyof DrawStyles] as NOS
      const m = r.exec(k)![1]
      if (m) {
        borderArr[karr.indexOf(m)] = getBorderOption(v)
      } else {
        const item = getBorderOption(v)
        borderArr = borderArr.map(() => (item ? [...item] : item))
      }
    }
  }
  return borderArr
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
const val2XY = (valArr: NOS[], parentValWidth: number, parentValHeight: number) => {
  const res = {
    x: 0,
    y: 0
  }
  valArr.forEach((item, index) => {
    if (typeof item === 'number') {
      if (index === 0) {
        res.x = item
        res.y = item
      }
      if (index === 1) {
        res.y = item
      }
    } else if (precentStrReg.test(item || '')) {
      const pv = +precentStrReg.exec(item)![1]
      if (index === 0) {
        res.x = (parentValWidth * pv) / 100
        res.y = (parentValHeight * pv) / 100
      }
      if (index === 1) {
        res.y = (parentValHeight * pv) / 100
      }
    }
  })
  return res
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
const parseLengthStr = (str: NOS, unit = 'px') => {
  const reg = /^((?:[+-])?(?:\d\.)+)(\w+)$/
  if (typeof str === 'string') {
    const m = reg.exec(str)
    if (m !== null) {
      return {
        value: +m[1],
        unit: m[2]
      }
    } else {
      return {
        value: 0,
        unit: ''
      }
    }
  } else {
    return {
      value: str,
      unit
    }
  }
}
const parseFlex = (flexStr: string) => {
  let grow = 0
  let shrink = 1
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
interface FlexItemBaseProp {
  sizeLength: number
  styleLength: number
  contentLength: number
  borderBox: boolean
  overflow: boolean
  padding: number
  margin: number
  flexGrow: number
  flexShrink: number
  precentLength: number
  originPrecentLength: number
  fixedLength: number
  layout: ComputedLayout
}
type FlexItemProp = PickRequried<Partial<FlexItemBaseProp>, 'flexGrow' | 'flexShrink' | 'layout'>
export const setFlexSizeLength = (
  arr: FlexItemProp[],
  flexBoxInitLength?: number,
  isColumn?: boolean,
  isWrap?: boolean
) => {
  let flexLength = 0
  const precentArr: PickRequried<FlexItemProp, 'precentLength'>[] = []
  const fixedArr: PickRequried<FlexItemProp, 'fixedLength'>[] = []
  const flexArr: PickRequried<FlexItemProp, 'styleLength' | 'contentLength'>[] = []
  let paddingContentSum = 0
  let paddingBorderSum = 0
  let marginSum = 0
  arr.forEach(e => {
    // e = { ...e }
    if (e.padding) {
      if (e.borderBox) {
        paddingBorderSum += e.padding
      } else {
        paddingContentSum += e.padding
      }
    }
    if (e.margin) {
      marginSum += e.margin
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
  })
  flexLength += paddingContentSum + marginSum
  let restRoomLength = 0
  let shrinkLength = 0
  const computeRestRoomLength = () => {
    flexBoxLength = flexBoxInitLength || flexLength
    restRoomLength =
      precentArr.map(e => e.precentLength * flexBoxLength).reduce((a, b) => a + b, 0) +
      fixedArr.map(e => e.fixedLength).reduce((a, b) => a + b, 0) +
      flexArr.map(e => e.styleLength || e.contentLength).reduce((a, b) => a + b, 0) +
      paddingContentSum +
      marginSum -
      flexBoxLength
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
  if (restRoomLength <= 0) {
    // grow
    const growSum = arr.map(e => e.flexGrow).reduce((a, b) => a + b, 0)
    ;[
      ...precentArr.map(e => {
        e.sizeLength = e.precentLength * flexBoxLength
        return e
      }),
      ...flexArr.map(e => {
        e.sizeLength = e.styleLength || e.contentLength
        return e
      }),
      ...fixedArr.map(e => {
        e.sizeLength = e.fixedLength
        return e
      })
    ].forEach(e => {
      e.sizeLength =
        e.sizeLength! + (e.borderBox ? 0 : e.padding || 0) - (growSum ? (restRoomLength * e.flexGrow) / growSum : 0)
    })
  } else {
    if (isWrap) {
      const groups: FlexItemProp[][] = [[]]
      let tempLength = 0
      arr.forEach(item => {
        const flexItemLength =
          (item.precentLength !== undefined
            ? item.precentLength * flexBoxLength
            : item.styleLength || item.contentLength!) +
          (item.borderBox ? 0 : item.padding || 0) +
          (item.margin || 0)
        if (flexItemLength + tempLength > flexBoxLength) {
          tempLength = 0
          groups.push([])
        }
        tempLength += flexItemLength
        groups[groups.length - 1].push(item)
        item.layout.rect.crossIndex = groups.length - 1
      })
      groups.forEach(group => setFlexSizeLength(group, flexBoxLength, isColumn))
    } else {
      const _flexArr: typeof flexArr = []
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
            e.fixedLength = e.padding
            fixedArr.push(e as typeof fixedArr[0])
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
        }
        const precentArrLength = precentArr.length
        precentArr.splice(
          0,
          precentArr.length,
          ...precentArr.filter(e => {
            const item = e.precentLength! * flexBoxLength
            const padding = e.borderBox ? e.padding || 0 : 0
            const maxItem = Math.max(item, padding)
            e.sizeLength = item - (((maxItem - padding) * e.flexShrink) / shrinkLength) * restRoomLength
            if (e.borderBox && e.padding && e.sizeLength < e.padding) {
              e.fixedLength = e.padding
              fixedArr.push(e as typeof fixedArr[0])
              return false
            } else {
              return true
            }
          })
        )
        if (precentArrLength !== precentArr.length) {
          continue
        }
        fixedArr.forEach(e => {
          e.sizeLength = e.fixedLength
        })
        flexChanged = false
      }
    }
  }
  return {
    flexBoxLength,
    children: arr.map(e => {
      if (!e.borderBox && e.padding) {
        e.sizeLength! += e.padding
      }
      return e
    })
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
              contentLength => resolve(contentLength)
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

type LayoutRect = ReturnType<typeof initRectAndStyle>['rect']
interface ComputedLayout extends PickRequried<DrawLayout, 'rect'> {
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
            const childrenWidths = contentWidthArr.slice(1)
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
            if (!widthBySelf || !item.rect.isInline || !lastIsInline) {
              levels.push({
                isInline: item.rect.isInline,
                widthBySelf,
                children: []
              })
            }
            levels[levels.length - 1].children.push(item)
            item.rect.crossIndex = levels.length - 1
            lastIsInline = widthBySelf ? item.rect.isInline : false
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
              .filter(item => item.widthBySelf)
              .map(({ children: level }) =>
                level.map(item => item.rect.boxWidth! + item.rect.marginWidth).reduce((a, b) => a + b, 0)
              )
          )
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
type PositionKey = typeof positionKeys[number]
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
        const newLine = item.rect.crossIndex !== tempCrossIndex
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
      value: {
        deg: number
      }
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
          const angle = (transform.value.deg * Math.PI) / 180
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
        const xtan = Math.tan((transform.value.x * Math.PI) / 180)
        const ytan = Math.tan((transform.value.y * Math.PI) / 180)
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

function createMatrix2(transforms: TransformType[]) {
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
const drawItem = async (
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
  if (layout.rect.transform) {
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
          const width = (layout.rect.boxWidth || 0) + layout.rect.padding[1] + layout.rect.padding[3]
          const height = layout.rect.boxHeight! + layout.rect.padding[0] + layout.rect.padding[2]

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
        }
      }
    }
    if (layout.content) {
      ctx.font = `${layout.styles['font-style'] || ''} ${layout.styles['font-weight'] || ''} ${
        layout.styles['font-size']
      }px/${layout.styles['line-height']}px PingFangSC-Medium, "PingFang SC", sans-serif`
      ctx.fillStyle = layout.styles.color!
      const offsetX = {
        left: 0,
        center: (layout.rect.boxWidth || 0) / 2,
        right: layout.rect.boxWidth || 0
      }
      ctx.textAlign = layout.styles['text-align'] || 'left'
      ctx.textBaseline = 'bottom'
      const offsetY = -(layout.styles['line-height']! - layout.styles['font-size']!) / 2
      if (layout.textLines) {
        // ctx.strokeRect(parentLeft + layout.rect.padding[3], parentTop + layout.rect.padding[0], layout.rect.boxWidth, layout.styles['line-height'])
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
            layout.rect.boxWidth
          )
        })
      } else {
        // ctx.strokeRect(parentLeft + layout.rect.padding[3], parentTop + layout.rect.padding[0], layout.rect.boxWidth, layout.styles['line-height'])
        ctx.fillText(
          layout.content,
          parentLeft + layout.rect.padding[3] + offsetX[ctx.textAlign as keyof typeof offsetX] || 0,
          parentTop + layout.rect.padding[0] + layout.styles['line-height']! + offsetY,
          layout.rect.boxWidth
        )
      }
    }
  } else if (layout.type === 'img' && layout.content) {
    const bgWidth = (layout.rect.boxWidth || 0) + layout.rect.padding[1] + layout.rect.padding[3]
    const bgHeight = layout.rect.boxHeight! + layout.rect.padding[2] + layout.rect.padding[0]
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
    const contentWidth = (layout.rect.boxWidth || 0) + layout.rect.padding[1] + layout.rect.padding[3]
    const contentHeight = layout.rect.boxHeight! + layout.rect.padding[0] + layout.rect.padding[2]
    const normalChildren: ComputedLayout[] = []
    const transformChildren: ComputedLayout[] = []
    const zIndexChildren: ComputedLayout[] = []
    layout.children.forEach(item => {
      if (item.styles.position === undefined) {
        if (item.rect.transform) {
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
      if (item.styles.position === 'absolute') {
        item.rect.left =
          item.rect.left === undefined
            ? contentWidth - item.rect.right! - item.rect.boxWidth! - item.rect.padding[1] - item.rect.padding[3]
            : item.rect.left
        item.rect.top =
          item.rect.top === undefined
            ? contentHeight - item.rect.bottom! - item.rect.boxHeight! - item.rect.padding[0] - item.rect.padding[2]
            : item.rect.top
      }
      await drawItem(canvas, ctx, item, parentLeft, parentTop)
    }
  }
  if (layout.rect.transform) {
    const originX = layout.rect.transformOrigin.xPrecent
      ? (layout.rect.boxWidth! * layout.rect.transformOrigin.x) / 100
      : layout.rect.transformOrigin.x
    const originY = layout.rect.transformOrigin.yPrecent
      ? (layout.rect.boxHeight! * layout.rect.transformOrigin.y) / 100
      : layout.rect.transformOrigin.y
    const transform = layout.rect.transform
      .map(item => {
        switch (item.type) {
          case 'translate': {
            const value = val2XY(item.value, layout.rect.boxWidth!, layout.rect.boxHeight!)
            return {
              type: item.type,
              value: {
                x: value.x / windowInfo.dpr,
                y: value.y / windowInfo.dpr
              }
            }
          }
          case 'scale':
            return {
              type: item.type,
              value: {
                x: +item.value[0] * windowInfo.dpr,
                y: +(item.value.length > 1 ? item.value[1] : item.value[0]) * windowInfo.dpr
              }
            }
          case 'rotate':
            return {
              type: item.type,
              value: {
                deg: parseLengthStr(item.value[0]).value
              }
            }
          case 'skew':
            return {
              type: item.type,
              value: {
                x: parseLengthStr(item.value[0]).value,
                y: item.value.length > 1 ? parseLengthStr(item.value[1]) : 0
              }
            }
          default:
            return null
        }
      })
      .filter(item => item) as TransformType[]
    const matrix = createMatrix([
      {
        type: 'translate',
        value: { x: tempParentLeft + originX, y: tempParentTop + originY }
      },
      ...transform
    ])
    parentCtx.transform(...matrix)
    parentCtx.drawImage(
      canvas,
      -originX / windowInfo.dpr,
      -originY / windowInfo.dpr,
      canvas.width / windowInfo.dpr,
      canvas.height / windowInfo.dpr
    )
    parentCtx.setTransform(windowInfo.dpr, 0, 0, windowInfo.dpr, 0, 0)
  }
}
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
    return { canvas, width: rootWidth, height: rootHeight }
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
