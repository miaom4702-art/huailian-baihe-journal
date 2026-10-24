# 淮联百合期刊 Android 应用

## 当前产物

- 测试 APK：`D:\hlbh-app\dist\淮联百合期刊-debug.apk`
- 包名：`org.hlbh.journal`
- 类型：Debug 测试包，已使用 Android 调试证书签名，可直接侧载安装
- 加载地址：`https://journal.example.com`
- 联网要求：首次打开及使用期间需要网络

## 技术方案

Capacitor 8 + Android WebView。应用本身是移动端壳，内容加载线上期刊网站；登录、投稿、评论、图片上传等仍由网站处理。

## 安装

1. 将 `dist\淮联百合期刊-debug.apk` 传到 Android 手机；
2. 允许“安装未知来源应用”；
3. 安装并打开。若出现系统安全提示，是因为这是 Debug 测试签名，不是应用商店版本。

## 重新构建

本机环境：

- JDK：`C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot`
- Android SDK：`D:\android-sdk`（platform 36 / build-tools 36.0.0）
- Gradle：`D:\gradle-8.14.3`

```powershell
cd D:\hlbh-app
npx cap sync android

$env:ANDROID_HOME="D:\android-sdk"
$env:ANDROID_SDK_ROOT="D:\android-sdk"
$env:JAVA_HOME="C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"

cd android
& "D:\gradle-8.14.3\bin\gradle.bat" assembleDebug --no-daemon
```

生成文件：

`android\app\build\outputs\apk\debug\app-debug.apk`

## 修改加载地址

编辑 `capacitor.config.json` 的 `server.url`，然后：

```powershell
cd D:\hlbh-app
npx cap sync android
cd android
& "D:\gradle-8.14.3\bin\gradle.bat" assembleDebug --no-daemon
```

## 后续发布正式版

当前为 Debug 测试包。若要发布或上架应用商店，需要：

1. 创建正式 keystore；
2. 配置 `android/app/build.gradle` 签名；
3. 执行 `assembleRelease`；
4. 妥善保管 keystore，后续更新必须使用同一签名；
5. 准备隐私政策、应用图标、截图与商店资料。

## 已知限制

- 没有离线模式，网站不可用时应用只显示加载失败；
- 未做原生推送、支付或离线缓存；
- 未在真实手机上做最终安装测试（构建机没有连接 Android 设备）；
- 当前加载的是临时域名，正式域名确定后需要修改并重新打包。
