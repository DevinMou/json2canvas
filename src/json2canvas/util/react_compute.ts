import { PickKeyByValueType } from './type'

type UndefinedValueKeysType<O extends object> = PickKeyByValueType<O, undefined>
type KK<V, O extends object> = V extends Partial<Record<keyof O, any>> ? keyof V : never
type ReactObj<T, D extends boolean> = D extends true
  ? T extends Record<string, any>
    ? MergeDefaultType<never, T>
    : T
  : T
type MergeDefaultType<
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

interface ReactComputeType {
  _computer_proxy: null | {
    _current?: any
    _resolve: null | ((value: void | PromiseLike<void>) => void)
    _compute?: <T extends any = void>(value?: any, oldValue?: any) => T
    trigger: (value: any, oldValue?: any) => void
  }
  reactive: {
    <O extends Record<string, any> = object>(obj: O, deep?: true): {
      value: <
        UndefinedReplaceType = never,
        ReplaceTypeProps extends keyof O | undefined | Partial<Record<keyof O, any>> = undefined,
        UseSelfProp extends keyof O | undefined = undefined
      >() => MergeDefaultType<UndefinedReplaceType, O, ReplaceTypeProps, UseSelfProp>
    }
    <O extends Record<string, any> = object>(obj: O, deep: false): {
      value: <
        UndefinedReplaceType = never,
        ReplaceTypeProps extends keyof O | undefined | Partial<Record<keyof O, any>> = undefined,
        UseSelfProp extends keyof O | undefined = undefined
      >() => MergeDefaultType<UndefinedReplaceType, O, ReplaceTypeProps, UseSelfProp, true>
    }
  }
  compute: <T extends object | InstanceType<ProxyConstructor>, K extends keyof T>(
    obj: T,
    prop: K,
    valFn: () => any
  ) => object
  /* watch: <T extends object | InstanceType<ProxyConstructor>, K extends keyof T>(
    obj: T,
    prop: K,
    watchFn: (value: T[K], oldValue?: T[K]) => any,
    watchOption?: { immediate: boolean; deep: boolean }
  ) => void */
  watch: <T>(
    fn: () => T,
    callBack: (val: T, oldValue?: T | undefined) => any,
    watchOption?: { immediate?: boolean; deep?: boolean }
  ) => Promise<void>
}

export const ReactCompute: ReactComputeType = {
  _computer_proxy: null,
  reactive(obj, deep = false) {
    obj = Object.assign(obj)
    return {
      value() {
        const _this = ReactCompute
        if (obj._IS_REACT_COMPUTE) {
          Object.defineProperty(obj, '_REACT_COMPUTE_DEEP', {
            value: !deep
          })
          return obj
        }

        const _obj: Record<string, any> = {}
        for (const k in obj) {
          const v = obj[k]
          if (v && typeof v === 'object' && !v._IS_REACT_COMPUTE && deep) {
            _obj[k] = ReactCompute.reactive(v).value()
          } else {
            _obj[k] = v
          }
        }
        Object.defineProperties(_obj, {
          _IS_REACT_COMPUTE: { value: true },
          _REACT_COMPUTE_DEEP: { value: !!deep }
        })
        return new Proxy(_obj, {
          get(target, prop) {
            if (typeof prop === 'string' && _this._computer_proxy) {
              const listenerProp = `_listener_${prop}`
              if (!target[listenerProp]) {
                Object.defineProperty(target, listenerProp, {
                  value: []
                })
              }
              target[listenerProp].push(_this._computer_proxy)
            }
            return target[prop as string]
          },
          set(target, prop, value) {
            const oldValue = target[prop as string]
            if (value && typeof value === 'object' && !value._IS_REACT_COMPUTE && target._REACT_COMPUTE_DEEP) {
              value = ReactCompute.reactive({ ...value })
            }
            target[prop as keyof typeof target] = value
            const listenerProp = `_listener_${prop.toString()}`
            if (target[listenerProp]) {
              target[listenerProp].forEach((item: NonNullable<ReactComputeType['_computer_proxy']>) => {
                item.trigger(value, oldValue)
              })
            }
            return true
          }
        })
      }
    }
  },
  compute(obj, prop, valFn) {
    const _this = ReactCompute
    obj = _this.reactive(obj) as typeof obj
    const _compute = function (this: NonNullable<ReactComputeType['_computer_proxy']>) {
      const current = valFn()
      if (current !== this._current) {
        this._current = current
        obj[prop] = current
      }
    } as NonNullable<ReactComputeType['_computer_proxy']>['_compute']
    const computer: NonNullable<ReactComputeType['_computer_proxy']> = {
      _current: undefined,
      _resolve: null as null | ((value: void | PromiseLike<void>) => void),
      _compute,
      trigger(value, oldValue) {
        if (value === oldValue) {
          return
        }
        if (!this._resolve) {
          new Promise<void>(resolve => {
            this._resolve = resolve
          }).then(() => {
            this._resolve = null
            this._compute!(value, oldValue)
          })
        }
        this._resolve!()
      }
    }
    _this._computer_proxy = computer
    computer._compute!()
    _this._computer_proxy = null
    return obj
  },
  /* watch(obj, prop, valFn, watchOption = { immediate: false, deep: false }) {
    const _this = ReactCompute
    obj = _this.reactive(obj)
    const computer: NonNullable<ReactComputeType['_computer_proxy']> = {
      _current: undefined,
      _resolve: null as null | ((value: void | PromiseLike<void>) => void),
      _compute(value, oldValue) {
        if (value !== oldValue) {
          valFn(value, oldValue)
        }
      },
      trigger(value, oldValue) {
        if (!this._resolve) {
          new Promise<void>(resolve => {
            this._resolve = resolve
          }).then(() => {
            this._resolve = null
            this._compute(value, oldValue)
          })
        }
        this._resolve!()
      }
    }
    _this._computer_proxy = computer
    const currentValue = obj[prop as keyof typeof obj]
    if (watchOption.immediate) {
      computer._compute(currentValue, undefined)
    }
    _this._computer_proxy = null
    return obj
  }, */
  watch(watchFn, callBackFn, watchOption) {
    return new Promise(resolve => {
      watchOption = Object.assign({ immediate: false, deep: false }, watchOption)
      const _this = ReactCompute
      const computer: NonNullable<ReactComputeType['_computer_proxy']> = {
        _current: undefined,
        _resolve: null as null | ((value: void | PromiseLike<void>) => void),
        // _compute: () => watchFn(),
        trigger() {
          if (!this._resolve) {
            new Promise<void>(resolve => {
              this._resolve = resolve
            }).then(() => {
              this._resolve = null
              const current = watchFn()
              if (current !== this._current) {
                const fnRes = callBackFn(current, this._current)
                if (fnRes instanceof Promise) {
                  fnRes.then(() => resolve())
                } else if (!!fnRes) {
                  resolve()
                }
                this._current = current
              }
            })
          }
          this._resolve!()
        }
      }
      _this._computer_proxy = computer
      const currentValue = watchFn()
      if (watchOption.immediate) {
        const fnRes = callBackFn(currentValue, undefined)
        if (fnRes instanceof Promise) {
          fnRes.then(() => resolve())
        } else if (!!fnRes) {
          resolve()
        }
      }
      _this._computer_proxy = null
      return
    })
  }
}
