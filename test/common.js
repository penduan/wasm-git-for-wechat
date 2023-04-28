module.exports = {
    lgPromise: new Promise(resolve => {
        const lgModule = require('./lg2.js');

        lgModule({
            onBlame: console.log.bind(null, "onBlame"),
            onCloneProcess: console.log.bind(null, "onCloneProcess"),
            onCloneSideBandProcess: console.log,
            onConfigGet: console.log,
            onGitProcessorEnd: console.log.bind(null, "onGitProcessorEnd"),
            onLogData: console.log,
            onLsFiles: console.log,
            onStatusShort: console.log,
            onTagGet: console.log
        }).then((lg) => {
            const FS = lg.FS;
            const MEMFS = FS.filesystems.MEMFS;

            FS.mkdir('/working');
            FS.mount(MEMFS, { }, '/working');
            FS.chdir('/working');   

            FS.writeFile('/home/web_user/.gitconfig', '[user]\n' +
                        'name = Test User\n' +
                        'email = test@example.com');

            lg.callMain([]);

            resolve(lg);
        });
    })
}
