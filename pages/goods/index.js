// miniprogram/pages/goods/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    showLoginPanel: false,
    showSkuPanel: false,
    goodsId: 0,
    goodsData: {},
    goodsImages: [],
    goodsContentInfo: {},
    goodsSkuData: {},
    selectedGoodsSku: {}, // 弹出面板中完整选中的一组规格组合，JSON对象，包括goodsAttrPath、goodsId、id、price、stock字段
    selectedAttrValue: {}, // 弹出面板中正在选择的规格，用哈希表储存，attrkeyid -> attrvalue，例如：尺码：120x150*240
    selectedGoodsSkuObject: {} // 商品详情页已选择的完整选中的一组规格组合对象，与selectedGoodsSku有区分，后者是弹出面板中正在选择的规格组合对象，用Object.assign()拷贝
  },

  // 测试返回对象
  requestHomeApiByReq4(e){
    getApp().wxp.requestX({
      url: 'http://localhost:8000/user/home',
      onReturnObject(rtn){
        // rtn.abort()
      }
    }).catch(err=>{
      console.log(err);
    })
  },

  async addToCart(e) {
    if (!this.data.selectedGoodsSkuObject.sku) {
      wx.showModal({
        title: '请选择商品规格',
        showCancel: false
      })
      this.showSkuPanelPopup()
      return
    }
    const {
      goodsId,
      selectedGoodsSkuObject
    } = this.data
    const goods_sku_id = selectedGoodsSkuObject.sku.id
    const goods_sku_desc = selectedGoodsSkuObject.text
    const data = {
      goods_id: goodsId,
      goods_sku_id,
      goods_sku_desc
    }
    const res = await getApp().wxp.request4({
      url: 'http://localhost:8000/user/my/carts',
      method: 'post',
      data
    })
    if (res.data.msg == 'ok') {
      wx.showToast({
        title: '已添加',
      })
    }
  },

  // 显示规格面板
  showSkuPanelPopup() {
    this.setData({
      showSkuPanel: true
    });
  },

  // 关闭规格面板
  onCloseSkuPanel() {
    this.setData({
      showSkuPanel: false
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    const goodsid = options.goodsid
    this.data.goodsid = goodsid
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('goodsEvent', (res) => {
      const goodsImages = res.data.infos.filter(item => (item.kind == 0))
      const goodsContentInfo = res.data.infos.filter(item => (item.kind == 1))[0]

      this.setData({
        goodsData: res.data,
        goodsImages,
        goodsContentInfo
      })
    })
    // 拉取sku规格数据
    const goodsSkuDataRes = await wx.wxp.request({
      url: `http://localhost:8000/goods/${goodsid}/sku`,
    })
    if (goodsSkuDataRes && goodsSkuDataRes.data) {
      const goodsSkuData = goodsSkuDataRes.data
      this.setData({
        goodsSkuData
      })
    }
  },

  onTapSkuTag(e) {
    // 获取及设置选择的规格
    const attrvalue = e.currentTarget.dataset.attrvalue
    const attrkeyid = e.currentTarget.dataset.attrkeyid

    const {
      selectedAttrValue
    } = this.data
    selectedAttrValue[attrkeyid] = attrvalue
    this.setData({
      selectedAttrValue
    })
    // 计算价格及库存
    let totalAttrValuePath = "0"
    const goodsAttrKeys = this.data.goodsSkuData.attrs
    for (let j = 0; j < goodsAttrKeys.length; j++) {
      let attrKeyId = goodsAttrKeys[j].id
      if (selectedAttrValue[attrKeyId]) {
        totalAttrValuePath += selectedAttrValue[attrKeyId].id
      }
    }

    const goodsSku = this.data.goodsSkuData.skus

    for (let j = 0; j < goodsSku.length; j++) {
      const {goodsAttrPath} = goodsSku[j]
      if (goodsAttrPath.length != goodsAttrKeys.length) {
        break
      }
      let tempTotalAttrValuePath = "0"
      goodsAttrPath.forEach(item => tempTotalAttrValuePath += item)

      // 判断是否所有的不同类型规格都已经有选中项，是的话才赋值selectedGoodsSku
      if (tempTotalAttrValuePath == totalAttrValuePath) {
        const selectedGoodsSku = goodsSku[j]
        this.setData({
          selectedGoodsSku
        })
        break;
      }
    }
  },

  // 确定选择当前规格
  onConfirmGoodsSku() {
    const {
      goodsSkuData,
      selectedGoodsSkuObject
    } = this.data
    selectedGoodsSkuObject.sku = Object.assign({}, this.data.selectedGoodsSku)
    selectedGoodsSkuObject.text = ''
    for (let j = 0; j < goodsSkuData.attrs.length; j++) {
      const item = goodsSkuData.attrs[j]
      if (!this.data.selectedAttrValue[item.id]) {
        wx.showModal({
          title: '没有选择全部规格',
          showCancel: false
        })
        return
      }
      selectedGoodsSkuObject.text += this.data.selectedAttrValue[item.id].attrValue + ' '
    }
    this.setData({
      selectedGoodsSkuObject,
      showSkuPanel: false
    })
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