import { ComputedLayout, windowInfo } from '..'
import { BoxDir, LayoutRect } from '../lib/rect'
import { NOS, SpecifiedLengthTuple } from './type'

export const percentStrReg = /^([+-]?[\d.]+)%$/
export const lengthReg = /^((?:[+-])?[\d\.]+)([a-zA-Z%]+)?$/
export const colorKeyWordRGB: { [k: string]: SpecifiedLengthTuple<number, 4> } = {
  aliceblue: [240, 248, 255, 1],
  antiquewhite: [250, 235, 215, 1],
  aqua: [0, 255, 255, 1],
  aquamarine: [127, 255, 212, 1],
  azure: [240, 255, 255, 1],
  beige: [245, 245, 220, 1],
  bisque: [255, 228, 196, 1],
  black: [0, 0, 0, 1],
  blanchedalmond: [255, 235, 205, 1],
  blue: [0, 0, 255, 1],
  blueviolet: [138, 43, 226, 1],
  brown: [165, 42, 42, 1],
  burlywood: [222, 184, 135, 1],
  cadetblue: [95, 158, 160, 1],
  chartreuse: [127, 255, 0, 1],
  chocolate: [210, 105, 30, 1],
  coral: [255, 127, 80, 1],
  cornflowerblue: [100, 149, 237, 1],
  cornsilk: [255, 248, 220, 1],
  crimson: [220, 20, 60, 1],
  cyan: [0, 255, 255, 1],
  darkblue: [0, 0, 139, 1],
  darkcyan: [0, 139, 139, 1],
  darkgoldenrod: [184, 134, 11, 1],
  darkgray: [169, 169, 169, 1],
  darkgreen: [0, 100, 0, 1],
  darkgrey: [169, 169, 169, 1],
  darkkhaki: [189, 183, 107, 1],
  darkmagenta: [139, 0, 139, 1],
  darkolivegreen: [85, 107, 47, 1],
  darkorange: [255, 140, 0, 1],
  darkorchid: [153, 50, 204, 1],
  darkred: [139, 0, 0, 1],
  darksalmon: [233, 150, 122, 1],
  darkseagreen: [143, 188, 143, 1],
  darkslateblue: [72, 61, 139, 1],
  darkslategray: [47, 79, 79, 1],
  darkturquoise: [0, 206, 209, 1],
  darkviolet: [148, 0, 211, 1],
  deeppink: [255, 20, 147, 1],
  deepskyblue: [0, 191, 255, 1],
  dimgray: [105, 105, 105, 1],
  dodgerblue: [30, 144, 255, 1],
  firebrick: [178, 34, 34, 1],
  floralwhite: [255, 250, 240, 1],
  forestgreen: [34, 139, 34, 1],
  fuchsia: [255, 0, 255, 1],
  gainsboro: [220, 220, 220, 1],
  ghostwhite: [248, 248, 255, 1],
  gold: [255, 215, 0, 1],
  goldenrod: [218, 165, 32, 1],
  gray: [128, 128, 128, 1],
  green: [0, 128, 0, 1],
  greenyellow: [173, 255, 47, 1],
  honeydew: [240, 255, 240, 1],
  hotpink: [255, 105, 180, 1],
  indianred: [205, 92, 92, 1],
  indigo: [75, 0, 130, 1],
  ivory: [255, 255, 240, 1],
  khaki: [240, 230, 140, 1],
  lavender: [230, 230, 250, 1],
  lavenderblush: [255, 240, 245, 1],
  lawngreen: [124, 252, 0, 1],
  lemonchiffon: [255, 250, 205, 1],
  lightblue: [173, 216, 230, 1],
  lightcoral: [240, 128, 128, 1],
  lightcyan: [224, 255, 255, 1],
  lightgoldenrodyellow: [250, 250, 210, 1],
  lightgray: [211, 211, 211, 1],
  lightgreen: [144, 238, 144, 1],
  lightpink: [255, 182, 193, 1],
  lightsalmon: [255, 160, 122, 1],
  lightseagreen: [32, 178, 170, 1],
  lightskyblue: [135, 206, 250, 1],
  lightslategray: [119, 136, 153, 1],
  lightsteelblue: [176, 196, 222, 1],
  lightyellow: [255, 255, 224, 1],
  lime: [0, 255, 0, 1],
  limegreen: [50, 205, 50, 1],
  linen: [250, 240, 230, 1],
  magenta: [255, 0, 255, 1],
  maroon: [128, 0, 0, 1],
  mediumaquamarine: [102, 205, 170, 1],
  mediumblue: [0, 0, 205, 1],
  mediumorchid: [186, 85, 211, 1],
  mediumpurple: [147, 112, 219, 1],
  mediumseagreen: [60, 179, 113, 1],
  mediumslateblue: [123, 104, 238, 1],
  mediumspringgreen: [0, 250, 154, 1],
  mediumturquoise: [72, 209, 204, 1],
  mediumvioletred: [199, 21, 133, 1],
  midnightblue: [25, 25, 112, 1],
  mintcream: [245, 255, 250, 1],
  mistyrose: [255, 228, 225, 1],
  moccasin: [255, 228, 181, 1],
  navajowhite: [255, 222, 173, 1],
  navy: [0, 0, 128, 1],
  oldlace: [253, 245, 230, 1],
  olive: [128, 128, 0, 1],
  olivedrab: [107, 142, 35, 1],
  orange: [255, 165, 0, 1],
  orangered: [255, 69, 0, 1],
  orchid: [218, 112, 214, 1],
  palegoldenrod: [238, 232, 170, 1],
  palegreen: [152, 251, 152, 1],
  paleturquoise: [175, 238, 238, 1],
  palevioletred: [219, 112, 147, 1],
  papayawhip: [255, 239, 213, 1],
  peachpuff: [255, 218, 185, 1],
  peru: [205, 133, 63, 1],
  pink: [255, 192, 203, 1],
  plum: [221, 160, 221, 1],
  powderblue: [176, 224, 230, 1],
  purple: [128, 0, 128, 1],
  red: [255, 0, 0, 1],
  rosybrown: [188, 143, 143, 1],
  royalblue: [65, 105, 225, 1],
  saddlebrown: [139, 69, 19, 1],
  salmon: [250, 128, 114, 1],
  sandybrown: [244, 164, 96, 1],
  seagreen: [46, 139, 87, 1],
  seashell: [255, 245, 238, 1],
  sienna: [160, 82, 45, 1],
  silver: [192, 192, 192, 1],
  skyblue: [135, 206, 235, 1],
  slateblue: [106, 90, 205, 1],
  slategray: [112, 128, 144, 1],
  snow: [255, 250, 250, 1],
  springgreen: [0, 255, 127, 1],
  steelblue: [70, 130, 180, 1],
  tan: [210, 180, 140, 1],
  teal: [0, 128, 128, 1],
  thistle: [216, 191, 216, 1],
  tomato: [255, 99, 71, 1],
  transparent: [0, 0, 0, 0],
  turquoise: [64, 224, 208, 1],
  violet: [238, 130, 238, 1],
  wheat: [245, 222, 179, 1],
  white: [255, 255, 255, 1],
  whitesmoke: [245, 245, 245, 1],
  yellow: [255, 255, 0, 1],
  yellowgreen: [154, 205, 50, 1]
}

const colorFnNames = ['rgb', 'rgba', 'hsl', 'hsla'] as const

export class LengthParseObj {
  source: NOS = ''
  value = 0
  unit = ''
  constructor(params?: Partial<LengthParseObj>) {
    Object.assign(this, params)
  }
  compute() {
    if (!this.unit) {
      return this.value
    } else {
      return this
    }
  }
}

export const parseLengthStr = (str: NOS, unit = '') => {
  const res = new LengthParseObj()
  res.source = str
  if (typeof str === 'string') {
    const m = lengthReg.exec(str)
    if (m !== null) {
      res.value = +m[1]
      res.unit = m[2]
    }
  } else {
    res.value = str
    res.unit = unit
  }
  return res
}
export const getLengthValue = (lengthStr: NOS | ReturnType<typeof parseLengthStr>, parentLength: number = 0) => {
  const { value, unit } = typeof lengthStr === 'object' ? lengthStr : parseLengthStr(lengthStr)
  let res = 0
  if (unit === '%') {
    res = (value * parentLength) / 100
  } else if (unit in windowInfo.unit) {
    res = value * windowInfo.unit[unit]
  } else if (!unit) {
    res = value
  }
  return res
}

export const getRealValue = <T extends NOS = NOS>(val: NOS): T => {
  let res = val
  if (typeof val === 'number') {
    !0
  } else if (typeof val === 'string') {
    if (val !== 'auto') {
      const lengthObj = parseLengthStr(val)
      if (lengthObj.unit in windowInfo.unit) {
        res = getLengthValue(lengthObj)
      } else if (lengthObj.unit === undefined) {
        res = lengthObj.value
      }
    }
  }
  return res as T
}

export const isAngleStr = (str: string) => {
  const res = parseLengthStr(str)
  if (['deg'].includes(res.unit)) {
    return res
  } else {
    return null
  }
}

export const getBorderRadius = (str?: NOS): number[] => {
  let matchNum: number[] = [0, 0, 0, 0]
  if (typeof str === 'string') {
    const reg = /\b(?:([+-]?[\d.]+)([a-zA-Z]+)?)|auto\b/g
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

const lengthAstFnType = ['calc', 'min', 'max'] as const

export const getBorderRadiusByAst = (rect: LayoutRect): Record<'x' | 'y', number>[] => {
  const radius = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 }
  ]
  if (rect.styleSplits['border-radius']) {
    const xRadius: AstFn['params'] = []
    const yRadius: AstFn['params'] = []
    let isX = true
    rect.styleSplits['border-radius'].forEach(item => {
      if (item === '/') {
        isX = false
      } else if (isX) {
        xRadius.push(item)
      } else {
        yRadius.push(item)
      }
    })
    if (xRadius.length && !yRadius.length) {
      yRadius.push(...xRadius)
    }
    const xRadiusVals = xRadius.map(item => {
      if (item instanceof LengthParseObj) {
        return getLengthValue(item, rect.boxWidth)
      } else if (item instanceof AstFn && item.fn && lengthAstFnType.includes(item.type)) {
        return item.fn<number>(rect.boxWidth!)
      } else {
        return 0
      }
    })
    const yRadiusVals = yRadius.map(item => {
      if (item instanceof LengthParseObj) {
        return getLengthValue(item, rect.boxWidth)
      } else if (item instanceof AstFn && item.fn && lengthAstFnType.includes(item.type)) {
        return item.fn<number>(rect.boxWidth!)
      } else {
        return 0
      }
    })
    const setRadius = (d: 'x' | 'y') => {
      const radiusVals = d === 'x' ? xRadiusVals : yRadiusVals
      switch (radiusVals.length) {
        case 1:
          radius[0][d] = radiusVals[0]
          radius[1][d] = radiusVals[0]
          radius[2][d] = radiusVals[0]
          radius[3][d] = radiusVals[0]
          break
        case 2:
          radius[0][d] = radiusVals[0]
          radius[2][d] = radiusVals[0]
          radius[1][d] = radiusVals[1]
          radius[3][d] = radiusVals[1]
          break
        case 3:
          radius[0][d] = radiusVals[0]
          radius[1][d] = radiusVals[1]
          radius[2][d] = radiusVals[2]
          radius[3][d] = radiusVals[1]
          break
        case 4:
          radius[0][d] = radiusVals[0]
          radius[1][d] = radiusVals[1]
          radius[2][d] = radiusVals[2]
          radius[3][d] = radiusVals[3]
          break
      }
    }
    setRadius('x')
    setRadius('y')
  }
  return radius
}

export const getBorderArr = (style: Partial<DrawStyles>) => {
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

export const getBorderByAst = (
  styleSplits: ComputedLayout['rect']['styleSplits']
): Record<BoxDir, { style: string; color: string; width: number }> => {
  const rect = { styleSplits } as ComputedLayout['rect']
  const defaultColor = getColorByAstItem(windowInfo.checkInherit(rect, 'color')![0]) || 'rgba(0, 0, 0, 1)'
  const defaultValue = {
    style: '',
    color: defaultColor,
    width: 0
  }
  const parseBorder = (params?: AstFn['params']) => {
    const res = { ...defaultValue }
    if (!params) {
      return res
    }
    params.forEach(item => {
      const color = getColorByAstItem(item)
      if (color) {
        res.color = color
      } else if (item instanceof LengthParseObj) {
        res.width = getLengthValue(item)
      } else if (typeof item === 'string') {
        res.style = item
      }
    })
    return res
  }
  const border: Record<BoxDir, ReturnType<typeof parseBorder>> = {
    top: { ...defaultValue },
    right: { ...defaultValue },
    bottom: { ...defaultValue },
    left: { ...defaultValue }
  }
  for (let k of Object.keys(rect.styleSplits) as (keyof DrawStyles)[]) {
    const params = rect.styleSplits[k]
    switch (k) {
      case 'border':
        border.top = parseBorder(params)
        border.right = { ...border.top }
        border.bottom = { ...border.top }
        border.left = { ...border.top }
        break
      case 'border-left':
        border.left = parseBorder(params)
        break
      case 'border-right':
        border.right = parseBorder(params)
        break
      case 'border-top':
        border.top = parseBorder(params)
        break
      case 'border-bottom':
        border.bottom = parseBorder(params)
        break
    }
  }
  return border
}

export const getBorderOption = (str: NOS) => {
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

const rgb2Hsl = (r: number, g: number, b: number) => {
  const rgbToLightness = (r: number, g: number, b: number) => (1 / 2) * (Math.max(r, g, b) + Math.min(r, g, b))

  const rgbToSaturation = (r: number, g: number, b: number) => {
    const L = rgbToLightness(r, g, b)
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    return L === 0 || L === 1 ? 0 : (max - min) / (1 - Math.abs(2 * L - 1))
  }
  const rgbToHue = (r: number, g: number, b: number) =>
    Math.round((Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180) / Math.PI)
  const lightness = rgbToLightness(r, g, b)
  const saturation = rgbToSaturation(r, g, b)
  const hue = rgbToHue(r, g, b)
  return [hue, saturation, lightness]
}

export const hsl2Rgb = (h: number, s: number, l: number) => {
  const C = (1 - Math.abs(2 * l - 1)) * s
  const hPrime = h / 60
  const X = C * (1 - Math.abs((hPrime % 2) - 1))
  const m = l - C / 2
  const withLight = (r: number, g: number, b: number) => [r + m, g + m, b + m]
  if (hPrime <= 1) {
    return withLight(C, X, 0)
  } else if (hPrime <= 2) {
    return withLight(X, C, 0)
  } else if (hPrime <= 3) {
    return withLight(0, C, X)
  } else if (hPrime <= 4) {
    return withLight(0, X, C)
  } else if (hPrime <= 5) {
    return withLight(X, 0, C)
  } else if (hPrime <= 6) {
    return withLight(C, 0, X)
  }
}
export const reg_hex = /^#([0-9a-fA-F]{3,8})$/
export const hex2rgba = (hex: string) => {
  const m = reg_hex.exec(hex)
  if (m !== null) {
    const val = m[1]
    if ([3, 4, 6, 8].includes(val.length)) {
      const hexArr: string[] = []
      switch (val.length) {
        case 3:
        case 4:
          val.split('').map(e => hexArr.push(e.repeat(2)))
          val.length === 3 && hexArr.push('ff')
          break
        case 6:
        case 8:
          hexArr.push(...(val.match(/\w{2}/g) || []))
          val.length === 6 && hexArr.push('ff')
          break
      }
      return hexArr.map((e, i) => (i === 3 ? parseInt(e, 16) / 255 : parseInt(e, 16))) as SpecifiedLengthTuple<
        number,
        4
      >
    } else {
      return null
    }
  } else {
    return null
  }
}

const getType = (e: any) => {
  return Object.prototype.toString.call(e).slice(8, -1).toLocaleLowerCase('zh-CN')
}

export const compareObject = (objA: any, objB: any) => {
  const ta = getType(objA)
  const tb = getType(objB)
  if (objA && objB && ta === tb && ['object', 'array'].includes(ta)) {
    if (ta === 'array') {
      if (objA.length === objB.length) {
        let same = true
        for (let index = 0; index < objA.length; index++) {
          const item = objA[index]
          if (!compareObject(item, objB[index])) {
            same = false
            break
          }
        }
        return same
      }
    } else {
      const keysA = Object.keys(objA)
      const keysB = Object.keys(objB)
      if (keysA.length === keysB.length) {
        let same = true
        for (const k in objA) {
          if (!compareObject(objA[k], objB[k])) {
            same = false
            break
          }
        }
        return same
      } else {
        return false
      }
    }
  } else {
    return objA === objB
  }
}

export const isNonNullable = <T>(val: T): val is NonNullable<T> => val !== null && val !== undefined

export class AstItem {
  type: string = ''
  value: string = ''
  children?: AstItem[]
  parentSign?: AstItem
  constructor(params: Partial<AstItem>) {
    Object.assign(this, params)
  }
}

export const parseStr2Ast = (str: string) => {
  const rootSign = new AstItem({
    type: 'root',
    value: '',
    children: []
  })
  let currentSign = rootSign
  const end_judge: {
    reg: RegExp
    fn?: () => void
  }[] = []
  let temp = ''
  let pureStr = false
  const appendWord = () => {
    if (temp) {
      currentSign.children?.push(
        new AstItem({
          type: 'word',
          value: temp,
          children: []
        })
      )
      temp = ''
    }
  }
  const index = {
    value: 0
  }
  for (; index.value < str.length; index.value++) {
    const chart = str.charAt(index.value)
    if (pureStr) {
      if (chart === (currentSign.type === 'string1' ? "'" : '"')) {
        currentSign.value = temp
        currentSign = currentSign.parentSign!
        temp = ''
        pureStr = false
      } else {
        temp += chart
      }
    } else {
      if (end_judge[0] && end_judge[0].reg.test(chart)) {
        if (end_judge[0].fn) {
          end_judge[0].fn()
        } else if (temp) {
          currentSign.value = temp
          temp = ''
        }
        end_judge.shift()
      } else {
        switch (chart) {
          case '(':
            currentSign = new AstItem({
              type: 'function',
              value: temp,
              children: [],
              parentSign: currentSign
            })
            temp = ''
            currentSign.parentSign?.children?.push(currentSign)
            end_judge.unshift({
              reg: /\)/,
              fn: () => {
                appendWord()
                if (currentSign.parentSign) {
                  currentSign = currentSign.parentSign
                }
              }
            })
            break
          case ' ':
            if (/^\s+$/.test(temp)) {
              temp += chart
            } else {
              appendWord()
              temp += chart
              currentSign = new AstItem({
                type: 'space',
                value: '',
                parentSign: currentSign
              })
              currentSign.parentSign?.children?.push(currentSign)
              end_judge.unshift({
                reg: /\S/,
                fn: () => {
                  currentSign.value = temp
                  temp = ''
                  index.value--
                  if (currentSign.parentSign) {
                    currentSign = currentSign.parentSign
                  }
                }
              })
            }
            break
          case "'":
            appendWord()
            currentSign = new AstItem({
              type: 'string1',
              value: '',
              parentSign: currentSign
            })
            currentSign.parentSign?.children?.push(currentSign)
            pureStr = true
            break
          case '"':
            appendWord()
            currentSign = new AstItem({
              type: 'string2',
              value: '',
              parentSign: currentSign
            })
            currentSign.parentSign?.children?.push(currentSign)
            pureStr = true
            break
          case '/':
            appendWord()
            currentSign.children?.push(
              new AstItem({
                type: '/',
                value: '',
                parentSign: currentSign
              })
            )
            break
          case ',':
            appendWord()
            currentSign.children?.push(
              new AstItem({
                type: ',',
                value: '',
                parentSign: currentSign
              })
            )
            break
          default:
            temp += chart
        }
      }
    }
  }
  appendWord()
  return rootSign
}

export class AstFn {
  type: string = ''
  params: (string | AstFn | LengthParseObj)[] = []
  _params?: (AstFn | LengthParseObj)[] = []
  parent?: AstFn
  fn?: <T = number>(length: number) => T
  constructor(params: Partial<AstFn>) {
    Object.assign(this, params)
  }
}

export const parseAstItem2AstFnAndStr = (ast: AstItem, parent?: AstFn) => {
  if (ast.type.startsWith('string')) {
    return ast.value
  } else if (ast.type === 'word') {
    return ast.value
  } else if (ast.type === 'function') {
    const match_fn: AstFn = new AstFn({
      type: ast.value,
      params: [],
      parent
    })
    match_fn.params = ast
      .children!.filter(item => item.type !== 'space')
      .map(e => parseAstItem2AstFnAndStr(e, match_fn))
    return match_fn
  } else {
    return ast.type
  }
}

export const parseFnParams = (fnItem: AstFn): AstFn | LengthParseObj => {
  let _params: (AstFn | LengthParseObj)[] = []
  const execFn = (e: (typeof _params)[number], length: number) =>
    e instanceof AstFn ? e.fn!(length) : getLengthValue(e, length)
  fnItem.params = fnItem.params.map(item => (item instanceof AstFn ? parseFnParams(item) : item))
  switch (fnItem.type) {
    case 'calc':
      if (fnItem.params.length === 3) {
        if (typeof fnItem.params[1] === 'string' && /\+|-|\*|\//.test(fnItem.params[1])) {
          const vals = [fnItem.params[0], fnItem.params[2]]
          if (!vals.find(e => typeof e === 'string' && !lengthReg.test(e))) {
            const parsedVals = vals.map(e => (typeof e === 'string' ? parseLengthStr(e) : e))
            if (parsedVals[0] instanceof LengthParseObj && parsedVals[1] instanceof LengthParseObj) {
              if (/\+|-/.test(fnItem.params[1]) && parsedVals[0].unit === parsedVals[1].unit) {
                return new LengthParseObj({
                  value: parsedVals[0].value + (fnItem.params[1] === '-' ? -1 : 1) * parsedVals[1].value,
                  unit: parsedVals[0].unit
                })
              } else if (/\*|\//.test(fnItem.params[1]) && !parsedVals[1].unit) {
                if (fnItem.params[1] === '*' || parsedVals[1].value) {
                  return new LengthParseObj({
                    value:
                      fnItem.params[1] === '*'
                        ? parsedVals[0].value * parsedVals[1].value
                        : parsedVals[0].value / parsedVals[1].value,
                    unit: parsedVals[0].unit
                  })
                } else {
                  // error
                }
              }
            }
            fnItem._params = parsedVals
            fnItem.fn = <T = number>(length: number) => {
              const vals = [fnItem._params![0], fnItem._params![1]].map(e => execFn(e, length)) as [number, number]
              let res = 0
              switch (fnItem.params[1]) {
                case '+':
                  res = vals[0] + vals[1]
                  break
                case '-':
                  res = vals[0] - vals[1]
                  break
                case '*':
                  res = vals[0] * vals[1]
                  break
                case '/':
                  res = vals[1] ? vals[0] / vals[1] : 0
                  break
              }
              return res as T
            }
          }
        }
      } else if (fnItem.params.length === 1) {
        const _item = fnItem.params[0]
        if (typeof _item === 'string' && lengthReg.test(_item)) {
          return parseLengthStr(_item)
        } else if (_item instanceof AstFn) {
          return _item
        }
      }
      break
    case 'min':
    case 'max':
      fnItem.params = fnItem.params.filter(item => item !== ',')
      if (fnItem.params.length === 2) {
        if (!fnItem.params.find(e => typeof e === 'string' && !lengthReg.test(e))) {
          _params = fnItem.params.map(e => (typeof e === 'string' ? parseLengthStr(e) : e))
          if (_params[0] instanceof LengthParseObj && _params[1] instanceof LengthParseObj) {
            if (_params[0].unit === _params[1].unit) {
              return new LengthParseObj({
                value:
                  fnItem.type === 'min'
                    ? Math.min(_params[0].value, _params[1].value)
                    : Math.max(_params[0].value, _params[1].value),
                unit: _params[0].unit
              })
            }
          }
          fnItem._params = _params
          fnItem.fn = <T = number>(length: number) => {
            const vals = fnItem._params!.map(e => +execFn(e, length))
            return (fnItem.type === 'min' ? Math.min(...vals) : Math.max(...vals)) as T
          }
        }
      }
      break
    case 'rgb':
    case 'hsl':
    case 'rgba':
    case 'hsla':
      fnItem.fn = <T = number[]>(length: number) => {
        return fnItem.params
          .filter(item => (typeof item === 'string' ? ![',', '/'].includes(item) : true))
          .map(item => (item instanceof AstFn ? item.fn!(length) : +item)) as T
      }
      break
  }
  return fnItem
}

export const getLengthFnPercentAndFixed = (fn: NonNullable<AstFn['fn']>) => {
  const fixed = fn(0)
  const percent = fn(1) - fixed
  return {
    fixed,
    percent
  }
}

export const computeAstFnParam = (item: AstFn['params'][number] | undefined, length = 0, defaultVal = 0) => {
  let _item: typeof item | undefined
  if (item instanceof AstFn) {
    _item = parseFnParams(item)
  } else if (item instanceof LengthParseObj) {
    _item = item
  } else if (item && lengthReg.test(item)) {
    _item = item
  }
  if (_item) {
    return _item instanceof AstFn ? _item.fn!(length) : getLengthValue(_item, length)
  } else {
    return defaultVal
  }
}

function getColorByAstItem(
  astItem: AstFn['params'][number],
  needReturnArr: true
): SpecifiedLengthTuple<number, 4> | null
function getColorByAstItem(astItem: AstFn['params'][number], needReturnArr?: false): string | null
function getColorByAstItem(astItem: AstFn['params'][number], needReturnArr = false) {
  let rgba: SpecifiedLengthTuple<number, 4> | null = null
  if (astItem instanceof AstFn) {
    if (colorFnNames.includes(astItem.type) && astItem.fn) {
      rgba = astItem.fn(0)
    }
  } else if (typeof astItem === 'string') {
    if (reg_hex.test(astItem)) {
      rgba = hex2rgba(astItem)
    } else if (astItem in colorKeyWordRGB) {
      rgba = [...colorKeyWordRGB[astItem]]
    }
  }
  if (needReturnArr) {
    return rgba
  } else {
    return rgba ? `rgba(${rgba.join(',')})` : null
  }
}

export { getColorByAstItem }
