// component/renderLayout/index.ts
Component({
  options: {
    virtualHost: true
  },
  /**`
   * 组件的属性列表
   */
  properties: {
    layout: {
      type: Object
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
    styleText: ''
  },
  lifetimes: {
    attached() {
      this.setData({
        styleText: Object.entries(this.data.layout.styles)
          .map(e => `${e[0]}:${e[1]}`)
          .join(';')
      })
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {}
})
