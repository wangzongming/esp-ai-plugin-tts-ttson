
const { PassThrough } = require('stream');
const https = require('https');


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
    * 插件逻辑
    * @param {String} device_id 设备id 
    * @param {String} text 待播报的文本 
    * @param {Boolean} pauseInputAudio 客户端是否需要暂停音频采集
    * @param {Boolean} reRecord TTS播放完毕后是再次进入iat识别环节
    * @param {Function} (is_over, audio, TTS_resolve)=> void 音频回调
    * @return {Function} (pcm)=> Promise<Boolean>
    */
    main(device_id, { text, reRecord = false, pauseInputAudio = true, cb }) {
        const { devLog, api_key, tts_server, tts_params_set } = G_config;

        const config = {
            token: api_key[tts_server].token,
        }

        const url = `https://u95167-bd74-2aef8085.westx.seetacloud.com:8443/flashsummary/tts?token=${config.token}`;
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
                const req = https.request(url, options, (res) => {
                    let data = '';

                    res.on('data', (chunk) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        if (res.statusCode !== 200) {
                            console.error(`Error: ${res.statusCode}`);
                            reject(null);
                        } else {
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


        return new Promise(async (resolve) => {
            devLog && console.log('\n=== 开始请求TTS: ', text, " ===");
            const ar = await getAR();

            if (ar) {
                devLog && console.log("音频地址：", ar);

                const { ws: ws_client, tts_list } = G_devices.get(device_id);
                // 开始播放直接先让 esp32 暂停采集音频，不然处理不过来
                if (pauseInputAudio) {
                    ws_client && ws_client.send("pause_voice");
                    G_devices.set(device_id, {
                        ...G_devices.get(device_id),
                        client_out_audio_ing: true,
                    })
                }
                const wavStream = wavUrlToStream(ar);
                const curTTSKey = tts_list.size;
                const curTTSWs = wavStream;
                tts_list.set(curTTSKey, curTTSWs)

                devLog && console.log("-> tts服务连接成功！")
                wavStream.on('data', (chunk) => {
                    // console.log(`Received ${chunk.length} bytes of data.`);
                    //     let audioBuf = Buffer.from(audio, 'base64')
                    cb({
                        // 根据服务控制
                        is_over: false,
                        audio: chunk,

                        // 固定写法
                        TTS_resolve: resolve,
                        curTTSWs,
                        curTTSKey,
                        device_id,
                        reRecord,
                    });
                });
                wavStream.on('end', () => {
                    console.log('No more data.');
                    cb({
                        // 根据服务控制
                        is_over: true,
                        audio: "",
                        // 固定写法
                        TTS_resolve: resolve,
                        curTTSWs,
                        curTTSKey,
                        device_id,
                        reRecord,
                    });
                });
                wavStream.on('error', (err) => {
                    console.error(`Stream error: ${err.message}`);
                });

            } else {
                devLog && console.log(`tts错误 ${res.code}: ${res.message}`)
                curTTSWs.close()
                resolve(false);

            }

        })
    }
}
