import { ComputedLayout, getDir } from '..'

const positionKeys = ['top', 'left', 'right', 'bottom'] as const
type PositionKey = (typeof positionKeys)[number]
export const getLayoutPosition = (layout: ComputedLayout) => {
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
                item.rect.top = item.styles.top! + item.rect.margin[0]
                break
              case 'bottom':
                item.rect.top =
                  layout.rect.boxHeight! - item.rect.boxHeight! - (item.styles.bottom! + item.rect.margin[2])
                break
              case 'left':
                item.rect.left = item.styles.left! + item.rect.margin[3]
                break
              case 'right':
                item.rect.left =
                  layout.rect.boxWidth! - item.rect.boxWidth! - (item.styles.right! + item.rect.margin[1])
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
        if (
          (item.type === 'img'
            ? item.styles.display === 'block'
            : [undefined, 'block'].includes(item.styles.display)) &&
          item.rect.marginCenterAuto
        ) {
          item.rect.left = position.left + (layout.rect.contentWidth! - item.rect.boxWidth!) / 2
        } else {
          item.rect.left = position.left + item.rect.margin[3]
        }
        tempMainLength = item.rect.margin[3] + item.rect.boxWidth!
      }
      getLayoutPosition(item)
    })
  }
  return layout
}
