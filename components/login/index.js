Component({
  options: {
    multipleSlots: false
  },
  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },
  observers: {
    'show': function (value) {
      console.log(value);

      this.setData({
        visible: value
      })
    }
  },
  data: {
    visible: false
  },
  ready() {},
  methods: {
    close(e) {
      this.setData({
        visible: false
      })
    },
    async login(e, retryNum = 0) {
      const {
        userInfo,
        encryptedData,
        iv
      } = e.detail

      // 本地token与微信服务器上的session要分别对待
      let tokenIsValid = false,
        sessionIsValid = false
      const res0 = await getApp().wxp.checkSession().catch(err => {
        // 清理登陆状态，会触发该错误
        // checkSession:fail 系统错误，错误码：-13001,session time out…d relogin
        console.log("err", err);
        sessionIsValid = false
      })
      console.log("res0", res0);
      if (res0 && res0.errMsg === "checkSession:ok") sessionIsValid = true
      const token = wx.getStorageSync('token')
      if (token) tokenIsValid = true

      if (!tokenIsValid || !sessionIsValid) {
        const res1 = await getApp().wxp.login()
        const {code} = res1
        // console.log("code", code);

        const res = await getApp().wxp.request({
          url: `${getApp().wxp.URL_BASE}/user/wexin-login2`,
          method: 'POST',
          header: {
            'content-type': 'application/json',
            'Authorization': `Bearer ${token || ''}`
          },
          data: {
            code,
            userInfo,
            encryptedData,
            iv,
            sessionKeyIsValid: sessionIsValid
          }
        })

        if (res.statusCode == 500) {
          if (retryNum < 3) {
            this.login.apply(this, [e, ++retryNum])
          } else {
            wx.showModal({
              title: '登录失败',
              content: '请退出小程序，清空记录并重试',
            })
          }
          return
        }
        // Error: Illegal Buffer at WXBizDataCrypt.decryptData
        console.log('登录接口请求成功', res.data)
        token = res.data.data.authorizationToken
        wx.setStorageSync('token', token)
        console.log('authorization', token)
      }

      getApp().globalData.token = token
      wx.showToast({
        title: '登陆成功了',
      })
      this.close()
      // 注意这个地方的区别. this.triggerEvent只能传递给组件父容器，调用组件时通过bindEvent进行handle. 而globalEvent.emit是全局事件
      this.triggerEvent('loginSuccess')
      getApp().globalEvent.emit('loginSuccess')
    },
    // checkSession -> login -> requestLoginApi -> onUserLogin
    login2(e) {
      const {
        userInfo,
        encryptedData,
        iv
      } = e.detail
      // console.log('userInfo', userInfo);

      // 向后台服务发请求获取服务自定义token，存到本地存储，调用onUserLogin把token存全局内存并全局发登录成功事件
      const requestLoginApi = (code) => {
        //发起网络请求
        wx.request({
          url: 'http://localhost:3000/user/wexin-login2',
          method: 'POST',
          header: {
            'content-type': 'application/json'
          },
          data: {
            code: code,
            userInfo,
            encryptedData,
            iv
          },
          success(res) {
            console.log('请求成功', res.data)
            const token = res.data.data.authorizationToken
            wx.setStorageSync('token', token)
            onUserLogin(token)
            console.log('authorization', token)
          },
          fail(err) {
            console.log('请求异常', err)
          }
        })
      }

      // 把token存全局内存，全局发登录成功事件
      const onUserLogin = (token) => {
        getApp().globalData.token = token
        wx.showToast({
          title: '登陆成功了',
        })
        this.close()
        this.triggerEvent('loginSuccess')
        getApp().globalEvent.emit('loginSuccess')
      }

      // 微信登录，拿到code，调requestLoginApi向后台请求自定义token
      const login = () => {
        wx.login({
          success(res0) {
            if (res0.code) {
              requestLoginApi(res0.code)
            } else {
              console.log('登录失败！' + res0.errMsg)
            }
          }
        })
      }

      // 检查会话
      wx.checkSession({
        success() {
          //session_key 未过期，并且在本生命周期一直有效
          console.log('在登陆中');
          const token = wx.getStorageSync('token')
          if (token) {
            onUserLogin(token)
          } else {
            // session会重复，需要处理
            login()
          }
        },
        fail() {
          // session_key 已经失效，需要重新执行登录流程
          login()
        }
      })
    }
  }
})