import { ComputedLayout, getDir } from '..'
import { LayoutRect, MorPDir } from './rect'

const positionKeys = ['top', 'left', 'right', 'bottom'] as const
type PositionKey = (typeof positionKeys)[number]
export const getMarginOrPaddingValue = (rect: LayoutRect, dir: MorPDir) => {
  const [prop, kword] = dir.split('-') as MorPDir extends `${infer T}-${infer U}` ? [T, U] : never
  const item = rect[prop]
  const arr = item.map(e =>
    typeof e === 'number' ? e : e instanceof Object ? e.fn!(rect.parentRect.contentWidth || 0) : 0
  )
  switch (kword) {
    case 'top':
      return arr[0]
    case 'right':
      return arr[1]
    case 'bottom':
      return arr[2]
    case 'left':
      return arr[3]
    case 'width':
      return arr[1] + arr[3]
    case 'height':
      return arr[0] + arr[2]
  }
}

export const getLayoutPosition = (layout: ComputedLayout) => {
  const layoutPaddingLeft = getMarginOrPaddingValue(layout.rect, 'padding-left')
  const layoutPaddingTop = getMarginOrPaddingValue(layout.rect, 'padding-top')
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
            item.rect[getDir(layout.rect.flexIsColumn).box]! +
            getMarginOrPaddingValue(item.rect, layout.rect.flexIsColumn ? 'margin-height' : 'margin-width')
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
      const marginTop = getMarginOrPaddingValue(item.rect, 'margin-top')
      // const marginBottom = item.rect.margin[2]
      if (item.styles.position === 'absolute') {
        for (const k in item.styles) {
          if (positionKeys.includes(k)) {
            switch (k as PositionKey) {
              case 'top':
                item.rect.top = item.styles.top! + getMarginOrPaddingValue(item.rect, 'margin-top')
                break
              case 'bottom':
                item.rect.top =
                  layout.rect.boxHeight! -
                  item.rect.boxHeight! -
                  (item.styles.bottom! + getMarginOrPaddingValue(item.rect, 'margin-bottom'))
                break
              case 'left':
                item.rect.left = item.styles.left! + getMarginOrPaddingValue(item.rect, 'margin-left')
                break
              case 'right':
                item.rect.left =
                  layout.rect.boxWidth! -
                  item.rect.boxWidth! -
                  (item.styles.right! + getMarginOrPaddingValue(item.rect, 'margin-right'))
                break
            }
          }
        }
        if (item.rect.left === undefined) {
          item.rect.left = getMarginOrPaddingValue(layout.rect, 'padding-left')
        }
        if (item.rect.top === undefined) {
          item.rect.top = getMarginOrPaddingValue(layout.rect, 'padding-top')
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
            item.rect.crossLength! +
            flexCrossRestLength -
            item.rect.boxWidth! -
            getMarginOrPaddingValue(item.rect, 'margin-width')
          item.rect.top = position.top + marginTop + mainFixedLength
          item.rect.left =
            position.left +
            getMarginOrPaddingValue(item.rect, 'margin-left') +
            (item.rect.alignSelf === 'center'
              ? crossFixedLength / 2
              : item.rect.alignSelf === 'flex-end'
              ? crossFixedLength
              : 0)
          tempMainLength = getMarginOrPaddingValue(item.rect, 'margin-height') + item.rect.boxHeight!
          if (item.rect.alignSelf === 'stretch' && ['auto', undefined].includes(item.styles.width)) {
            item.rect.boxWidth! += flexCrossRestLength
          }
        } else {
          if (newLine) {
            tempCrossIndex = item.rect.crossIndex
            position.top += tempCrossLength
            tempCrossLength = Math.max(
              item.rect.crossLength! + flexCrossRestLength,
              item.rect.boxHeight! + getMarginOrPaddingValue(item.rect, 'margin-height')
            )
            position.left = layoutPaddingLeft
            tempMainLength = 0
          } else {
            position.left += tempMainLength
            // tempCrossLength = Math.max(tempCrossLength, item.rect.boxHeight! + getMarginOrPaddingValue(item.rect, 'margin-height'))
          }
          const crossFixedLength =
            item.rect.crossLength! +
            flexCrossRestLength -
            item.rect.boxHeight! -
            getMarginOrPaddingValue(item.rect, 'margin-height')
          item.rect.top =
            position.top +
            marginTop +
            (item.rect.alignSelf === 'center'
              ? crossFixedLength / 2
              : item.rect.alignSelf === 'flex-end'
              ? crossFixedLength
              : 0)
          item.rect.left = position.left + getMarginOrPaddingValue(item.rect, 'margin-left') + mainFixedLength
          tempMainLength = getMarginOrPaddingValue(item.rect, 'margin-left') + item.rect.boxWidth!
          if (item.rect.alignSelf === 'stretch' && ['auto', undefined].includes(item.styles.height)) {
            item.rect.boxHeight! += flexCrossRestLength
          }
        }
      } else {
        const newLine =
          item.rect.crossIndex !== tempCrossIndex ||
          position.left + tempMainLength + getMarginOrPaddingValue(item.rect, 'margin-width') + item.rect.boxWidth! >
            layout.rect.contentWidth!
        if (newLine) {
          tempCrossIndex = item.rect.crossIndex
          position.top += tempCrossLength
          tempCrossLength = Math.max(
            item.rect.crossLength || 0,
            item.rect.boxHeight! + getMarginOrPaddingValue(item.rect, 'margin-height')
          )
          position.left = layoutPaddingLeft
          tempMainLength = 0
        } else {
          position.left += tempMainLength
          tempCrossLength = Math.max(
            tempCrossLength,
            item.rect.boxHeight! + getMarginOrPaddingValue(item.rect, 'margin-height')
          )
        }
        item.rect.top =
          position.top +
          marginTop +
          (item.rect.isFlex && item.rect.isInline ? item.rect.crossLength! - item.rect.boxHeight! : 0)
        if (
          (item.type === 'img'
            ? item.styles.display === 'block'
            : [undefined, 'block'].includes(item.styles.display)) &&
          item.rect.marginCenterAuto
        ) {
          item.rect.left = position.left + (layout.rect.contentWidth! - item.rect.boxWidth!) / 2
        } else {
          item.rect.left = position.left + getMarginOrPaddingValue(item.rect, 'margin-left')
        }
        tempMainLength = getMarginOrPaddingValue(item.rect, 'margin-left') + item.rect.boxWidth!
      }
      getLayoutPosition(item)
    })
  }
  return layout
}
