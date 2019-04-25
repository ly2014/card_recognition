//index.js
const app = getApp()

Page({
  data: {
    fileID: null,
    coverImage: '',
    name: '',
    phone: ''
  },

  // 上传图片
  doUpload: function () {
    // 从相册和相机中获取图片
    wx.chooseImage({
      success: dRes => {
        // 展示加载组件
        wx.showLoading({
          title: '上传文件',
        });

        let cloudPath = `${Date.now()}-${Math.floor(Math.random(0, 1) * 1000)}.png`;

        // 云开发新接口，用于上传文件
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: dRes.tempFilePaths[0],
          success: res => {
            if (res.statusCode < 300) {
              this.setData({
                fileID: res.fileID,
              }, () => {
                // 获取临时链接
                this.getTempFileURL();
              });
            }
          },
          fail: err => {
            // 隐藏加载组件并提示
            wx.hideLoading();
            wx.showToast({
              title: '上传失败',
              icon: 'none'
            });
          },
        })
      },
      fail: console.error,
    })
  },

  getTempFileURL: function() {
    // 云开发新接口，用于获取文件的临时链接
    wx.cloud.getTempFileURL({
      fileList: [{
        fileID: this.data.fileID,
      }],
    }).then(res => {
      console.log('获取成功', res);
      let files = res.fileList;

      if (files.length) {
        this.setData({
          coverImage: files[0].tempFileURL
        }, () => {
          this.parseNameCard();
        });
      }
      else {
        wx.showToast({
          title: '获取图片链接失败',
          icon: 'none'
        });
      }

    }).catch(err => {
      console.error('获取失败', err);
      wx.showToast({
        title: '获取图片链接失败',
        icon: 'none'
      });
      wx.hideLoading();
    });
  },

  addNameCard: function(name, phone) {
    const db = wx.cloud.database();
    db.collection('namecard').add({
      data: {
        name: name,
        phone: phone
      }
    })
  },

  parseNameCard: function() {
    wx.showLoading({
      title: '解析名片',
    });
    console.log(this.data.coverImage)

    // 云开发新接口，调用云函数
    wx.cloud.callFunction({
      name: 'parseNameCard',
      data: {
        url: this.data.coverImage
      }
    }).then(res => {
      if (res.code || !res.result || !res.result.data) {
        wx.showToast({
          title: '解析失败，请重试',
          icon: 'none'
        });
        wx.hideLoading();
        return;
      }

      let data = res.result.data;
      let name = ''
      let phone = ''
      for(let i = 0; i < data.length; i++) {
        let item = data[i]
        if(item['item'] == '姓名') {
          name = item['value']
        } else if (item['item'] == '手机') {
          phone = item['value']
        }
      }
      if(name != '' && phone != '') {
        this.addNameCard(name, phone)
      }
      this.setData({
        name: name,
        phone: phone
      });
      wx.hideLoading();
    }).catch(err => {
      console.error('解析失败，请重试。', err);
      wx.showToast({
        title: '解析失败，请重试',
        icon: 'none'
      });
      wx.hideLoading();
    });
  },

  // 保存号码至通讯录
  doSave: function() {
    if (this.data.name == '' || this.data.phone == '') {
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
      return;
    } else {
      wx.addPhoneContact({
        firstName: this.data.name,
        mobilePhoneNumber: this.data.phone,
        success: function() {
          wx.showToast({
            title: '保存成功',
            icon: 'none'
          });
        },
        error: function() {
          wx.showToast({
            title: '保存失败，请重试',
            icon: 'none'
          });
        }
      })
    }
  },

  doClear: function() {
    this.setData({
      coverImage: null,
      fileID: null,
      name: '',
      phone: ''
    });
  }
})
