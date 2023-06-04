import { SpecifiedLengthTuple } from '../../util/type'
import { LayoutRect, SampleImageType, windowInfo } from '../..'
import {
  colorKeyWordRGB,
  compareObject,
  getLengthValue,
  hex2rgba,
  isAngleStr,
  isNonNullable,
  lengthReg,
  parseLengthStr,
  precentStrReg,
  reg_hex
} from '../../util/common'
import { ReactCompute } from '../../util/react_compute'
type LengthFn = (length: number) => number
type ParamItem = string | MatchFn
interface MatchFnBase {
  match: string
  type: string
  params: (ParamItem[] | string)[]
  index: number
  length: number
  level: number
  parent?: MatchFn
  fn?: (env: any) => number
}
interface MatchFnExtend extends MatchFnBase {
  type: 'rgb' | 'rgba' | 'hsl' | 'hsla'
  fn?: (env: any) => any
}

type MatchFn = MatchFnBase | MatchFnExtend

export const parseBackgroundShorthand = async (background: string, rect: LayoutRect) => {
  // bstr = 'url(https://xxx.xxx.xxx) no-repeat top/contain,linear-gradient(90deg, rgba(220,0,123,0.6), #fce5bd 80%, #fce1b6) no-repeat bottom/750px 200px,#ff0000'
  const pickUpFn = (str: string) => {
    const reg_fn = /([\w-]+)\(([^)(]*)\)/g
    const match_fn: MatchFn[][] = []
    let match_fn_complete = false
    let _str = str
    let fn_level = 0
    const parseParam = (param: ParamItem) => {
      if (typeof param === 'string') {
        param = param.trim()
        if (precentStrReg.test(param)) {
          const val = +precentStrReg.exec(param)![1]
          return (length: number) => (val * length) / 100
        } else {
          return getLengthValue(param)
        }
      } else {
        return param
      }
    }
    const parseFnParams = (fnItem: MatchFn) => {
      let _params: (LengthFn | MatchFn | string | number)[] = []
      const execFn = (e: (typeof _params)[number], length: number) =>
        typeof e === 'function' ? e(length) : typeof e === 'object' ? e.fn!(length) : getLengthValue(e, length)
      switch (fnItem.type) {
        case 'calc':
          _params = fnItem.params
            .flat()
            .map(item => {
              if (typeof item === 'string') {
                const m = /\s+\+\s+|\s+-\s+|\*|\//.exec(item)
                if (m !== null) {
                  return [item.slice(0, m.index).trim(), m[0].trim(), item.slice(m.index + m[0].length).trim()].filter(
                    e => e
                  )
                } else {
                  return item.trim()
                }
              } else {
                return item
              }
            })
            .flat()
            .map((e, i) => (i === 1 ? e : parseParam(e)))
          fnItem.fn = (length: number) => {
            const vals = [_params[0], _params[2]].map(e => execFn(e, length)) as [number, number]
            let res = 0
            switch (_params[1]) {
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
            return res
          }
          break
        case 'min':
        case 'max':
          _params = fnItem.params
            .flat()
            .filter(e => (typeof e === 'string' ? !!e.trim() : true))
            .map(e => parseParam(e))
          fnItem.fn = (length: number) => {
            const vals = _params.map(e => +execFn(e, length))
            return fnItem.type === 'min' ? Math.min(...vals) : Math.max(...vals)
          }
          break
        case 'rgb':
        case 'hsl':
        case 'rgba':
        case 'hsla':
          _params = fnItem.params
            .map(item => {
              if (typeof item === 'string') {
                return item.trim().split(/\s*\/\s*|\s+/)
              } else {
                return item
              }
            })
            .flat()
          fnItem.fn = (length: number) => {
            return _params.map(item => (typeof item === 'object' ? item.fn!(length) : +item))
          }
          break
      }
    }
    while (!match_fn_complete) {
      match_fn_complete = true
      match_fn[fn_level] = []
      _str = _str.replace(reg_fn, (...args) => {
        const [match, type, paramStr, index, _str] = args as [string, string, string, number, string]
        const paramsSplitOffsets: number[] = [-1]
        let _offset = -1
        while (
          paramStr &&
          ((_offset = paramStr.indexOf(',', paramsSplitOffsets[paramsSplitOffsets.length - 1] + 1)), _offset > -1)
        ) {
          paramsSplitOffsets.push(_offset)
        }
        paramsSplitOffsets.shift()
        const params = paramStr.split(',')
        match_fn_complete = false

        const item: MatchFn = { match, type, index, length: match.length, level: fn_level, params: [] }
        if (fn_level) {
          let offset = item.index + item.type.length + 1
          const paramsOffsetRangeArr: [number, number][] = []
          params.forEach((t, i) => {
            paramsOffsetRangeArr.push([offset, offset + t.length])
            offset += t.length + 1
            item.params[i] = t.trim()
          })
          match_fn[fn_level - 1].forEach(e => {
            if (e.index >= item.index && e.index + e.length <= item.index + item.length) {
              const _index = paramsOffsetRangeArr.findIndex(t => e.index >= t[0] && e.index + e.length <= t[1])
              if (_index > -1) {
                const _str$ = params[_index] as string
                const istart = e.index - paramsOffsetRangeArr[_index][0]
                const iend = istart + e.length
                item.params[_index] = [
                  _str$.slice(0, istart).replace(/^\s+/, ''),
                  e,
                  _str$.slice(iend).replace(/\s+$/, '')
                ].filter(t => t)
              }
              e.parent = item
            }
          })
        } else {
          item.params = params as unknown as (ParamItem[] | string)[]
        }
        parseFnParams(item)
        match_fn[fn_level].push(item)
        return '*'.repeat(match.length)
      })
      fn_level++
    }
    return {
      fn_arr: match_fn
        .flat()
        .filter(item => !item.parent)
        .sort((a, b) => a.index - b.index),
      replaceStr: _str
    }
  }

  const { fn_arr, replaceStr } = pickUpFn(background)
  let _offset = 0
  const splitByseparator = (str: string, separators: { [k: string]: boolean }) => {
    const res: string[] = []
    let item = ''
    for (let i = 0; i < str.length; i++) {
      const chart = str.charAt(i)
      if (chart in separators) {
        if (item) {
          res.push(item)
        }
        item = ''
        if (separators[chart]) {
          res.push(chart)
        }
      } else {
        item += chart
      }
    }
    if (item) {
      res.push(item)
    }
    return res
  }
  const separators = { ' ': false, ',': true, '/': true }
  const splitArr = fn_arr
    .map(item => [
      ...splitByseparator(replaceStr.slice(_offset, item.index), separators),
      ((_offset = item.index + item.length), item)
    ])
    .flat()
    .concat(...splitByseparator(replaceStr.slice(_offset), separators))
    .filter(item => item)
  const backgroundItemgroups = []
  const prop_names = [
    ['no-repeat', 'repeat-x', 'repeat-y', 'repeat'],
    ['top', 'left', 'right', 'bottom', 'center'],
    ['contain', 'cover', 'auto'],
    ['scroll', 'fixed', 'local'],
    ['border-box', 'padding-box', 'content-box', 'text']
  ]
  const prop_names_dist: { [k: string]: string } = Object.fromEntries(
    prop_names.map((e, i) => e.map(t => [t, ['repeat', 'position', 'size', 'attachment', 'clip_origin'][i]])).flat()
  )
  let tempDist: Partial<{
    color: string | MatchFn
    image: MatchFn
    size: (string | MatchFn)[]
    position: (string | MatchFn)[]
    repeat: 'no-repeat' | 'repeat-x' | 'repeat-y' | 'repeat'
    attachment: 'scroll' | 'fixed' | 'local'
    clip_origin: ('border-box' | 'padding-box' | 'content-box')[] // can not support 'text'
  }> = {}
  const tempDistArr = []
  let endNeedPush = false
  splitArr.forEach(item => {
    endNeedPush = true
    if (typeof item === 'string') {
      if (item in prop_names_dist) {
        const _prop = prop_names_dist[item]
        switch (_prop) {
          case 'size':
            tempDist.size = tempDist.size || []
            tempDist.size.push(item)
            break
          case 'position':
            tempDist.position = tempDist.position || []
            tempDist.position.push(item)
            break
          case 'repeat':
            tempDist.repeat = item as NonNullable<typeof tempDist.repeat>
            break
          case 'clip_origin':
            tempDist.clip_origin = tempDist.clip_origin || []
            tempDist.clip_origin.push(item as NonNullable<(typeof tempDist.clip_origin)[number]>)
            break
            break
          case 'attachment':
            tempDist.attachment = item as NonNullable<typeof tempDist.attachment>
            break
        }
      } else {
        if (item === ',') {
          tempDistArr.push(tempDist)
          endNeedPush = false
          tempDist = {}
        } else if (item === '/') {
          tempDist.size = tempDist.size || []
        } else if (lengthReg.test(item)) {
          if (tempDist.size) {
            tempDist.size.push(item)
          } else {
            tempDist.position = tempDist.position || []
            tempDist.position.push(item)
          }
        } else {
          tempDist.color = item
        }
      }
    } else {
      if (item.type === 'calc') {
        if (tempDist.size) {
          tempDist.size.push(item)
        } else {
          tempDist.position = tempDist.position || []
          tempDist.position.push(item)
        }
      } else if (['rgb', 'rgba', 'hls', 'hlsa'].includes(item.type)) {
        tempDist.color = item
      } else if (['url', 'linear-gradient'].includes(item.type)) {
        tempDist.image = item
      }
    }
  })
  if (endNeedPush) {
    tempDistArr.push(tempDist)
  }
  type BackgroundItem = {
    color?: string
    image?: {
      type: string
      params: (string | ParamItem[])[]
      el?: SampleImageType | SampleCanvas.Canvas
    }
    size?: {
      fit?: 'contain' | 'cover'
      width?: string
      height?: string
    }
    position: {
      x: number
      y: number
    }
    repeat?: 'no-repeat' | 'repeat-x' | 'repeat-y' | 'repeat'
    attachment?: 'scroll' | 'fixed' | 'local'
    clip: 'border-box' | 'padding-box' | 'content-box' // 'text'
    origin: 'border-box' | 'padding-box' | 'content-box'
  }
  await ReactCompute.watch(
    () => rect.contentWidth !== undefined && rect.contentHeight !== undefined,
    e => e,
    { immediate: true }
  )
  const backgroundCanvas = windowInfo.createCanvas!(true, rect.boxWidth, rect.boxHeight)
  const backgroundCtx = backgroundCanvas.getContext('2d')
  for (const item of tempDistArr.reverse()) {
    const backgroundItem = ReactCompute.reactive<BackgroundItem>(
      {
        clip: 'border-box',
        origin: 'padding-box',
        position: {
          x: 0,
          y: 0
        }
      },
      true
    ).value()
    if (item.image) {
      backgroundItem.image = ReactCompute.reactive({
        type: item.image.type,
        params: item.image.params,
        el: undefined
      }).value<
        never,
        {
          el: SampleImageType
        }
      >()
      if (item.image.type === 'url') {
        const el = windowInfo.createImage!()
        el.onload = () => {
          backgroundItem.image!.el = el
        }
        el.src = item.image.params[0] as string
      }
    }
    if (item.clip_origin && item.clip_origin.length) {
      backgroundItem.clip = item.clip_origin[0]
      backgroundItem.origin = item.clip_origin[0]
      if (item.clip_origin.length > 1) {
        backgroundItem.clip = item.clip_origin[1]
      }
    }
    if (item.color) {
      let rgba: SpecifiedLengthTuple<number, 4> | null = null
      if (typeof item.color === 'string') {
        if (reg_hex.test(item.color)) {
          rgba = hex2rgba(item.color)
        } else if (item.color in colorKeyWordRGB) {
          rgba = [...colorKeyWordRGB[item.color], 1]
        }
      } else if (['rgb', 'rgba', 'hsl', 'hsla'].includes(item.color.type)) {
        rgba = item.color.fn!(0)
      }
      if (rgba) {
        backgroundCtx.fillStyle = `rgba(${rgba.join(',')})`
        backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height)
      }
    } else if (item.image) {
      if (['url', 'linear-gradient'].includes(item.image.type)) {
        const backgroundRect = {
          clip: {
            width: 0,
            height: 0,
            top: 0,
            left: 0
          },
          origin: {
            width: 0,
            height: 0,
            top: 0,
            left: 0
          },
          image: {
            width: 0,
            height: 0,
            top: 0,
            left: 0,
            widthAuto: false,
            heightAuto: false,
            fit: ''
          }
        }
        backgroundRect.origin.width =
          backgroundItem.origin === 'content-box'
            ? rect.contentWidth!
            : backgroundItem.origin === 'padding-box'
            ? rect.contentWidth! + rect.paddingWidth
            : rect.boxWidth!
        backgroundRect.origin.height =
          backgroundItem.origin === 'content-box'
            ? rect.contentHeight!
            : backgroundItem.origin === 'padding-box'
            ? rect.contentHeight! + rect.paddingHeight
            : rect.boxHeight!
        backgroundRect.clip.width =
          backgroundItem.clip === 'content-box'
            ? rect.contentWidth!
            : backgroundItem.clip === 'padding-box'
            ? rect.contentWidth! + rect.paddingWidth
            : rect.boxWidth!
        backgroundRect.clip.height =
          backgroundItem.clip === 'content-box'
            ? rect.contentHeight!
            : backgroundItem.clip === 'padding-box'
            ? rect.contentHeight! + rect.paddingHeight
            : rect.boxHeight!
        const marginDist = {
          'border-box': [0, 0],
          'padding-box': [rect.border[3], rect.border[0]],
          'content-box': [rect.padding[3] + rect.border[3], rect.padding[0] + rect.border[0]]
        } as const
        backgroundRect.origin.left = marginDist[backgroundItem.origin!][0] - marginDist[backgroundItem.clip!][0]
        backgroundRect.origin.top = marginDist[backgroundItem.origin!][1] - marginDist[backgroundItem.clip!][1]
        backgroundRect.clip.left = marginDist[backgroundItem.clip!][0]
        backgroundRect.clip.top = marginDist[backgroundItem.clip!][1]

        if (item.size && item.size.length) {
          if (typeof item.size[0] === 'string') {
            if (lengthReg.test(item.size[0])) {
              backgroundRect.image.width = getLengthValue(item.size[0], backgroundRect.origin.width)
              if (item.size.length === 1) {
                backgroundRect.image.heightAuto = true
              }
            } else if (item.size[0] === 'auto') {
              backgroundRect.image.widthAuto = true
              if (item.size.length === 1) {
                backgroundRect.image.heightAuto = true
              }
            } else if (['cover', 'contain'].includes(item.size[0])) {
              backgroundRect.image.fit = item.size[0]
            }
          } else if (item.size[0].fn) {
            backgroundRect.image.width = item.size[0].fn(backgroundRect.origin.width)
            if (item.size.length === 1) {
              backgroundRect.image.heightAuto = true
            }
          }
          if (item.size[1]) {
            if (typeof item.size[1] === 'string') {
              if (lengthReg.test(item.size[1])) {
                backgroundRect.image.height = getLengthValue(item.size[1], backgroundRect.origin.height)
              } else if (item.size[1] === 'auto') {
                backgroundRect.image.heightAuto = true
              }
            } else if (item.size[1].fn) {
              backgroundRect.image.height = item.size[1].fn(backgroundRect.origin.height)
            }
          }
        } else {
          backgroundRect.image.widthAuto = true
          backgroundRect.image.heightAuto = true
        }
        const clipCanvas = windowInfo.createCanvas!(true, backgroundRect.clip.width, backgroundRect.clip.height)
        const clipCtx = clipCanvas.getContext('2d')
        if (item.image!.type === 'url') {
          await ReactCompute.watch(
            () => backgroundItem.image && backgroundItem.image.el,
            e => e,
            { immediate: true }
          )
          const imgWidth = backgroundItem.image!.el!.width
          const imgHeight = backgroundItem.image!.el!.height
          switch (backgroundRect.image.fit) {
            case 'cover':
              if (backgroundRect.origin.width / backgroundRect.origin.height > imgWidth / imgHeight) {
                backgroundRect.image.width = backgroundRect.origin.width
                backgroundRect.image.height = (imgHeight / imgWidth) * backgroundRect.origin.width
              } else {
                backgroundRect.image.height = backgroundRect.origin.height
                backgroundRect.image.width = (imgWidth / imgHeight) * backgroundRect.origin.height
              }
              break
            case 'contain':
              if (backgroundRect.origin.width / backgroundRect.origin.height > imgWidth / imgHeight) {
                backgroundRect.image.height = backgroundRect.origin.height
                backgroundRect.image.width = (imgWidth / imgHeight) * backgroundRect.origin.height
                // backgroundItem.position.x = (backgroundRect.origin.width - backgroundRect.image.width) / 2
              } else {
                backgroundRect.image.width = backgroundRect.origin.width
                backgroundRect.image.height = (imgHeight / imgWidth) * backgroundRect.origin.width
                // backgroundItem.position.y = (backgroundRect.origin.height - backgroundRect.image.height) / 2
              }
              break
          }
        } else {
          let gradientAngle = 0
          const param_1st = item.image!.params[0]
          let param_1st_is_angle = true
          const colorsGroup = [...item.image!.params]
          if (typeof param_1st === 'string') {
            const reg_dir = /to((?:\s+(?:top|bottom|left|right)){1,2})/
            if (reg_dir.test(param_1st)) {
              const angleDist = {
                top: 0,
                right: 90,
                bottom: 180,
                left: 270
              } as const
              const dir_x = ['left', 'right'] as const
              const dir_y = ['top', 'bottom'] as const
              const arr = reg_dir.exec(param_1st)![1].trim().split(/\s+/) as (keyof typeof angleDist)[]
              if (arr.length === 1) {
                gradientAngle = angleDist[arr[0]]
              } else if (arr.length === 2) {
                if (
                  (dir_x.includes(arr[0]) && dir_x.includes(arr[1])) ||
                  (dir_y.includes(arr[0]) && dir_y.includes(arr[1]))
                ) {
                  return null
                } else {
                  const angles = angleDist[arr[0]] + angleDist[arr[1]]
                  gradientAngle = ((angles === 270 && arr.includes('top') ? 360 : 0) + angles) / 2
                }
              }
            } else {
              const angle = isAngleStr(param_1st)
              if (angle) {
                gradientAngle = angle.value
              } else {
                param_1st_is_angle = false
              }
            }
          }
          if (param_1st_is_angle) {
            colorsGroup.splice(0, 1)
          }
          type GradientPoint = {
            color?: SpecifiedLengthTuple<number, 4>
            valueFn?: (length: number) => number
          }
          const getGradientLine = (angle: number, width: number, height: number, points: GradientPoint[]) => {
            while (angle >= 360 || angle < 0) {
              angle += angle < 0 ? 360 : -360
            }
            const anglePI = (angle / 180) * Math.PI
            let acuteAngle = angle
            if (acuteAngle >= 270) {
              acuteAngle = 360 - acuteAngle
            } else if (acuteAngle >= 180) {
              acuteAngle = acuteAngle - 180
            } else if (acuteAngle >= 90) {
              acuteAngle = 180 - acuteAngle
            }
            let lineLength = 0
            switch (angle) {
              case 0:
                lineLength = height
                break
              case 90:
                lineLength = width
                break
              case 180:
                lineLength = height
                break
              default:
                lineLength = Math.abs(
                  Math.cos(Math.PI / 2 - (acuteAngle / 180) * Math.PI - Math.atan2(height, width)) *
                    Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))
                )
                break
            }
            const _points = points.map(item => {
              return {
                color: item.color,
                length: item.valueFn ? item.valueFn(lineLength) : undefined
              }
            })
            if (_points[0].length === undefined) {
              _points[0].length = 0
            } else if (_points[0].length > 0) {
              _points.unshift({
                color: _points[0].color,
                length: 0
              })
            }
            if (_points[_points.length - 1].length === undefined) {
              _points[_points.length - 1].length = lineLength
            } else if (_points[_points.length - 1].length! < lineLength) {
              _points.push({
                color: _points[_points.length - 1].color,
                length: lineLength
              })
            }
            const tempPoints: (typeof _points)[number][] = []
            _points
              .map((item, index, arr) => {
                if (index) {
                  const lastItem = arr[index - 1]
                  if (!lastItem.color && index > 1) {
                    const last2Item = arr[index - 2]
                    if (
                      isNonNullable(item.length) &&
                      isNonNullable(lastItem.length) &&
                      item.length > lastItem.length &&
                      item.color &&
                      last2Item.color
                    ) {
                      lastItem.color = last2Item.color.map((e, i) =>
                        Math.round((e + item.color![i]) / 2)
                      ) as typeof item.color
                    } else if (last2Item.color) {
                      lastItem.color = last2Item.color
                    }
                  }
                  if (isNonNullable(item.length) && isNonNullable(lastItem.length) && item.length < lastItem.length) {
                    item.length = lastItem.length
                  }
                  if (item.length === undefined) {
                    tempPoints.push(item)
                  } else if (tempPoints.length) {
                    const startLength = arr[index - tempPoints.length - 1].length!
                    const itemLength = (item.length - startLength) / (tempPoints.length + 1)
                    tempPoints.forEach((e, i) => {
                      e.length = startLength + (i + 1) * itemLength
                    })
                    tempPoints.length = 0
                  }
                  if (!compareObject(lastItem.color, item.color) || lastItem.length !== item.length) {
                    return null
                  }
                }
                return item
              })
              .filter((item): item is NonNullable<typeof item> => !!item)
            if (_points.find(item => item && !item.color) || !lineLength) {
              return null
            } else {
              const start2centerLength = lineLength / 2 - _points[0].length
              const end2centerLength = _points[_points.length - 1].length! - lineLength / 2
              const totalLength = start2centerLength + end2centerLength
              return {
                startPoint: {
                  x: width / 2 - Math.sin(anglePI) * start2centerLength,
                  y: height / 2 + Math.cos(anglePI) * start2centerLength
                },
                endPoint: {
                  x: width / 2 + Math.sin(anglePI) * end2centerLength,
                  y: height / 2 - Math.cos(anglePI) * end2centerLength
                },
                colors: _points.map(item => ({
                  color: item.color,
                  precent: (item.length! - _points[0].length!) / totalLength
                }))
              }
            }
          }
          let parseError = false
          const gradientPoints = colorsGroup
            .map(item => {
              if (typeof item === 'string') {
                return item.trim().split(/\s+/)
              } else {
                return item.map(e => (typeof e === 'string' ? e.trim().split(/\s+/) : e)).flat()
              }
            })
            .map(item => {
              let rgba: SpecifiedLengthTuple<number, 4> | undefined = undefined
              const points: GradientPoint[] = []
              const item_1st = item[0]
              if (typeof item_1st === 'string') {
                if (reg_hex.test(item_1st)) {
                  rgba = hex2rgba(item_1st) || undefined
                } else if (item_1st in colorKeyWordRGB) {
                  rgba = [...colorKeyWordRGB[item_1st], 1]
                } else if (lengthReg.test(item_1st)) {
                  points.push({
                    valueFn: length => getLengthValue(item_1st, length)
                  })
                }
              } else {
                if (['rgb', 'rgba', 'hsl', 'hsla'].includes(item_1st.type)) {
                  points.push({
                    color: item_1st.fn!(0)
                  })
                } else {
                  points.push({
                    valueFn: length => item_1st.fn!(length)
                  })
                }
              }
              rgba = rgba || undefined
              if (item.length === 1 && rgba) {
                points.push({
                  color: rgba
                })
              } else if (item.length === 2 || item.length === 3) {
                item.slice(1).forEach(e => {
                  if (typeof e === 'string') {
                    points.push({
                      color: rgba,
                      valueFn: length => getLengthValue(e, length)
                    })
                  } else {
                    points.push({
                      color: rgba,
                      valueFn: length => e.fn!(length)
                    })
                  }
                })
              } else {
                parseError = true
              }
              return points
            })
            .flat()
          const gradientWidth = backgroundRect.image.widthAuto
            ? backgroundRect.origin.width
            : backgroundRect.image.width
          const gradientHeight = backgroundRect.image.heightAuto
            ? backgroundRect.origin.height
            : backgroundRect.image.height
          const lineGradientParams = getGradientLine(gradientAngle, gradientWidth, gradientHeight, gradientPoints)
          if (lineGradientParams) {
            const gradientCanvas = windowInfo.createCanvas!(true, gradientWidth, gradientHeight)
            const gradientCtx = gradientCanvas.getContext('2d')
            const gradient = gradientCtx.createLinearGradient(
              lineGradientParams.startPoint.x,
              lineGradientParams.startPoint.y,
              lineGradientParams.endPoint.x,
              lineGradientParams.endPoint.y
            )
            lineGradientParams.colors.forEach(e => {
              gradient.addColorStop(e.precent, `rgba(${e.color!.join(',')})`)
            })
            gradientCtx.fillStyle = gradient
            gradientCtx.fillRect(0, 0, gradientWidth, gradientHeight)
            backgroundItem.image!.el = gradientCanvas
          }
        }

        if (item.position && item.position.length) {
          const positionCompute: {
            x: typeof item.position
            y: typeof item.position
          } = {
            x: [],
            y: []
          }
          const position_x_key = ['left', 'right']
          const position_y_key = ['top', 'bottom']
          let isValid = true
          switch (item.position.length) {
            case 1:
              if (position_y_key.includes(item.position[0])) {
                positionCompute.y.push(item.position[0])
              } else {
                positionCompute.x.push(item.position[0])
              }
              break
            case 2:
              {
                const yIndex = item.position.findIndex(e => position_y_key.includes(e))
                if (yIndex > -1) {
                  positionCompute.y.push(item.position[yIndex])
                  positionCompute.x.push(item.position[+!yIndex])
                } else if (position_x_key.includes(item.position[1])) {
                  positionCompute.y.push(item.position[0])
                  positionCompute.x.push(item.position[1])
                } else {
                  positionCompute.y.push(item.position[1])
                  positionCompute.x.push(item.position[0])
                }
              }
              break
            case 3:
              {
                isValid = false
                let nonkeyIndex = -1
                const xKey: string[] = []
                const yKey: string[] = []
                const cKey: string[] = []
                const karr = item.position.filter((e, i) => {
                  if (typeof e === 'string') {
                    switch (e) {
                      case 'left':
                      case 'right':
                        xKey.push(e)
                        break
                      case 'top':
                      case 'bottom':
                        yKey.push(e)
                        break
                      case 'center':
                        cKey.push(e)
                        break
                      default:
                        nonkeyIndex = i
                        return false
                    }
                    return true
                  } else {
                    nonkeyIndex = i
                    return false
                  }
                })
                if (karr.length === 2) {
                  if (item.position[nonkeyIndex - 1] !== 'center') {
                    if ((xKey.length === 1 || yKey.length === 1) && cKey.length < 2) {
                      positionCompute.x.push(xKey[0] || 'center')
                      positionCompute.y.push(yKey[0] || 'center')
                      isValid = true
                    }
                  }
                }
                if (isValid) {
                  if (position_x_key.includes(item.position[nonkeyIndex - 1])) {
                    positionCompute.x.push(item.position[nonkeyIndex])
                  } else {
                    positionCompute.y.push(item.position[nonkeyIndex])
                  }
                } else {
                  // throw err
                }
              }
              break
            case 4:
              {
                isValid = false
                const xIndexs: number[] = []
                const yIndexs: number[] = []
                item.position.forEach((e, i) => {
                  if (position_x_key.includes(e)) {
                    xIndexs.push(i)
                  } else if (position_y_key.includes(e)) {
                    yIndexs.push(i)
                  }
                })
                if (
                  xIndexs.length === 1 &&
                  yIndexs.length === 1 &&
                  [0, 2].includes(xIndexs[0]) &&
                  [0, 2].includes(yIndexs[0])
                ) {
                  positionCompute.x.push(item.position[xIndexs[0]], item.position[xIndexs[0] + 1])
                  positionCompute.y.push(item.position[yIndexs[0]], item.position[yIndexs[0] + 1])
                  isValid = true
                }
              }
              break
            default:
              isValid = false
              break
          }
          if (isValid) {
            const xLength = backgroundRect.image.widthAuto
              ? 0
              : backgroundRect.origin.width - backgroundRect.image.width
            const yLength = backgroundRect.image.heightAuto
              ? 0
              : backgroundRect.origin.height - backgroundRect.image.height
            backgroundItem.position.x += positionCompute.x
              .map(e => {
                if (typeof e === 'string') {
                  if (e === 'left') {
                    return 0
                  } else if (e === 'right') {
                    return xLength
                  } else if (e === 'center') {
                    return xLength / 2
                  } else {
                    return getLengthValue(e, xLength)
                  }
                } else {
                  return e.fn!(xLength)
                }
              })
              .reduce((a, b, i) => a + (i && positionCompute.x[0] === 'right' ? -1 : 1) * b, 0)
            backgroundItem.position.y += positionCompute.y
              .map(e => {
                if (typeof e === 'string') {
                  if (e === 'top') {
                    return 0
                  } else if (e === 'bottom') {
                    return yLength
                  } else if (e === 'center') {
                    return yLength / 2
                  } else {
                    return getLengthValue(e, yLength)
                  }
                } else {
                  return e.fn!(yLength)
                }
              })
              .reduce((a, b, i) => a + (i && positionCompute.y[0] === 'bottom' ? -1 : 1) * b, 0)
          }
        }

        // repeat ?
        type RepeatArea = {
          w: number
          h: number
          x: number
          y: number
        }
        const imageRect: RepeatArea = {
          w: backgroundRect.image.width,
          h: backgroundRect.image.height,
          x: (backgroundItem.position?.x || 0) + backgroundRect.origin.left,
          y: (backgroundItem.position?.y || 0) + backgroundRect.origin.top
        }
        const repeatAreas: RepeatArea[] = []
        if (item.repeat && item.repeat !== 'no-repeat') {
          const xSlices = [0, imageRect.x, imageRect.x + imageRect.w, backgroundRect.clip.width]
          const xWidths = xSlices.reduce<[number, number[]]>(
            (a, b, i) => (i && a[1].push(b - a[0]), (a[0] = b), a),
            [0, []]
          )[1]
          const ySlices = [0, imageRect.y, imageRect.y + imageRect.h, backgroundRect.clip.height]
          const yWidths = ySlices.reduce<[number, number[]]>(
            (a, b, i) => (i && a[1].push(b - a[0]), (a[0] = b), a),
            [0, []]
          )[1]
          const pushArea = (area: RepeatArea, iw: number, ih: number) => {
            let xFix = iw === 0 ? (area.w % imageRect.w) - imageRect.w : 0
            let yFix = ih === 0 ? (area.h % imageRect.h) - imageRect.h : 0
            if (iw === 1 && ih === 1) {
              repeatAreas.push(area)
            } else {
              const wSlices: number[] = []
              let w = area.w
              while (w > 0) {
                wSlices.push(imageRect.w)
                w -= imageRect.w
              }
              const hSlices: number[] = []
              let h = area.h
              while (h > 0) {
                hSlices.push(imageRect.h)
                h -= imageRect.h
              }
              wSlices.forEach((_, $iw) => {
                hSlices.forEach((_, $ih) => {
                  repeatAreas.push({
                    w: imageRect.w,
                    h: imageRect.h,
                    x: $iw * imageRect.w + xFix + area.x,
                    y: $ih * imageRect.h + yFix + area.y
                  })
                })
              })
            }
          }
          xWidths.forEach((w, iw) => {
            if (w > 0) {
              yWidths.forEach((h, ih) => {
                if (h > 0) {
                  const area = {
                    x: xSlices[iw],
                    y: ySlices[ih],
                    w,
                    h
                  }
                  switch (item.repeat) {
                    case 'repeat-x':
                      if (ih === 1) {
                        pushArea(area, iw, ih)
                      }
                      break
                    case 'repeat-y':
                      if (iw === 1) {
                        pushArea(area, iw, ih)
                      }
                      break
                    case 'repeat':
                      pushArea(area, iw, ih)
                      break
                  }
                }
              })
            }
          })
        } else {
          repeatAreas.push(imageRect)
        }

        if (backgroundItem.image && backgroundItem.image.el) {
          repeatAreas.forEach(area => {
            clipCtx.drawImage(backgroundItem.image!.el!, area.x, area.y, area.w, area.h)
          })
        }

        backgroundCtx.drawImage(
          clipCanvas,
          backgroundRect.clip.left,
          backgroundRect.clip.top,
          backgroundRect.clip.width,
          backgroundRect.clip.height
        )

        console.log(839, backgroundItem)
      }
    }
  }
  return backgroundCanvas
}
