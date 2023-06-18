import { ComputedLayout, getDir } from '..'
import { computeAstFnParam } from '../util/common'
import { LayoutRect, MorPDir } from './rect'

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
interface MoveLayoutItem {
  source: LayoutRect
  destination: LayoutRect
}
export const getLayoutPosition = (layout: ComputedLayout, moveList?: MoveLayoutItem[]) => {
  const layoutPaddingLeft = getMarginOrPaddingValue(layout.rect, 'padding-left')
  const layoutPaddingTop = getMarginOrPaddingValue(layout.rect, 'padding-top')
  const isRoot = !moveList
  moveList = moveList || []
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
    let preMarginBottom: null | number = null
    layout.children.forEach(item => {
      const marginTop = getMarginOrPaddingValue(item.rect, 'margin-top')
      const marginBottom = getMarginOrPaddingValue(item.rect, 'margin-bottom')
      // const marginBottom = item.rect.margin[2]
      if (layout.rect.isFlex) {
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
        if (item.styles.position === 'absolute') {
          console.log(171)
          const newLine = !item.rect.isInline
          const absolutePosition: Record<string, number | undefined> = {
            x: undefined,
            y: undefined
          }

          const positonParent = {
            rect: item.rect.parentRect,
            preRect: item.rect,
            left: 0,
            top: 0
          }
          while (
            positonParent.rect.parentRect &&
            (positonParent.rect.styleSplits.position ? positonParent.rect.styleSplits.position[0] === 'static' : true)
          ) {
            positonParent.left += positonParent.rect.left || 0
            positonParent.top += positonParent.rect.top || 0
            positonParent.preRect = positonParent.rect
            positonParent.rect = positonParent.rect.parentRect
          }
          if (item.rect.styleSplits.bottom) {
            absolutePosition.y =
              positonParent.rect.boxHeight! -
              item.rect.boxHeight! -
              (computeAstFnParam(item.rect.styleSplits.bottom![0], positonParent.rect.boxHeight) +
                getMarginOrPaddingValue(item.rect, 'margin-bottom'))
          }
          if (item.rect.styleSplits.top) {
            absolutePosition.y =
              computeAstFnParam(item.rect.styleSplits.top![0], positonParent.rect.boxHeight) +
              getMarginOrPaddingValue(item.rect, 'margin-top')
          }
          if (item.rect.styleSplits.right) {
            absolutePosition.x =
              positonParent.rect.boxWidth! -
              item.rect.boxWidth! -
              (computeAstFnParam(item.rect.styleSplits.right![0], positonParent.rect.boxWidth) +
                getMarginOrPaddingValue(item.rect, 'margin-right'))
          }
          if (item.rect.styleSplits.left) {
            absolutePosition.x =
              computeAstFnParam(item.rect.styleSplits.left![0], positonParent.rect.boxWidth) +
              getMarginOrPaddingValue(item.rect, 'margin-left')
          }

          //
          let tempTop = 0
          let tempLeft = 0
          if (newLine) {
            tempTop = tempCrossLength
            tempLeft = layoutPaddingLeft - position.left
          } else {
            tempLeft = tempMainLength
          }
          if (absolutePosition.y === undefined) {
            item.rect.top =
              positonParent.top +
              position.top +
              tempTop +
              marginTop +
              (item.rect.isFlex && item.rect.isInline ? item.rect.crossLength! - item.rect.boxHeight! : 0)
          } else {
            item.rect.top = absolutePosition.y
          }

          if (absolutePosition.x === undefined) {
            item.rect.left =
              positonParent.left + position.left + tempLeft + getMarginOrPaddingValue(item.rect, 'margin-left')
          } else {
            item.rect.left = absolutePosition.x
          }
          if (item.rect.parentRect !== positonParent.rect) {
            moveList!.push({
              source: item.rect,
              destination: positonParent.preRect
            })
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
          if (!item.rect.isInline && preMarginBottom !== null) {
            position.top -= Math.min(preMarginBottom, marginTop)
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
          if (item.rect.isInline) {
            preMarginBottom = null
          } else {
            preMarginBottom = marginBottom
          }
        }
      }
      getLayoutPosition(item, moveList)
    })
  }
  if (isRoot && moveList.length) {
    moveList.forEach(item => {
      const _index = item.source.parentLayout!.children?.findIndex(e => e.rect === item.source)
      if (_index !== undefined && _index > -1) {
        item.destination.parentLayout!.children!.push(item.source.parentLayout!.children!.splice(_index, 1)[0])
      }
    })
    moveList.length = 0
  }
  return layout
}
