# esp-ai-plugin-tts-ttson [![npm](https://img.shields.io/npm/v/esp-ai-plugin-tts-ttson.svg)](https://www.npmjs.com/package/esp-ai-plugin-tts-ttson) [![npm](https://img.shields.io/npm/dm/esp-ai-plugin-tts-ttson.svg?style=flat)](https://www.npmjs.com/package/esp-ai-plugin-tts-ttson)

让 ESP-AI 支持海豚配音的 `TTS` 服务的插件

 

# 安装
在你的 `ESP-AI` 项目中执行下面命令
```bash
npm i esp-ai-plugin-tts-ttson
```

# 使用 
```js
const espAi = require("esp-ai"); 

espAi({ 
    // 配置使用插件并且为插件配置api-key
    tts_server: "esp-ai-plugin-tts-ttson",
    tts_config: {
        // token， 不给的情况下有 1000 个字的免费额度
        // 注册地址：https://www.ttson.cn/ 
        // token: "ht-xxx", 

        // 说话人列表见：角色列表.yaml
        voice_id: 1683;
    }, 

    // 引入插件
    plugins: [ 
        require("esp-ai-plugin-tts-ttson")
    ], 
});
```

