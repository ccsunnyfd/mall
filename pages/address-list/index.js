// miniprogram/pages/address-list/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    radio: 0,
    selectedAddressId: 0,
    addressList: [],
    slideButtons: [{
      type: 'warn',
      text: '删除'
    }]
  },

  async onSlideButtonTap(e) {
    // e.detail.index是选择按钮的序号
    let id = e.currentTarget.dataset.id 
    console.log('slide button tap', e.detail, id)

    let res = await wx.wxp.requestX({
      url:`http://localhost:8000/v1/user/my/address/${id}`,
      method:'delete'
    })
    console.log(res);
    if (res && res.data.msg == 'ok'){
      // 处理本地数据
      const {addressList} = this.data
      addressList.some((item, index) => {
        if (item.id == id){
          addressList.splice(index, 1)
          return true
        }
        return false
      })
      this.setData({
        addressList
      })
    }
  },

  getAddressFromWeixin(e) {
    if (wx.canIUse('chooseAddress.success.userName')) {
      wx.chooseAddress({
        success: async (res) => {
          // console.log(res);
          const addressList = this.data.addressList

          const addressContained = addressList.find(item => item.telNumber == res.telNumber)
          if (addressContained) {
            this.setData({
              selectedAddressId: addressContained.id
            })
            return
          }

          const data = {
            // id: addressList.length,
            userName: res.userName,
            tel: res.telNumber,
            region: [res.provinceName, res.cityName, res.countyName],
            detailInfo: res.detailInfo
          }
          const res1 = await wx.wxp.requestX({
            url: 'http://localhost:8000/v1/user/my/address',
            method:'post',
            data
          })
          // console.log(res1);
          if (res1.data && res1.data.id){
            data.id = res1.data.id
            addressList.push(data)
            this.setData({
              addressList,
              selectedAddressId: data.id
            })
          }else{
            wx.showToast({
              title: '重复添加？',
            })
          }
        },
      })
    }
  },

  confirm(e){
    const {selectedAddressId, addressList} = this.data
    const item = addressList.find(item=>item.id == selectedAddressId)
    const opener = this.getOpenerEventChannel()
    opener.emit('selectAddress', item)
    wx.navigateBack({
      delta: 1,
    })
  },

  // 编辑回来回调这个方法
  onSavedAddress(address) {
    // console.log(address);
    const {addressList} = this.data
    const hasExist = addressList.some((item,index)=>{
      if (item.id == address.id){
        addressList[index] = address
        return true 
      }
      return false 
    })
    if (!hasExist){
      addressList.push(address)
    }

    this.setData({
      addressList,
      selectedAddressId: address.id
    })
  },

  navigateToNewAddressPage(e) {
    wx.navigateTo({
      url: '/pages/new-address/index',
      success:(res)=>{
        res.eventChannel.on("savedNewAddress", this.onSavedAddress)
      }
    })
  },

  onChange(event) {
    this.setData({
      selectedAddressId: event.detail,
    });
  },

  edit(e){
    console.log(e.currentTarget.dataset.id);
    const id = e.currentTarget.dataset.id
    const addressList = this.data.addressList
    const address = addressList.find(item=>item.id == id)
    wx.navigateTo({
      url: '/pages/new-address/index',
      success:(res)=>{
        res.eventChannel.emit('editAddress', address)
        res.eventChannel.on('savedNewAddress', this.onSavedAddress)
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    const res = await wx.wxp.requestX({
      url: 'http://localhost:8000/v1/user/my/address',
      method:'get'
    })
    if (res.data && res.data.addresses && res.data.addresses.length > 0) {
      const addressList = res.data.addresses
      const selectedAddressId = addressList[0].id
      this.setData({
        addressList,
        selectedAddressId
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
  onShow: function () {
    
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