type PrependTuple<A, T extends Array<any>> = ((a: A, ...b: T) => void) extends (...a: infer I) => void ? I : []
export type NOS = number | string
export type SpecifiedLengthTuple<T, N extends number, L extends Array<any> = []> = {
  true: L
  false: SpecifiedLengthTuple<T, N, PrependTuple<T, L>>
}[L['length'] extends N ? 'true' : 'false']
type IsSameType<T, K> = [T] extends [K] ? ([K] extends [T] ? true : false) : false
export type PickKeyByValueType<T extends Record<string, any>, K> = {
  [k in keyof T]: IsSameType<T[k], K> extends true ? k : never
}[keyof T]
export type PickRequried<T, K extends keyof T> = T & Required<Pick<T, K>>
