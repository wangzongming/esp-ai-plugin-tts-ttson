# esp-ai-plugin-tts-aliyun [![npm](https://img.shields.io/npm/v/esp-ai-plugin-tts-aliyun.svg)](https://www.npmjs.com/package/esp-ai-plugin-tts-aliyun) [![npm](https://img.shields.io/npm/dm/esp-ai-plugin-tts-aliyun.svg?style=flat)](https://www.npmjs.com/package/esp-ai-plugin-tts-aliyun)

让 ESP-AI 支持阿里云的 `TTS` 服务的插件


阿里云`TTS`服务控制台: https://ai.aliyun.com/nls/tts

开通文档：https://help.aliyun.com/zh/isi/getting-started/start-here?spm=a2c4g.11186623.0.0.cda774c1GbPCap


# 安装
在你的 `ESP-AI` 项目中执行下面命令
```bash
npm i esp-ai-plugin-tts-aliyun
```

# 使用 
```js
const espAi = require("esp-ai"); 

espAi({ 
    // 配置使用插件并且为插件配置api-key
    tts_server: "esp-ai-plugin-tts-aliyun",
    api_key: {
        "esp-ai-plugin-tts-aliyun": {
            // 打开网址获取： https://nls-portal.console.aliyun.com/applist 
            appkey:"xxx",

            // 打开网址获取：https://ram.console.aliyun.com/users
            AccessKeyID: "xxx",
            AccessKeySecret: "xxx",
        },
    },

    // 引入插件
    plugins: [ 
        require("esp-ai-plugin-tts-aliyun")
    ],

    // 详细参数
    tts_params_set: (params) => {   
        // 音色列表： https://help.aliyun.com/zh/isi/developer-reference/overview-of-speech-synthesis?spm=a2c4g.11186623.0.0.7cd34988EWX6m3#section-uft-ohr-827
       // 这个音色必须在控制台开通才行
        param.voice = "zhiyuan"

        // 改完后一定要返回出去
        return params;
    },
});
```

