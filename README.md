# esp-ai-plugin-tts-ttson [![npm](https://img.shields.io/npm/v/esp-ai-plugin-tts-ttson.svg)](https://www.npmjs.com/package/esp-ai-plugin-tts-ttson) [![npm](https://img.shields.io/npm/dm/esp-ai-plugin-tts-ttson.svg?style=flat)](https://www.npmjs.com/package/esp-ai-plugin-tts-ttson)

让 ESP-AI 支持海豚配音的 `TTS` 插件 

# 安装
在你的 `ESP-AI` 项目中执行下面命令
```
npm i esp-ai-plugin-tts-ttson
```

# 使用 
```
const espAi = require("esp-ai"); 

espAi({
    ... 

    // 配置使用插件并且为插件配置api-key
    tts_server: "esp-ai-plugin-tts-ttson",
    api_key: {
        "esp-ai-plugin-tts-ttson": {
            token: "ht-xxx"
        },
    },

    // 引入插件
    plugins: [ 
        require("esp-ai-plugin-tts-ttson")
    ],

    // 详细参数
    tts_params_set: (params) => {  
        /** 海豚配音 **/
        // token注册：https://www.ttson.cn/ 
        // 说话人列表见：角色列表.yaml
        // params.voice_id = 430;
        params.voice_id = 1683;

        // 改完后一定要返回出去
        return params;
    },
});
```

