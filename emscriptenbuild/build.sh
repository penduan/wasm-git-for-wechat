#!/bin/bash

set -e

message() {
    echo -e "\e[1;93mbuild hint:${*}\e[0m"
}

CWD=$(dirname $0)
CMD_PWD=$PWD

BUILD_TYPE=Release
BUILD_COPY=false
EXTRA_CMAKE_C_FLAGS="-O3"
ASYNCIFY_FLAGS="-s ASYNCIFY -sASYNCIFY_IMPORTS=['emscriptenhttp_do_get','emscriptenhttp_do_read','emscriptenhttp_do_post']"

EXTRA_CMAKE_EXE_LINK_FLAGS=$ASYNCIFY_FLAGS

EXPORTED_RUNTIME_METHODS="$CMD_PWD/emscriptenbuild/exportedRuntimeMethods.json"
EXPORTED_FUNCTIONS="$CMD_PWD/emscriptenbuild/exportedFunctions.json"

if [ "$1" == "reset" ]; then
    message "Reset workspaces."
    echo ".reset" > "$CMD_PWD/.reset"
    exit 1
fi

# Debug mode.[default: Release mode]
if [ "$1" == "Debug" ]; then
    BUILD_TYPE=Debug
    EXTRA_CMAKE_C_FLAGS="-O1 -g1"
    EXTRA_CMAKE_EXE_LINK_FLAGS="$EXTRA_CMAKE_EXE_LINK_FLAGS -sASSERTIONS"
fi

if [ "$2" == "cp" ]; then
    BUILD_COPY=true
    BUILD_COPY_PATH=$3
fi

run_init() {
    message "Build mode -> $BUILD_TYPE"
    message "initializing"
    # Reset in case we've done an '-async' build
    cp $CMD_PWD/libgit2patchedfiles/src/transports/emscriptenhttp-async.c $CMD_PWD/libgit2/src/libgit2/transports/emscriptenhttp.c

    # Before building, remove any ../libgit2/src/transports/emscriptenhttp.c left from running setup.sh 
    if [ -f "$CMD_PWD/libgit2/src/libgit2/transports/emscriptenhttp-async.c" ]; then
        rm $CMD_PWD/libgit2/src/libgit2/transports/emscriptenhttp-async.c
    fi
}

# Currently don't need support sync build.
run_sync_build() { 
    # Reset in case we've done an '-async' build
    # cp ../libgit2patchedfiles/src/transports/emscriptenhttp.c ../libgit2/src/libgit2/transports/emscriptenhttp.c
    echo "TODO"
}

run_cmake() {
    local env=$1
    local build_dir=$2
    local ld_flags=${@:3}

    message "Running cmake build -> $2"

    emcmake cmake ../libgit2 -B $build_dir \
        -DCMAKE_BUILD_TYPE=$BUILD_TYPE     \
        -DSONAME=OFF                       \
        -DUSE_HTTPS=OFF                    \
        -DBUILD_SHARED_LIBS=OFF            \
        -DTHREADSAFE=OFF                   \
        -DUSE_SSH=OFF                      \
        -DBUILD_CLAR=OFF                   \
        -DBUILD_EXAMPLES=ON                \
        -DCMAKE_C_FLAGS="$EXTRA_CMAKE_C_FLAGS -Wall     \
            $EXTRA_CMAKE_EXE_LINK_FLAGS $ld_flags       \
            -s ENVIRONMENT=$env            \
            -s EXPORTED_RUNTIME_METHODS=@$EXPORTED_RUNTIME_METHODS \
            -s EXPORTED_FUNCTIONS=@$EXPORTED_FUNCTIONS             \
            -s INVOKE_RUN=0                \
            -s ALLOW_MEMORY_GROWTH=1       \
            -s STACK_SIZE=131072           \
            -s MODULARIZE=1                \
            "

}

run_make() {
    local build_dir=$1

    message "Running make lg2 -> $1"

    cd $build_dir
    emmake make lg2
    cd $CMD_PWD
}

run_wechat_adapter() {
    # 替换不支持的内容

    message "Adapte wechat platform."
    cd "$1/examples"
    sed -i "s/require(.fs.)/getWeChatFS()/g" ./lg2.js
    sed -i "s/require(.path.)/getPathAdapter()/g" ./lg2.js
    sed -i 's/return getBinaryPromise(/return getWasmFilePath(/g' ./lg2.js

    message "Compressing lg2.wasm[brotli]"
    brotli -f ./lg2.wasm
    
    cd $CMD_PWD
}



run_wechat() {
    local build_dir="$CWD/wechat/$BUILD_TYPE"

    message "Build wechat -> $build_dir"
    if [ ! -d $build_dir ] || [ -f "$CMD_PWD/.reset" ] ; then
    run_cmake node $build_dir                    \
        --extern-pre-js "$CMD_PWD/emscriptenbuild/wechatfs.js"     \
        --pre-js "$CMD_PWD/emscriptenbuild/wechat-pre.js"       \
        --post-js "$CMD_PWD/emscriptenbuild/wechat-post-async.js"  \
        -lnodefs.js
    fi

    run_make $build_dir

    run_wechat_adapter $build_dir

    if $BUILD_COPY; then
        message "copy to $BUILD_COPY_PATH"
        cp "$build_dir/examples/lg2.js" "$BUILD_COPY_PATH/mp"
        cp "$build_dir/examples/lg2.wasm.br" "$BUILD_COPY_PATH/mp"
    fi

}

run_web() {
    local build_dir="$CWD/web/$BUILD_TYPE"

    message "Build web -> $build_dir"

    if [ ! -d $build_dir ] || [ -f "$CMD_PWD/.reset" ] ; then
        run_cmake worker $build_dir            \
            --post-js "$CMD_PWD/emscriptenbuild/post-async.js"   \
            --pre-js "$CMD_PWD/emscriptenbuild/pre.js"           \
            -lidbfs.js
    fi

    run_make $build_dir

    if $BUILD_COPY; then
        message "copy to $BUILD_COPY_PATH"
        cp "$build_dir/examples/lg2.js" "$BUILD_COPY_PATH/web"
        cp "$build_dir/examples/lg2.wasm" "$BUILD_COPY_PATH/web"
    fi
}

run_init

run_wechat
run_web

if [ -f "$CMD_PWD/.reset" ]; then
    rm "$CMD_PWD/.reset"
fi
