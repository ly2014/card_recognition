const cloud = require('wx-server-sdk')
const { ImageClient } = require('image-node-sdk');
let AppId = ''; // 腾讯云 AppId
let SecretId = ''; // 腾讯云 SecretId
let SecretKey = ''; // 腾讯云 SecretKey
const imgClient = new ImageClient({
  AppId,
  SecretId,
  SecretKey
});
cloud.init()


exports.main = async (event) => {
  const idCardImageUrl = event.url;
  const result = await imgClient.ocrBizCard({
    data: {
      url_list: [idCardImageUrl],
    },
  })
  return JSON.parse(result.body)['result_list'][0]
};