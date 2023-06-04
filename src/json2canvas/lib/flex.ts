import { ComputedLayout } from '..'
import { getRealValue } from '../util/common'
import { PickRequried } from '../util/type'

export const parseFlex = (flexStr: string) => {
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
export type FlexItemProp = PickRequried<Partial<FlexItemBaseProp>, 'flexGrow' | 'flexShrink' | 'layout'>
export const setFlexSizeLength = (
  arr: FlexItemProp[],
  flexBoxInitLength?: number,
  isColumn?: boolean,
  isWrap?: boolean,
  ignorePadding?: boolean
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
      precentArr.push(e as (typeof precentArr)[0])
      if (isColumn && flexBoxInitLength === undefined) {
        e.originPrecentLength = e.precentLength
        e.precentLength = 0
      }
    } else if (e.styleLength === undefined && e.contentLength) {
      if (e.overflow) {
        flexArr.push(e as (typeof flexArr)[0])
      } else {
        e.fixedLength = e.contentLength
        fixedArr.push(e as (typeof fixedArr)[0])
      }
      flexLength += e.contentLength
    } else if (e.styleLength !== undefined) {
      flexArr.push(e as (typeof flexArr)[0])
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
      e.sizeLength = e.sizeLength! - (growSum ? (restRoomLength * e.flexGrow) / growSum : 0)
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
      groups.forEach(group => setFlexSizeLength(group, flexBoxLength, isColumn, false, true))
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
            fixedArr.push(e as (typeof fixedArr)[0])
          } else if (!e.overflow && e.contentLength && e.contentLength > e.sizeLength) {
            e.fixedLength =
              e.styleLength !== undefined && e.styleLength < e.contentLength ? e.styleLength : e.contentLength
            fixedArr.push(e as (typeof fixedArr)[0])
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
              fixedArr.push(e as (typeof fixedArr)[0])
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
      /* if (!ignorePadding && !e.borderBox && e.padding) {
        e.sizeLength! += e.padding
      } */
      return e
    })
  }
}
