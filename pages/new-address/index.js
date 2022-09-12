// miniprogram/pages/new-address/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: 0,
    userName: '',
    telNumber: '',
    region: ['广东省', '广州市', '海珠区'],
    detailInfo: ''
  },

  async save(e) {
    // let data = this.data 
    const {userName, telNumber, detailInfo, region, id} = this.data

    if (!userName || !telNumber || !detailInfo) {
      wx.showModal({
        title: '数据项不能为空',
      })
      return
    }
    if (!/[\d-]{11,18}/.test(telNumber)) {
      wx.showModal({
        title: '电话格式对吗？',
      })
      return
    }
    const data = {
      userName,
      tel: telNumber,
      detailInfo,
      region,
      id
    }
    const method = id ? 'put' : 'post'
    const res = await wx.wxp.requestX({
      url: 'http://localhost:8000/v1/user/my/address',
      method,
      data
    })
    if (res.data && res.data.affected > 0) {
      const opener = this.getOpenerEventChannel()
      if (!id) data.id = res.data.id
      opener.emit("savedNewAddress", data)
      wx.navigateBack({
        delta: 1,
      })
    } else {
      wx.showToast({
        title: '失败，重复添加？',
      })
    }
  },

  bindRegionChange: function (e) {
    this.setData({
      region: e.detail.value
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    const opener = this.getOpenerEventChannel()
    opener.on("editAddress", address => {
      this.setData({
        userName: address.userName,
        telNumber: address.tel,
        detailInfo: address.detailInfo,
        region: address.region,
        id: address.id
      })
    })
  },

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