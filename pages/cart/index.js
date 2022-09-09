// miniprogram/pages/cart/index.js

Page({
  /**
   * 页面的初始数据
   */
  data: {
    showLoginPanel: false,
    cartIdSelectedResult: [], // 复选框选中商品id列表，驱动视图层商品选中与否状态显示
    allIsSelected: false, // 全选复选框
    editMode: false, // 编辑、完成状态切换
    carts: [], // 购物车列表，onShow传入
    totalPrice: 0 // 实时总价计算，反映复选框勾选状态
  },
  // 重新计算总价，只计算选中状态的商品价格
  calcTotalPrice() {
    let totalPrice = 0
    const ids = this.data.cartIdSelectedResult
    const {carts} = this.data
    ids.forEach(id => {
      carts.some(item => {
        if (item.cartId == id) {
          totalPrice += item.price * item.num
          return true
        }
        return false
      })
    })
    this.setData({
      totalPrice
    })
  },
  changeEditMode() {
    let editMode = !this.data.editMode
    this.setData({
      editMode
    })
  },

  onSelectGoodsItem(e) {
    const cartIdSelectedResult = e.detail
    let allIsSelected = false
    if (cartIdSelectedResult.length === this.data.carts.length) {
      allIsSelected = true
    }
    this.setData({
      cartIdSelectedResult,
      allIsSelected,
    });
    this.calcTotalPrice()
  },
  onSelectAll(event) {
    const allIsSelected = event.detail // 获取全选按钮选中与否状态,bool类型
    let cartIdSelectedResult = this.data.cartIdSelectedResult
    cartIdSelectedResult.length = 0

    if (allIsSelected) {
      const {carts} = this.data
      for (let j = 0; j < carts.length; j++) {
        cartIdSelectedResult.push(`${carts[j].cartId}`)
      }
    }

    this.setData({
      allIsSelected,
      cartIdSelectedResult
    });
    this.calcTotalPrice()
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {},

  async onShow() {
    const res = await getApp().wxp.requestX({
      url: 'http://localhost:8000/v1/user/my/cart',
      method: 'get'
    })
    if (res.data && res.data.items) {
      const cartItems = res.data.items

      this.setData({
        carts: cartItems
      })
    }
  },

  onCartConfirm(e) {
    // 拿到列表数据
    const {carts} = this.data
    const cartData = []
    const ids = this.data.cartIdSelectedResult
    if (ids.length == 0) {
      wx.showModal({
        title: '未选择商品',
        showCancel: false
      })
      return
    }
    ids.forEach(id => {
      carts.some(item => {
        if (item.cartId == id) {
          cartData.push(Object.assign({}, item)) // 浅拷贝，考虑到属性都是简单类型，没有关系。
          return true
        }
        return false
      })
    })
    wx.navigateTo({
      url: `/pages/confirm-order/index`,
      success: function (res) {
        res.eventChannel.emit('cartData', {
          data: cartData
        })
      }
    })
  },

  async onCartGoodsNumChanged(e) {
    const cartGoodsId = e.currentTarget.dataset.id
    const oldNum = parseInt(e.currentTarget.dataset.num)
    const num = e.detail

    const data = {
      num
    }

    const res = await getApp().wxp.requestX({
      url: `http://localhost:8000/v1/user/my/cart/${cartGoodsId}`,
      method: 'put',
      data
    })
    if (res.data && res.data.cart) {
      wx.showToast({
        title: num > oldNum ? '增加成功' : '减少成功',
      })
      // 修复数据
      const {carts} = this.data
      carts.some(item => {
        if (item.cartId == cartGoodsId) {
          item.num = num
          return true
        }
        return false
      })

      this.setData({
        carts
      })

      this.calcTotalPrice()
    }
  },

  async removeCartGoods(e) {
    let ids = this.data.cartIdSelectedResult
    if (ids.length == 0) {
      wx.showModal({
        title: '没有选择商品',
        showCancel: false
      })
      return
    }
      ids = ids.reduce((prev, cur)=>prev+','+cur)
    const res = await getApp().wxp.requestX({
      url: `http://localhost:8000/v1/user/my/cart/${ids}`,
      method: 'delete',
    })
    if (res.data && res.data.affected > 0) {
      const {carts} = this.data
      for (let j = 0; j < ids.length; j++) {
        const id = ids[j]
        carts.some((item, index) => {
          if (item.cartId == id) {
            carts.splice(index, 1)
            return true
          }
          return false
        })
      }
      this.setData({
        carts,
        cartIdSelectedResult: [],
        allIsSelected: false,
        totalPrice: 0,
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  // onShow: function () {

  // },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})