// matrix tool
export type Matrix = number[][]
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

export function MT(A: Matrix, B: Matrix) {
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