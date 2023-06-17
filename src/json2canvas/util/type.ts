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
export type MergeDefaultType<
  T = never,
  O extends object = object,
  V extends keyof O | undefined | Partial<Record<keyof O, any>> = undefined,
  KS extends keyof O | undefined = undefined,
  Deep extends boolean = false
> = {
  [k in keyof O]: k extends KK<V, O>
    ? V extends Partial<Record<keyof O, any>>
      ? O[k] extends undefined
        ? V[k] | ReactObj<O[k], Deep>
        : V[k]
      : T extends never
      ? ReactObj<O[k], Deep>
      : T | ReactObj<O[k], Deep>
    : k extends UndefinedValueKeysType<O>
    ? k extends KS
      ? MergeDefaultType<T, O, V, KS>
      : T extends never
      ? ReactObj<O[k], Deep>
      : T | ReactObj<O[k], Deep>
    : ReactObj<O[k], Deep>
}

type UndefinedValueKeysType<O extends object> = PickKeyByValueType<O, undefined>
type KK<V, O extends object> = V extends Partial<Record<keyof O, any>> ? keyof V : never
type ReactObj<T, D extends boolean> = D extends true
  ? T extends Record<string, any>
    ? MergeDefaultType<never, T>
    : T
  : T

export type UniqueStringCombinations<T extends string, C extends string = '-'> = ((a: T, b: T) => void) extends (
  a: infer X,
  b: infer Y
) => void
  ? X extends T
    ? Y extends T
      ? X extends Y
        ? never
        : `${X}${C}${Y}`
      : never
    : never
  : never
