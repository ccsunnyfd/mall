import {
  promisifyAll
} from 'miniprogram-api-promise';

// const wxp = {}
const URL_BASE = 'http://localhost:8000'

const wxp = {
  URL_BASE
}
promisifyAll(wx, wxp)

// compatible usage
// wxp.getSystemInfo({success(res) {console.log(res)}})

// 带token请求，并捕捉错误 
wxp.requestWithToken = function (args) {
  const token = wx.getStorageSync('token')
  if (token) {
    if (!args.header) args.header = {}
    args.header['Authorization'] = `Bearer ${token}`
  }
  if (args.url) args.url = args.url.replace(/^http:\/\/localhost:3000/,URL_BASE)
  return wxp.request(args).catch(function (reason) {
    console.log('reason', reason)
  })
}

// 
// wxp.requestWithLoginCheck = function(args){
//   const token = wx.getStorageSync('token')
//   if (!token){
//     return new Promise((resolve, reject)=>{
//       let pageStack = getCurrentPages()
//       if (pageStack && pageStack.length > 0) {
//         let currentPage = pageStack[pageStack.length-1]
//         currentPage.setData({
//           showLoginPanel2:true
//         })
//         getApp().globalEvent.once("loginSuccess", ()=>{
//           wxp.requestWithToken(args).then(res=>{
//             resolve(res)
//           }, err=>{
//             console.log('err', err);
//             reject(err)
//           })
//         })
//       }else{
//         reject('page valid err')
//       }
//     })
//   }
//   return wxp.requestWithToken(args)
// }

/**
 * 整合登陆组件
 */ 
wxp.requestX = function (args) {
  let {token} = getApp().globalData
  if (!token) {
    token = wx.getStorageSync('token')
  }
  if (!token) {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    // 展示登陆浮窗
    currentPage.setData({
      showLoginPanel: true
    })
    return new Promise((resolve, reject) => {
      getApp().globalEvent.once('loginSuccess', function (e) {
        wxp.requestWithToken(args).then(function (result) {
          resolve(result)
        }).catch(function (reason) {
          console.log('reason', reason);
        })
      })
    })
  }
  return wxp.requestWithToken(args)
}

export default wxp