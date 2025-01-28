
const { PassThrough } = require('stream');
const https = require('https');
const http = require('http');


function wavUrlToStream(url) {
    const stream = new PassThrough();

    https.get(url, (response) => {
        if (response.statusCode !== 200) {
            stream.emit('error', new Error(`Request failed with status code ${response.statusCode}`));
            return;
        }

        response.pipe(stream);
    }).on('error', (err) => {
        stream.emit('error', err);
    });

    return stream;
}

/**
 * esp-ai TTS 插件开发
 * 
 * 演示请求海豚配音服务，并且流式返回到客户端
*/
module.exports = {
    // 插件名字
    name: "esp-ai-plugin-tts-ttson",
    // 插件类型 LLM | TTS | IAT
    type: "TTS",
    /**
     * TTS 插件封装 
     * @param {String}      device_id           设备ID   
     * @param {String}      text                待播报的文本   
     * @param {Object}      tts_config          用户配置的 apikey 等信息    
     * @param {String}      iat_server          用户配置的 iat 服务 
     * @param {String}      llm_server          用户配置的 llm 服务 
     * @param {String}      tts_server          用户配置的 tts 服务 
     * @param {Number}      devLog              日志输出等级，为0时不应该输出任何日志   
     * @param {Function}    tts_params_set      用户自定义传输给 TTS 服务的参数，eg: tts_params_set(参数体)
     * @param {Function}    logWSServer         将 ws 服务回传给框架，如果不是ws服务可以这么写: logWSServer({ close: ()=> { 中断逻辑...  } })
     * @param {Function}    ttsServerErrorCb    与 TTS 服务之间发生错误时调用，并且传入错误说明，eg: ttsServerErrorCb("意外错误")
     * @param {Function}    cb                  TTS 服务返回音频数据时调用，eg: cb({ audio: 音频base64, ... })
     * @param {Function}    log                 为保证日志输出的一致性，请使用 log 对象进行日志输出，eg: log.error("错误信息")、log.info("普通信息")、log.tts_info("tts 专属信息")
    */
    async main({ text, devLog, tts_config,  logWSServer, tts_params_set, cb, log, ttsServerErrorCb, connectServerCb, connectServerBeforeCb }) {
        const config = { ...tts_config }

        const url = config.url ? `${config.url}?token=${config.token}` : `https://u95167-bd74-2aef8085.westx.seetacloud.com:8443/flashsummary/tts?token=${config.token}`;
        let language = "ZH";

        if (/[a-zA-Z]/.test(text)) {
            language = "auto";
        }

        const _payload = {
            voice_id: 1683,
            text: text,
            format: "wav",
            to_lang: language,
            auto_translate: 0,
            voice_speed: "0%",
            speed_factor: 1,
            rate: "1.0",
            client_ip: "ACGN",
            emotion: 1,
            volume_change_dB: 4,
            zip_level: 4, // 16k
            // zip_level: 5, // 24k
        }
        const payload = JSON.stringify(tts_params_set ? tts_params_set(_payload) : _payload);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            }
        };

        const getAR = () => {
            return new Promise((resolve, reject) => {
                connectServerBeforeCb();
                const fetchFn = url.indexOf("https://") !== -1 ? https : http;
                const req = fetchFn.request(url, options, (res) => {
                    connectServerCb(true);
                    let data = '';

                    res.on('data', (chunk) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        if (res.statusCode !== 200) {
                            log.error(`Error: ${data}`);
                            reject(null);
                        } else {
                            // console.log('responseJson', responseJson)
                            const responseJson = JSON.parse(data);
                            resolve(`${responseJson.url}:${responseJson.port}/flashsummary/retrieveFileData?stream=True&token=${config.token}&voice_audio_path=${responseJson.voice_path}`);
                        }
                    });
                });
                req.on('error', (e) => {
                    console.error(`Error fetching audio URL: ${e.message}`);
                    reject(null);
                });

                req.write(payload);
                req.end();
            })
        }


        const ar = await getAR();

        if (ar) {
            // devLog && log.tts_info("音频地址：", ar);

            const wavStream = wavUrlToStream(ar);
            logWSServer(wavStream)


            devLog && log.tts_info("-> tts服务连接成功！")
            wavStream.on('data', (chunk) => {
                // log.tts_info(`Received ${chunk.length} bytes of data.`);
                //     let audioBuf = Buffer.from(audio, 'base64')
                cb({
                    // 根据服务控制
                    is_over: false,
                    audio: chunk, 
                    ws: wavStream
                });
            });
            wavStream.on('end', () => {
                cb({
                    // 根据服务控制
                    is_over: true,
                    audio: "", 
                    ws: wavStream
                });
            });
            wavStream.on('error', (err) => {
                log.error(`Stream error: ${err.message}`);
            });

        } else {
            curTTSWs.close()
            ttsServerErrorCb(`tts错误 ${res.code}: ${res.message}`) 

        }
    }
}
