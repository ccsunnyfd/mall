Page({
  data: {
    vtabs: [],
    goodsListMap: {},
    activeTab: 0,
    loading: true,
  },

  async onLoad() {
    wx.showLoading({
      title: 'Loading...',
    })
    let categories = await wx.wxp.request({
      url: 'http://localhost:8000/categories',
    })
    if (categories) categories = categories.data.categories

    let vtabs = []
    for (let j = 0; j < categories.length; j++) {
      let item = categories[j]
      this.getGoodsListByCategory(item.id, j)
      vtabs.push({
        title: item.categoryName,
        id: item.id
      })
    }
    this.setData({
      vtabs,
      loading: false,
    })
    wx.hideLoading()
  },

  async getGoodsListByCategory(categoryId, index, loadNextPage = false) {
    const pageSize = 5
    let pageIndex = 1
    const listMap = this.data.goodsListMap[categoryId]

    if (listMap) {
      if (listMap.metadata) {
        const {
          currentPage,
          lastPage
        } = listMap.metadata
        if (currentPage && lastPage) {
          // 加载完了, 就不要重复加载了
          if (currentPage >= lastPage) return
          pageIndex = currentPage
          if (loadNextPage) pageIndex++
        }
      }
    }
    let goodsData = await wx.wxp.request({
      url: `http://localhost:8000/goods?page=${pageIndex}&page_size=${pageSize}&category_id=${categoryId}`,
    })
    if (goodsData) goodsData = goodsData.data

    if (listMap && listMap.goodsList) {
      listMap.goodsList.push(...goodsData.goodsList)
      listMap.metadata = goodsData.metadata
      this.setData({
        [`goodsListMap[${categoryId}]`]: listMap
      })
    } else {
      this.setData({
        [`goodsListMap[${categoryId}]`]: goodsData
      })
    }

    // 重新计算高度
    this.reCalcChildHeight(index)
  },

  onTabCLick(e) {
    const index = e.detail.index
  },

  onChange(e) {
    const index = e.detail.index
  },

  onScrollToIndexLower(e) {
    let index = e.detail.index;
    // 这是一个多发事件，要注意处理是否重复触发
    if (index != this.data.lastIndexForLoadMore) {
      let cate = this.data.vtabs[index]
      let categoryId = cate.id
      this.getGoodsListByCategory(categoryId, index, true)
      this.data.lastIndexForLoadMore = index
    }
  },

  reCalcChildHeight(index) {
    const categoryVtabs = this.selectComponent('#category-vtabs')
    const goodsContent = this.selectComponent(`#goods-content${index}`)
    categoryVtabs.calcChildHeight(goodsContent)
  },
  async onGoodsTap(e) {
    const goodsid = e.currentTarget.dataset['goodsid']
    if (!goodsid) {
      return
    }
    wx.showLoading({
      title: 'Loading...',
    })

    let res = await wx.wxp.request({
      url: `http://localhost:8000/goods/${goodsid}`
    })
    if (res && res.data && res.data.goods) {
      const goodsDetail = res.data.goods

      wx.navigateTo({
        url: `../goods/index?goodsid=${goodsid}`,
        success: function(res) {
          res.eventChannel.emit('goodsEvent', {
            data: goodsDetail
          })
        }
      })
    }

    wx.hideLoading()
  }

})