# 关于此项目

在[wasm-git](https://github.com/petersalomonsen/wasm-git)基础上简单的适配了微信小程序环境。

可以在小程序内使用libgit2的特性功能来构建git仓库管理工具。


## 构建说明

在微信小程序下使用时`文件系统`需要自行适配


```shell
# 构建Release
./emscriptenbuild/build.sh

# 构建Debug
./emscriptenbuild/build.sh Debug

# 在相应构建第一次构建后,就不再执行emcmake cmake命令进行检查更新,如修改了cmake配置需要检查更新时可以使用
./emscriptenbuild/build.sh reset 
```