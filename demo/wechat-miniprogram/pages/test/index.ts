import { DrawLayout, windowInfo } from '../../utils/json2canvas/json2canvas' // replace it with your build path

// pages/test/index.ts
const layout: DrawLayout = {
  type: 'view',
  styles: {
    // display: 'inline-flex',
    display: 'inline-block',
    overflow: 'hidden',
    background: 'pink',
    // 'flex-direction': 'column',
    'flex-wrap': 'nowrap',
    'font-size': 0,
    padding: '40rpx',
    position: 'relative',
    'justify-content': 'flex-end'
    // height: '250rpx'
  },
  children: [
    {
      type: 'view',
      styles: {
        width: 'calc(55% + 200rpx)',
        // width: '55%',
        height: '200rpx',
        background:
          'url("https://image.brightfuture360.com/static/temple/merit-box/btn-1.png") no-repeat center top calc(-15% + 20rpx)/cover,linear-gradient(135deg, red, orange 10%, yellow, green, blue 31%,40%,purple 50%,black calc(100% - 40rpx), #fff) repeat bottom 20rpx right/calc(100% - min(1%, 10rpx)) calc(calc(50% / 2) - calc(20rpx + 10rpx)) content-box,#ff0000 padding-box content-box',
        flex: '1 2 auto',
        // 'box-sizing': 'content-box',
        'box-sizing': 'border-box',
        display: 'inline-block',
        padding: '0 calc(3% + 10rpx)',
        'border-radius': '60rpx',
        'border-top': '20rpx solid #4335ec00',
        'border-right': '40rpx solid #29de9d7d'
      }
    },
    {
      type: 'view',
      styles: {
        width: 'auto',
        height: '200rpx',
        background: 'yellow',
        flex: '1 1 auto',
        overflow: 'hidden',
        display: 'inline-flex',
        'box-sizing': 'content-box',
        'transform-origin': 'right top',
        transform: 'scale(.8, .8) skew(20deg) rotate(30deg) translate(20rpx, calc(100rpx - 5%))'
      },
      children: [
        {
          type: 'view',
          styles: {
            width: '120rpx',
            height: '100rpx',
            background: 'purple',
            // margin: '20rpx 0',
            'align-self': 'flex-start',
            display: 'inline-block'
          }
        },
        {
          type: 'view',
          styles: {
            width: '180rpx',
            height: '100rpx',
            background: 'aqua',
            display: 'inline-block'
          }
        }
      ]
    },
    {
      type: 'view',
      styles: {
        width: '200rpx',
        // height: 'auto',
        height: '100rpx',
        background: 'green',
        flex: '0 1 auto',
        'box-sizing': 'content-box',
        display: 'block',
        margin: '0 0 60rpx 0'
        // position: 'absolute'
        // right: '0'
        // padding: '0 min(5%, 20rpx)'
      },
      children: [
        {
          type: 'view',
          styles: {
            width: '400rpx',
            height: '400rpx',
            background: 'rgba(0,0,0,0.3)',
            position: 'absolute',
            // 'z-index': -1,
            left: '0',
            bottom: '600rpx'
            // transform: 'translate(10%, -34rpx) scale(1.5)'
          }
        },
        {
          type: 'view',
          styles: {
            width: '95rpx',
            height: '95rpx',
            background: 'rgba(0,0,255,0.3)',
            position: 'absolute',
            right: 0,
            top: 0
            // transform: 'translate(10%, -34rpx) scale(1.5)'
          }
        }
      ]
    },
    /* {
      type: 'view',
      styles: {
        width: '100rpx',
        height: '100rpx',
        background: 'blue',
        'border-radius': '25rpx',
        flex: '0 2 auto',
        padding: '0 20rpx',
        // 'box-sizing': 'border-box',
        display: 'inline-block',
        'box-shadow': 'inset -20rpx -10rpx 10rpx 20rpx #000, 5rpx 5rpx 5rpx',
        'align-self': 'center',
        'font-size': '14rpx',
        'line-height': '20rpx',
        color: '#ffffff'
      },
      content: 'Json2canvas'
    }, */
    {
      type: 'view',
      styles: {
        width: '200rpx',
        height: '200rpx',
        background: 'plum',
        flex: '0 1 auto',
        'box-sizing': 'content-box',
        margin: '40rpx 0',
        display: 'block',
        'align-self': 'center'
        // padding: '0 max(5%, 20rpx)'
      }
    },
    {
      type: 'view',
      styles: {
        width: '400rpx',
        height: '400rpx',
        background: 'orange content-box',
        flex: '0 1 auto',
        'box-sizing': 'content-box',
        margin: '20rpx 0 0',
        display: 'inline-block',
        'align-self': 'center',
        'border-top': '20rpx solid #fff',
        'border-left': '40rpx solid transparent',
        'border-right': '80rpx solid',
        'border-radius': '100rpx 40rpx',
        'box-shadow': '0rpx -180rpx 20rpx 20rpx #4751bb, inset 20rpx 20rpx 20rpx 40rpx #fff440'
      }
    }
  ]
}
const layout2: DrawLayout = {
  type: 'view',
  styles: {
    padding: '250rpx 50rpx 50rpx',
    display: 'inline-block',
    background: 'pink'
  },
  children: [
    {
      type: 'view',
      styles: {
        width: '400rpx',
        height: '400rpx',
        background: 'orange content-box',
        flex: '0 1 auto',
        'box-sizing': 'content-box',
        margin: '20rpx 0 0',
        display: 'inline-block',
        'align-self': 'center',
        'border-top': '20rpx solid #fff',
        'border-left': '40rpx solid transparent',
        'border-right': '80rpx solid',
        'border-radius': '100rpx 40rpx',
        'box-shadow': '0rpx -180rpx 20rpx 20rpx #4751bb, inset 20rpx 20rpx 20rpx 40rpx #fff440'
      }
    }
  ]
}
Page({
  /**
   * 页面的初始数据
   */
  data: {
    layout: layout,
    imgPath: '',
    imgWidth: 0,
    imgHeight: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    const wxmlCanvas = this.selectComponent('.json-canvas') as unknown as {
      draw: (_: DrawLayout) => Promise<{ path: string; width: number; height: number }>
    }
    wxmlCanvas?.draw(this.data.layout).then(({ path, width, height }) => {
      this.setData({
        imgPath: path,
        imgWidth: width / windowInfo.dpr,
        imgHeight: height / windowInfo.dpr
      })
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {}
})
