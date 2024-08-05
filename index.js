const Nls = require('alibabacloud-nls')
const RPCClient = require('@alicloud/pop-core').RPCClient;



/**
 * esp-ai TTS 插件开发
 * 
 * 演示请求海豚配音服务，并且流式返回到客户端
*/
module.exports = {
    // 插件名字
    name: "esp-ai-plugin-tts-aliyun",
    // 插件类型 LLM | TTS | IAT
    type: "TTS",
    /**
     * TTS 插件封装 
     * @param {String}      device_id           设备ID   
     * @param {String}      text                待播报的文本   
     * @param {Object}      api_key             用户配置的key   
     * @param {Number}      devLog              日志输出等级，为0时不应该输出任何日志   
     * @param {Function}    tts_params_set      用户自定义传输给 TTS 服务的参数，eg: tts_params_set(参数体)
     * @param {Function}    logWSServer         将 ws 服务回传给框架，如果不是ws服务可以这么写: logWSServer({ close: ()=> {} })
     * @param {Function}    ttsServerErrorCb    与 TTS 服务之间发生错误时调用，并且传入错误说明，eg: ttsServerErrorCb("意外错误")
     * @param {Function}    cb                  TTS 服务返回音频数据时调用，eg: cb({ audio: 音频base64, ... })
     * @param {Function}    log                 为保证日志输出的一致性，请使用 log 对象进行日志输出，eg: log.error("错误信息")、log.info("普通信息")、log.tts_info("tts 专属信息")
    */
    main({ device_id, text, devLog, api_key, logWSServer, tts_params_set, cb, log, ttsServerErrorCb }) {
        const config = { ...api_key }

        function genToekn() {
            return new Promise((resolve) => {
                const client = new RPCClient({
                    accessKeyId: config.AccessKeyID,
                    accessKeySecret: config.AccessKeySecret,
                    endpoint: 'https://nls-meta.cn-shanghai.aliyuncs.com',
                    apiVersion: '2019-02-28'
                });
                client.request('CreateToken').then((result) => {
                    config.token = result.Token.Id;
                    resolve();
                    // console.log(result)
                    // console.log("token = " + result.Token.Id)
                    // console.log("expireTime = " + result.Token.ExpireTime)
                });
            })
        }


        return new Promise(async (resolve) => {
            await genToekn();
            const tts = new Nls.SpeechSynthesizer({
                url: "wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1",
                appkey: config.appkey,
                token: config.token,
            })
            const wss = { close: () => { } }
            logWSServer(wss);
            tts.on("data", (msg) => {
                // console.log(`recv size: ${msg.length}`)  
                let audioBuf = Buffer.from(msg, 'base64')
                cb({
                    // 根据服务控制
                    is_over: false,
                    audio: audioBuf,
                    // 固定写法
                    resolve: resolve,
                    ws: wss
                });
            })

            tts.on("completed", (msg) => {
                // console.log("Client recv completed:", msg)
                cb({
                    // 根据服务控制
                    is_over: true,
                    audio: "",
                    // 固定写法
                    resolve: resolve,
                    ws: wss
                });
            })

            // tts.on("closed", () => {
            //     console.log("Client recv closed")
            // }) 
            tts.on("failed", (msg) => {
                ttsServerErrorCb(`tts错误: ${msg}`)
                resolve(false);
            })

            const param = tts.defaultStartParams()
            param.text = text
            // param.voice = "zhiyuan"

            try {
                tts.start(tts_params_set ? tts_params_set(param) : param, true, 6000)
            } catch (error) {
                ttsServerErrorCb(`tts错误: ${error}`)
                resolve(false);
            } finally {

            }

        })
    }
}
