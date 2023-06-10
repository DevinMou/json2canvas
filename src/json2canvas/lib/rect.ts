import { ComputedLayout, windowInfo, DrawLayout, DrawStyles, setWidthOrHeightByStyle, getFlexLayout, getDir } from '..'
import {
  getRealValue,
  percentStrReg,
  getBorderArr,
  getLengthValue,
  lengthReg,
  parseLengthStr,
  LengthParseObj,
  parseStr2Ast,
  AstFn,
  parseAstItem2AstFnAndStr,
  parseFnParams
} from '../util/common'
import { ReactCompute } from '../util/react_compute'
import { NOS, PickKeyByValueType, PickRequried } from '../util/type'
import { FlexItemProp, parseFlex } from './flex'
import { getMarginOrPaddingValue } from './position'

const computedText: {
  canvas?: SampleCanvas.Canvas
  context?: SampleCanvas.RenderContext
} = {}

const getTextLines = (
  content: string,
  rect: ComputedLayout['rect'],
  styles: PickRequried<ReturnType<typeof coverStyles2RealValue>, 'font-size' | 'font-weight' | 'line-height'>
) => {
  if (!computedText.canvas) {
    computedText.canvas = windowInfo.createCanvas!(true)
    computedText.context = computedText.canvas!.getContext('2d')
  }
  const rules = {
    // 换行符是否合并，空格制表符是否合并，文字是否换行，行尾空格是否删除[2换行]
    normal: [1, 1, 1, 1],
    nowrap: [1, 1, 0, 1],
    pre: [0, 0, 0, 0],
    'pre-wrap': [0, 0, 1, 1],
    'pre-line': [0, 1, 1, 1],
    'break-spaces': [0, 0, 1, 2]
  }
  const rule = rules[styles['white-space'] || 'normal'] || rules['normal']
  computedText.context!.font = `${styles['font-weight'] || 'normal'} ${styles['font-size']}px sans-serif`
  /* if (styles.width === undefined) {
    const width = computedText.context!.measureText(content).width
    return {
      textWidth: width,
      lines: [{ sites: [[0, content.length - 1, content]] as [number, number, string][], content }],
      flatLines: [content]
    }
  } */
  const width = rect.contentWidth!
  const baseNum = Math.floor(width / styles['font-size'])
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
          ok = rule[2] ? w < width : true
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
          } else if (rule[2] ? w < width : true) {
            if (!isEnd()) {
              endIndex += 1
            }
          } else {
            lineAdd(-1)
          }
        } else {
          if (w === width) {
            lineAdd()
          } else if (rule[2] ? w > width : false) {
            endIndex -= 1
          } else {
            lineAdd()
          }
        }
      }
    }
    return { sites: siteArr, content: str }
  }
  if (rule[0]) {
    content = content.replace(/\n/g, ' ')
  }
  if (rule[1]) {
    content = content.replace(/\t/g, ' ')
    content = content
      .split(/\n/g)
      .map(e => e.replace(/\s+/g, ' ').replace(/^\s/, ''))
      .join('\n')
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
      }
    }
  }
  return res as Partial<DrawStyles & Record<Exclude<NosKeys, 'width' | 'height'>, number> & { width: NOS; height: NOS }>
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
            // padding: isColumn ? e.rect.paddingHeight + e.rect.borderHeight : e.rect.paddingWidth + e.rect.borderWidth,
            // margin: isColumn ? e.rect.marginHeight : e.rect.marginWidth,
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
          if (e.rect.percentFn[direction] !== undefined) {
            flexItem.percentLength = e.rect.percentFn[direction]!.fn
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
                .filter(item => item.layout.rect.percentValues[reDir] === undefined)
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

const parseOrigin = (val?: NOS) => {
  const res = {
    xPercent: true,
    yPercent: true,
    x: 50,
    y: 50
  }
  if (typeof val === 'number') {
    res.xPercent = false
    res.yPercent = false
    res.x = val
    res.y = val
  } else if (typeof val === 'string' && val) {
    const karr = val.split(/\s+/g)
    karr.forEach((item, index) => {
      switch (item) {
        case 'top':
          res.y = 0
          res.yPercent = true
          break
        case 'left':
          res.x = 0
          res.xPercent = true
          break
        case 'right':
          res.x = 100
          res.xPercent = true
          break
        case 'bottom':
          res.y = 100
          res.yPercent = true
          break
        case 'center':
          if (index === 0) {
            res.x = 50
            res.xPercent = true
          }
          if (karr.length === 1 || index === 1) {
            res.y = 50
            res.yPercent = true
          }
          break
        default:
          if (percentStrReg.test(item)) {
            const pv = +percentStrReg.exec(item)![1]
            if (index === 0) {
              res.x = pv
              res.xPercent = true
            }
            if (karr.length === 1 || index === 1) {
              res.y = pv
              res.yPercent = true
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

type RectAndStyleType = {
  rect: ReturnType<typeof initRectAndStyle>['rect']
  style: ReturnType<typeof coverStyles2RealValue>
  layout?: ComputedLayout
}

const mergeSize = async (layout: ComputedLayout, isHeight = false) => {
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
                getMarginOrPaddingValuePromise(item.rect, [isHeight ? 'margin-height' : 'margin-width']).then(
                  ([margin]) => {
                    setWidthOrHeightByStyle(item.rect, crossLength - margin, false, isHeight)
                  }
                )
              }
            },
            { immediate: true }
          )
        } else if (item.rect.percentFn[dir] !== undefined) {
          if (isHeight) {
            setWidthOrHeightByStyle(item.rect, 0, false, true)
          } else {
            ReactCompute.watch(
              () => layout.rect.contentWidth,
              contentWidth => {
                if (contentWidth !== undefined) {
                  setWidthOrHeightByStyle(
                    item.rect,
                    item.rect.percentFn.width!.fn!(contentWidth),
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
          ).then(async () => {
            const crossLength = Math.max(
              ...(await Promise.all(
                level.map(item =>
                  getMarginOrPaddingValuePromise(item.rect, [isHeight ? 'margin-height' : 'margin-width']).then(
                    ([margin]) => item.rect[getDir(isHeight).box]! + margin
                  )
                )
              ))
            )
            crossLengthArr[index] = crossLength
            return crossLength
          })
        })
      ).then(lengthArr => {
        if (crossLengthArr.length === 1 && layout.rect[getDir(isHeight).content] !== undefined) {
          crossLengthArr[0] = layout.rect[getDir(isHeight).content]!
        }
        positionChildren.forEach(async (item, index) => {
          item.rect.crossLength = crossLengthArr[item.rect.crossIndex] || 0
          if (isHeight && !index) {
            await ReactCompute.watch(
              () => layout.rect.contentHeight,
              _ => _ !== undefined,
              { immediate: true }
            )
            const [marginHeight] = await getMarginOrPaddingValuePromise(item.rect, ['margin-height'])
            const rest = item.rect.crossLength! - marginHeight - item.rect.boxHeight!
            layout.rect.flexBaseOutHeight =
              layout.rect.contentHeight! -
              item.rect.boxHeight! -
              marginHeight -
              (item.rect.alignSelf === 'center' ? rest / 2 : item.rect.alignSelf === 'flex-end' ? rest : 0)
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
        const contentWidthArr = await getRectsPropPromise(
          [layout.rect, ...relationChildren.map(e => e.rect)],
          _rect => _rect.contentWidth
        )
        const childrenWidths = await Promise.all(
          relationChildren.map(e =>
            getMarginOrPaddingValuePromise(e.rect, ['margin-width']).then(
              ([marginWidth]) => e.rect.boxWidth! + marginWidth
            )
          )
        )
        const parentWidth = contentWidthArr[0]
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
            await Promise.all(
              level.children.map(item =>
                getMarginOrPaddingValuePromise(item.rect, ['margin-height', 'margin-bottom']).then(
                  ([marginHeight, marginBottom]) => {
                    let _height = item.rect.boxHeight! + marginHeight
                    if (level.isLine && item.rect.isFlex) {
                      const _fixedHeight = item.rect.flexBaseOutHeight + marginBottom
                      _height -= _fixedHeight
                      flexItemFixedHeights.push(_fixedHeight)
                    }
                    if (_height >= maxHeight) {
                      maxHeight = _height
                      maxItem = item
                    }
                  }
                )
              )
            )
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
        ).then(async itemArr => {
          let preMarginBottom: number | null = null
          let tempHeight = 0
          await Promise.all(
            itemArr
              .filter(item => item.maxItem)
              .map(item =>
                getMarginOrPaddingValuePromise(item.maxItem.rect, ['margin-top', 'margin-bottom']).then(
                  ([marginTop, marginBottom]) => {
                    tempHeight +=
                      item.maxHeight -
                      (!item.maxItem.rect.isInline && preMarginBottom !== null
                        ? Math.min(marginTop, preMarginBottom)
                        : 0)
                    if (item.maxItem.rect.isInline) {
                      preMarginBottom = null
                    } else {
                      preMarginBottom = marginBottom
                    }
                  }
                )
              )
          )
          setWidthOrHeightByStyle(layout.rect, tempHeight, false, true)
        })
      } else {
        //
        console.log(952)
      }
    } else {
      if (layout.rect.isInline) {
        const relationChildren = layout.children!.filter(item => item.styles.position !== 'absolute')
        await getRectsPropPromise(
          relationChildren
            .filter(
              item =>
                item.rect.percentFn.width === undefined &&
                (item.rect.isInline || !['auto', undefined].includes(item.styles.width))
            )
            .map(item => item.rect),
          _rect => _rect.contentWidth
        )
        const levels: {
          widthBySelf: boolean
          isInline: boolean
          children: ComputedLayout[]
        }[] = []
        let lastIsInline = false
        relationChildren.forEach(item => {
          const widthBySelf = item.rect.percentFn.width === undefined
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
            ).then(async () => {
              let maxHeightItem: ComputedLayout | null = null
              let maxHeight = 0
              await Promise.all(
                level.children.map(item =>
                  getMarginOrPaddingValuePromise(item.rect, ['margin-height']).then(([marginHeight]) => {
                    const _height = item.rect.boxHeight! + marginHeight
                    if (_height >= maxHeight) {
                      maxHeight = _height
                      maxHeightItem = item
                    }
                  })
                )
              )
              return {
                isInline: level.isInline,
                maxHeightItem: maxHeightItem!,
                maxHeight
              }
            })
          )
        ).then(async levelArr => {
          let preMarginBottom: null | number = null
          let tempHeight = 0
          await Promise.all(
            levelArr
              .filter(item => item && item.maxHeightItem)
              .map(item =>
                getMarginOrPaddingValuePromise(item.maxHeightItem.rect, ['margin-top', 'margin-bottom']).then(
                  ([marginTop, marginBottom]) => {
                    tempHeight += item.maxHeight
                    if (!item.isInline && preMarginBottom !== null) {
                      tempHeight -= Math.min(preMarginBottom, marginTop)
                    }
                    if (item.isInline) {
                      preMarginBottom = null
                    } else {
                      preMarginBottom = marginBottom
                    }
                  }
                )
              )
          )
          setWidthOrHeightByStyle(layout.rect, tempHeight, false, true)
        })
        const maxWidth = Math.max(
          ...levels.map(({ children: level }) =>
            level
              .map(item => {
                const marginWidth = [item.rect.margin[1], item.rect.margin[3]]
                  .map(e => (e instanceof Object ? e.flexLength : typeof e === 'number' ? e : 0))
                  .reduce((a, b) => a + b, 0)
                const paddingWidth = [item.rect.padding[1], item.rect.padding[3]]
                  .map(e => (e instanceof Object ? e.flexLength : typeof e === 'number' ? e : 0))
                  .reduce((a, b) => a + b, 0)
                return item.rect.percentFn.width === undefined
                  ? item.rect.boxWidth! + marginWidth
                  : // : item.styles['box-sizing'] === 'border-box'
                    // ? marginWidth
                    paddingWidth + marginWidth
              })
              .reduce((a, b) => a + b, 0)
          )
        )
        setWidthOrHeightByStyle(layout.rect, maxWidth, false)
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
const RegularMarginOrPadding = (val?: ReturnType<typeof parseCssValue>, allowedNegative = false) => {
  if (!val) {
    return [0, 0, 0, 0]
  }
  const getRegularAstFn = (astFn: AstFn): LengthParseObj | AstFn => {
    if (astFn.type === 'min') {
      return new LengthParseObj({
        value: 0
      })
    } else if (astFn.type === 'max') {
      const fixedParam = astFn._params?.find(e => (e instanceof LengthParseObj ? e.unit !== '%' : false))
      if (fixedParam) {
        return fixedParam
      }
    }
    return Object.assign({}, astFn, {
      _params: astFn._params?.map(item => (item instanceof AstFn ? getRegularAstFn(item) : item))
    })
  }
  const _val = val.map(item => {
    if (item instanceof LengthParseObj) {
      return item.unit === '%'
        ? item.value
          ? {
              fn: <T = number>(length: number) => ((item.value * length) / 100) as T,
              flexLength: 0
            }
          : 0
        : getLengthValue(item)
    } else if (item instanceof AstFn) {
      const regItem = getRegularAstFn(item)
      return {
        fn: item.fn,
        flexLength: regItem instanceof LengthParseObj ? getLengthValue(regItem, 0) : regItem.fn!(0)
      }
    } else {
      return item
    }
  })
  const res: typeof _val = []
  switch (_val.length) {
    case 1:
      res.push(_val[0], _val[0], _val[0], _val[0])
      break
    case 2:
      res.push(_val[0], _val[1], _val[0], _val[1])
      break
    case 3:
      res.push(_val[0], _val[1], _val[2], _val[1])
      break
    case 4:
      res.push(..._val)
      break
  }
  if (res.length) {
    return res.map(item => {
      if (allowedNegative) {
        return item
      } else {
        if (typeof item === 'number') {
          if (item < 0) {
            return 0
          } else {
            return item
          }
        } else if (item instanceof Object) {
          if (item.flexLength < 0) {
            item.flexLength = 0
          }
          return item
        } else {
          return item
        }
      }
    })
  } else {
    return [0, 0, 0, 0]
  }
}
type MorP = 'margin' | 'padding'
type MarginOrPaddingDir = 'left' | 'top' | 'right' | 'bottom' | 'width' | 'height'
export type MorPDir = `${MorP}-${MarginOrPaddingDir}`

export const getMarginOrPaddingValuePromise = async (rect: RectAndStyleType['rect'], params: MorPDir[]) => {
  return await Promise.all(
    params.map(async dir => {
      const [prop, kword] = dir.split('-') as [MorP, MarginOrPaddingDir]
      const values = rect[prop] as unknown as ReturnType<typeof RegularMarginOrPadding>
      if (values) {
        const res: NonNullable<ReturnType<typeof RegularMarginOrPadding>> = []
        switch (kword) {
          case 'top':
            res.push(values[0])
            break
          case 'right':
            res.push(values[1])
            break
          case 'bottom':
            res.push(values[2])
            break
          case 'left':
            res.push(values[3])
            break
          case 'width':
            res.push(values[1], values[3])
            break
          case 'height':
            res.push(values[0], values[2])
            break
        }
        if (
          res.find(item => (item instanceof LengthParseObj ? item.unit === '%' && item.value : item instanceof Object))
        ) {
          if (rect.parentRect && rect.parentRect.contentWidth) {
            await ReactCompute.watch(
              () => rect.parentRect.contentWidth,
              _ => _ !== undefined,
              { immediate: true }
            )
            return res
              .map(item => {
                if (item instanceof LengthParseObj) {
                  return getLengthValue(item, rect.parentRect.contentWidth!)
                } else if (item instanceof Object) {
                  return item.fn!(rect.parentRect.contentWidth!)
                } else if (typeof item === 'number') {
                  return item
                } else {
                  return 0
                }
              })
              .reduce((a, b) => a + b, 0)
          } else {
            return 0
          }
        } else {
          return res
            .map(item => {
              if (item instanceof LengthParseObj) {
                return getLengthValue(item)
              } else if (typeof item === 'number') {
                return item
              } else {
                return 0
              }
            })
            .reduce((a, b) => a + b, 0)
        }
      } else {
        return 0
      }
    })
  )
}

const initRectAndStyle = (layout: DrawLayout, parentRAT?: RectAndStyleType) => {
  // @1:初始化rect,设置固定/响应宽高
  const { styles } = layout
  const style = coverStyles2RealValue(styles)
  type B = Partial<{ [k in keyof DrawStyles]: ReturnType<typeof parseCssValue> }>
  const styleSplits: B = {}
  for (let k in styles) {
    if (styles.hasOwnProperty(k)) {
      styleSplits[k as keyof B] = parseCssValue(styles[k as keyof B]!)
    }
  }
  const border = getBorderArr(styles)
  const borderLength = border.map(e => (e ? e[0] : 0))
  const margin = RegularMarginOrPadding(styleSplits.margin, true)
  const marginCenterAuto = /^\S+\s+auto(\s+\S+(\s+auto)?)?$/.test(styles.margin?.toString() || '')
  const padding = RegularMarginOrPadding(styleSplits.padding)
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
    percentFn: {},
    width: undefined,
    height: undefined,
    left: undefined,
    top: undefined,
    transformOrigin,
    // transform,
    right: undefined,
    bottom: undefined,
    computedMarginLeft: undefined,
    border,
    borderWidth: borderLength[1] + borderLength[3],
    borderHeight: borderLength[0] + borderLength[2],
    margin,
    marginCenterAuto,
    padding,
    // paddingWidth: padding[1] + padding[3],
    // paddingHeight: padding[0] + padding[2],
    // marginWidth: margin[1] + margin[3],
    // marginHeight: margin[0] + margin[2],
    parentRect: undefined,
    parentStyle: undefined,
    parentLayout: parentRAT?.layout,
    styleSplits,
    textLines: undefined
  }).value<
    number,
    {
      flexBasis: NOS
      border: number[]
      percentFn: {
        width?: AstFn
        height?: AstFn
      }
      alignSelf: DrawStyles['align-self']
      parentStyle: RectAndStyleType['style']
      textLines: string[]
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
      ReactCompute.watch(
        () => rect.contentWidth,
        contentWidth => contentWidth !== undefined
      ).then(() => {
        const { flatLines, textWidth } = getTextLines(
          layout.content!,
          rect,
          style as Parameters<typeof getTextLines>[2]
        )
        rect.textLines = flatLines
        setWidthOrHeightByStyle(rect, textWidth, false)
        setWidthOrHeightByStyle(rect, flatLines.length * style['line-height']!, false, true)
      })
    }
  }

  const isBorderBox = style['box-sizing'] === 'border-box'
  // let isRecentStr = false
  /* if (styleSplits.width && styleSplits.width.length) {
    if (styleSplits.width[0].type === 'number') {
      setWidthOrHeightByStyle(rect, styleSplits.width[0].fixed, isBorderBox)
    }
  } */
  const widthObj = styleSplits.width ? styleSplits.width[0] : undefined
  if (styleSplits.width) {
    if (widthObj instanceof LengthParseObj) {
      if (widthObj.unit === '%') {
        rect.percentFn.width = new AstFn({
          params: [widthObj],
          type: 'percent',
          fn: <T = number>(length: number) => ((widthObj.value / 100) * length) as T
        })
      } else {
        setWidthOrHeightByStyle(rect, getLengthValue(widthObj), isBorderBox)
      }
    } else if (widthObj instanceof AstFn) {
      rect.percentFn.width = widthObj
    }
  }
  if (
    rect.percentFn.width ||
    (['auto', undefined].includes(widthObj) &&
      (['block', 'flex', undefined].includes(style.display) ||
        (rect.isFlexItem && rect.parentRect.flexIsColumn && rect.alignSelf === 'stretch')))
  ) {
    if (rect.parentRect && (rect.isFlexItem ? rect.parentRect.flexIsColumn : true)) {
      ReactCompute.watch(
        rect.isFlexItem ? () => rect.flexCrossLength : () => rect.parentRect.contentWidth,
        contentWidth => {
          if (contentWidth !== undefined) {
            if (rect.percentFn.width) {
              const tempWidth = rect.percentFn.width!.fn!(contentWidth)
              setWidthOrHeightByStyle(rect, tempWidth, isBorderBox)
            } else {
              getMarginOrPaddingValuePromise(rect, ['margin-width']).then(([marginWidth]) =>
                setWidthOrHeightByStyle(rect, contentWidth - marginWidth, true)
              )
            }
          }
        },
        {
          immediate: true
        }
      )
    }
  }
  /* if (typeof style.width === 'number') {
    setWidthOrHeightByStyle(rect, style.width, isBorderBox)
  } else if (
    ((isRecentStr = percentStrReg.test(style.width || '')),
    isRecentStr ||
      ((style.width === 'auto' || style.width === undefined) &&
        (style.display === 'block' ||
          style.display === 'flex' ||
          style.display === undefined ||
          (rect.isFlexItem && rect.parentRect.flexIsColumn && rect.alignSelf === 'stretch'))))
  ) {
    if (isRecentStr) {
      rect.percentValues.width = +percentStrReg.exec(style.width!)![1] / 100
    }
    if (rect.parentRect && (rect.isFlexItem ? rect.parentRect.flexIsColumn : true)) {
      if (rect.parentRect.contentWidth === undefined) {
        ReactCompute.watch(
          rect.isFlexItem ? () => rect.flexCrossLength : () => rect.parentRect.contentWidth,
          contentWidth => {
            if (contentWidth !== undefined) {
              if (isRecentStr) {
                const tempWidth = contentWidth * rect.percentValues.width!
                setWidthOrHeightByStyle(rect, tempWidth, isBorderBox)
              } else {
                setWidthOrHeightByStyle(rect, contentWidth - rect.marginWidth, true)
              }
            }
          }
        )
      } else {
        if (isRecentStr) {
          const tempWidth = rect.parentRect.contentWidth * rect.percentValues.width!
          setWidthOrHeightByStyle(rect, tempWidth, isBorderBox)
        } else {
          setWidthOrHeightByStyle(rect, rect.parentRect.contentWidth - rect.marginWidth, true)
        }
      }
    }
  } */
  const heightObj = styleSplits.height ? styleSplits.height[0] : undefined
  let hasHeight = false
  if (heightObj) {
    if (heightObj instanceof LengthParseObj) {
      if (heightObj.unit === '%') {
        rect.percentFn.height = new AstFn({
          params: [heightObj],
          type: 'percent',
          fn: <T = number>(length: number) => ((heightObj.value / 100) * length) as T
        })
      } else {
        setWidthOrHeightByStyle(rect, getLengthValue(heightObj), isBorderBox, true)
      }
      hasHeight = true
    } else if (heightObj instanceof AstFn) {
      rect.percentFn.height = heightObj
      hasHeight = true
    }
  }
  if (
    ['auto', undefined].includes(heightObj) &&
    rect.isFlexItem &&
    !rect.parentRect.flexIsColumn &&
    rect.alignSelf === 'stretch'
  ) {
    if (rect.parentRect && (rect.isFlexItem ? !rect.parentRect.flexIsColumn : true)) {
      ReactCompute.watch(
        rect.isFlexItem ? () => rect.flexCrossLength : () => rect.parentRect.contentHeight,
        contentHeight => {
          if (contentHeight !== undefined) {
            if (rect.percentFn.height) {
              const tempHeight = rect.percentFn.height!.fn!(contentHeight)
              setWidthOrHeightByStyle(rect, tempHeight, isBorderBox, true)
            } else {
              getMarginOrPaddingValuePromise(rect, ['margin-width']).then(([marginWidth]) =>
                setWidthOrHeightByStyle(rect, contentHeight - marginWidth, true, true)
              )
            }
          }
        },
        {
          immediate: true
        }
      )
      hasHeight = true
    }
  } else if (!hasHeight && (!layout.children || !layout.children.length)) {
    setWidthOrHeightByStyle(rect, 0, false, true)
  }
  /* if (typeof style.height === 'number') {
    setWidthOrHeightByStyle(rect, style.height, isBorderBox, true)
  } else if (percentStrReg.test(style.height || '')) {
    rect.percentValues.height = +percentStrReg.exec(style.height!)![1] / 100
    if (rect.parentRect && (rect.isFlexItem ? !rect.parentRect.flexIsColumn : true)) {
      if (rect.parentRect.contentHeight !== undefined) {
        const tempHeight = rect.parentRect.contentHeight * rect.percentValues.height
        setWidthOrHeightByStyle(rect, tempHeight, isBorderBox, true)
      } else {
        ReactCompute.watch(
          rect.isFlexItem ? () => rect.flexCrossLength : () => rect.parentRect.contentHeight,
          contentHeight => {
            if (contentHeight !== undefined) {
              const tempHeight = contentHeight * rect.percentValues.height!
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
  } */

  return {
    rect, // 未计算padding的宽高
    style
  }
}

export type LayoutRect = RectAndStyleType['rect']
export type LayoutStyle = RectAndStyleType['style']

export const parseLayout = (layout: DrawLayout, parentRAT?: RectAndStyleType) => {
  const { rect, style } = initRectAndStyle(layout, parentRAT)
  const computedLayout = { ...layout, styles: style } as ComputedLayout
  if (computedLayout.children && computedLayout.children.length) {
    const children = computedLayout.children.map(e =>
      parseLayout(e, { rect, style, layout: computedLayout })
    ) as ComputedLayout['children']
    computedLayout.children = children as ComputedLayout[]
  }
  computedLayout.rect = rect
  mergeRect(computedLayout)
  return computedLayout as ComputedLayout
}

// parse str function

export const splitCssValueStr = (cssValueStr: string) => {
  const rootAst = parseStr2Ast(cssValueStr)
  return rootAst.children!.filter(item => item.type !== 'space').map(item => parseAstItem2AstFnAndStr(item))
}

const parseCssValue = (value: NOS) => {
  if (typeof value === 'number') {
    return [
      new LengthParseObj({
        value
      })
    ]
  } else {
    const arr = splitCssValueStr(value).map(item => {
      if (typeof item === 'string') {
        return lengthReg.test(item) ? parseLengthStr(item) : item
      } else {
        return parseFnParams(item)
      }
    })
    return arr
  }
}
