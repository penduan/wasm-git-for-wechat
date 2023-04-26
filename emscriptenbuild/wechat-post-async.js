/**
 * Javascript functions for emscripten http transport for nodejs and the browser NOT using a webworker
 * 
 * If you can't use a webworker, you can build Release-async or Debug-async versions of wasm-git
 * which use async transports, and can be run without a webworker. The lg2 release files are about
 * twice the size with this option, and your UI may be affected by doing git operations in the
 * main JavaScript thread.
 * 
 * This the non-webworker version (see also post.js)
 */

const emscriptenhttpconnections = {};
let httpConnectionNo = 0;

function wxRequest(url, method, headers) {

    return async function(data = undefined) {
        let requestTask;

        function fetch() {
            return new Promise((resolve, reject) => {
                requestTask = wx.request({
                    url,
                    method,
                    data,
                    responseType: 'arraybuffer',
                    header: headers,
                    success: resolve,
                    fail: reject
                });
            })
        }
        let response = await fetch();

        if (response.statusCode == 401) {
            let user = wx.getStorageSync("userpasswd");
            if (!user) {
                throw new Error("No set user");
            }
            
            let authHeader = response.header("Www-Authenticate") ?? "";
            let authScheme = authHeader.split(" ")[0] ?? "Basic";
            
            let authValue;
            if (authScheme == "Basic") {
                authValue = "Basic " + btoa(user.user + ":" + user.passwd);
            }

            headers['Authorization'] = authValue;
            response = await fetch();
        }
        
        return { response, requestTask }
    }
}

const chmod = FS.chmod;
    
FS.chmod = function(path, mode, dontFollow) { 
    if (mode === 0o100000 > 0) {
        // workaround for libgit2 calling chmod with only S_IFREG set (permisions 0000)
        // reason currently not known
        return chmod(path, mode, dontFollow);
    } else {
        return 0;
    }
};

Module.origCallMain = Module.callMain;
Module.callMain = async (args) => {
    await Module.origCallMain(args);
    if (typeof Asyncify === 'object' && Asyncify.currData) {            
        await Asyncify.whenDone();
    }
};

Object.assign(Module, {
    emscriptenhttpconnect: async function(url, buffersize, method, headers) {
        let result = new Promise((resolve, reject) => {
        if(!method) {
            method = 'GET';
        }

        const requestFn = wxRequest(url, method, headers);
        emscriptenhttpconnections[httpConnectionNo] = {
            request: requestFn,
            resultbufferpointer: 0,
            buffersize: buffersize
        }
        let connection = emscriptenhttpconnections[httpConnectionNo];
        if (method === "GET") {
            requestFn().then((res) => {
                connection.requestResult = res;
                resolve(httpConnectionNo++);
            });
        } else {
            resolve(httpConnectionNo++);
        }
        });
        return result;
    },
    emscriptenhttpwrite: function(connectionNo, buffer, length) {
        const connection = emscriptenhttpconnections[connectionNo];
        const buf = new Uint8Array(Module.HEAPU8.buffer, buffer, length).slice(0);
        if(!connection.content) {
            connection.content = buf;
        } else {
            const content = new Uint8Array(connection.content.length + buf.length);
            content.set(connection.content);
            content.set(buf, connection.content.length);
            connection.content = content;
        }     
    },
    emscriptenhttpread: async function(connectionNo, buffer, buffersize) {
        const connection = emscriptenhttpconnections[connectionNo];

        function handleResponse(connection, buffer, buffersize) {
        let bytes_read = connection.requestResult.response.data.byteLength - connection.resultbufferpointer;
        if (bytes_read > buffersize) {
            bytes_read = buffersize;
        }
        const responseChunk = new Uint8Array(connection.requestResult.response.data, connection.resultbufferpointer, bytes_read);
        writeArrayToMemory(responseChunk, buffer);
        connection.resultbufferpointer += bytes_read;
        return bytes_read;
        }

        let result = new Promise((resolve) => {
            if(connection.content) {
            connection.request(connection.content.buffer).then((res) => {
                connection.requestResult = res;
                resolve(handleResponse(connection, buffer, buffersize));
            });
            connection.content = null;
            } else {
            resolve(handleResponse(connection, buffer, buffersize));
            }
        });

        return result;
    },
    emscriptenhttpfree: function(connectionNo) {
        let connection = emscriptenhttpconnections[connectionNo];
        connection.requestResult.requestTask.abort();
        delete emscriptenhttpconnections[connectionNo];
    }
});