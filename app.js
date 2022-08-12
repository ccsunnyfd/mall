// app.js
import wxp from './lib/wxp'
import Event from './lib/event2'

// getApp().globalEvent
App({
  wxp: (wx.wxp = wxp),
  globalData: (wx.globalData = {}),
  globalEvent: (wx.globalEvent = new Event()),
  onLaunch: function () {
    this.globalData = {}
  }
})