import { MergeDefaultType } from './type'

type ComputerItem = NonNullable<ReactCompute['_computer_proxy']>
export class ReactCompute {
  _computer_proxy: null | {
    _current?: any
    _once?: boolean
    _resolve: null | ((value: void | PromiseLike<void>) => void)
    _compute?: <T extends any = void>(value?: any, oldValue?: any) => T
    trigger: (value: any, oldValue?: any, selfItem?: ComputerItem) => void
    remove?: () => void
  } = null
  _watch_waiting_pool: Record<string, Promise<unknown>[]> = {
    default: []
  }
  reactive<O extends Record<string, any> = object>(obj: O, deep?: true): {
    value: <
      UndefinedReplaceType = never,
      ReplaceTypeProps extends keyof O | undefined | Partial<Record<keyof O, any>> = undefined,
      UseSelfProp extends keyof O | undefined = undefined
    >() => MergeDefaultType<UndefinedReplaceType, O, ReplaceTypeProps, UseSelfProp>
  }
  reactive<O extends Record<string, any> = object>(obj: O, deep: false): {
      value: <
        UndefinedReplaceType = never,
        ReplaceTypeProps extends keyof O | undefined | Partial<Record<keyof O, any>> = undefined,
        UseSelfProp extends keyof O | undefined = undefined
      >() => MergeDefaultType<UndefinedReplaceType, O, ReplaceTypeProps, UseSelfProp, true>
  }
  reactive<O extends Record<string, any> = object>(obj: O, deep: boolean = false) {
    obj = Object.assign(obj)
    const _this = this
    return {
      value() {
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
            _obj[k] = _this.reactive(v).value()
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
              if (_this._computer_proxy._once) {
                _this._computer_proxy.remove = () => {
                  const index = target[listenerProp].indexOf(_this._computer_proxy)
                  if (index > -1) {
                    target[listenerProp].splice(index, 1)
                  }
                }
              }
              target[listenerProp].push(_this._computer_proxy)
            }
            return target[prop as string]
          },
          set(target, prop, value) {
            const oldValue = target[prop as string]
            if (value && typeof value === 'object' && !value._IS_REACT_COMPUTE && target._REACT_COMPUTE_DEEP) {
              value = _this.reactive({ ...value })
            }
            target[prop as keyof typeof target] = value
            const listenerProp = `_listener_${prop.toString()}`
            if (target[listenerProp]) {
              target[listenerProp].forEach((item: NonNullable<ReactCompute['_computer_proxy']>) => {
                item.trigger(value, oldValue, item)
              })
            }
            return true
          }
        })
      }
    }
  }
  compute<T extends object | InstanceType<ProxyConstructor>, K extends keyof T>(obj: T, prop: K, valFn: () => any) {
    const _this = this
    obj = _this.reactive(obj) as typeof obj
    const _compute = function (this: NonNullable<ReactCompute['_computer_proxy']>) {
      const current = valFn()
      if (current !== this._current) {
        this._current = current
        obj[prop] = current
      }
    } as NonNullable<ReactCompute['_computer_proxy']>['_compute']
    const computer: NonNullable<ReactCompute['_computer_proxy']> = {
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
  }
  watch<T>(
    watchFn: () => T,
    callBackFn: (val: T, oldValue?: T | undefined) => unknown,
    watchOption?: { immediate?: boolean; deep?: boolean; once?: boolean } // deep 暂时未实现
  ): Promise<ReturnType<typeof callBackFn>>{
    const _this = this
    const waitingPromise = new Promise<ReturnType<typeof callBackFn>>(resolve => {
      watchOption = Object.assign({ immediate: true, deep: false, once: false }, watchOption)
      const computer: NonNullable<ReactCompute['_computer_proxy']> = {
        _current: undefined,
        _once: watchOption.once,
        _resolve: null as null | ((value: void | PromiseLike<void>) => void),
        // _compute: () => watchFn(),
        trigger(_1,_2,item) {
          if (!this._resolve) {
            new Promise<void>(resolve$ => {
              this._resolve = resolve$
            }).then(() => {
              this._resolve = null
              const current = watchFn()
              if (current !== this._current) {
                const fnRes = callBackFn(current, this._current)
                if (fnRes instanceof Promise) {
                  fnRes.then((res) => {
                    resolve(res)
                    item && item.remove && item.remove()
                  })
                } else if (!!fnRes) {
                  resolve(fnRes)
                  item && item.remove && item.remove()
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
        const item = computer
        if (fnRes instanceof Promise) {
          fnRes.then((res) => {
            resolve(res)
            item && item.remove && item.remove()
          })
        } else if (!!fnRes) {
          resolve(fnRes)
          item && item.remove && item.remove()
        }
      }
      _this._computer_proxy = null
      return
    })
    for (let k in this._watch_waiting_pool) {
      this._watch_waiting_pool[k].push(waitingPromise)
    }
    return waitingPromise
  }
  resetWatchWaiting(name: string = 'default') {
    if (!this._watch_waiting_pool[name]) {
      this._watch_waiting_pool[name] = []
    } else {
      this._watch_waiting_pool[name].length = 0
    }
  }
  getWatchWaiting(name: string = 'default') {
    if (this._watch_waiting_pool[name]) {
      if (this._watch_waiting_pool[name].length) {
        const arr = [...this._watch_waiting_pool[name]]
        if (name === 'default') {
          this._watch_waiting_pool[name].length = 0
        } else {
          delete this._watch_waiting_pool[name]
        }
        return Promise.all(arr).then(() => {
          return true
        })
      } else {
        return Promise.resolve(true)
      }
    } else {
      return Promise.resolve(null)
    }
  }
}
