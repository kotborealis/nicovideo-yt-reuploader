const {safeRequire} = require('../utils/safeRequire');
const spawn = require('child_process').spawn;
const path = require('path');

module.exports.nicoVideoInfo = (nicoSecrets, nicovideo) => new Promise((resolve, reject) => {
    const ytdl = spawn('python3', [
        `-m`, `youtube_dl`,
        nicovideo,
        `--username`, nicoSecrets.username,
        `--password`, nicoSecrets.password,
        `--write-info-json`, `--skip-download`,
        `-o`, path.join(process.cwd(), '.tmp')
    ], {cwd: path.join(process.cwd(), "youtube-dl")});

    ytdl.stdout.pipe(process.stdout);

    ytdl.on('exit', () =>
        resolve(safeRequire(path.join(process.cwd(), `.tmp.info.json`)))
    );
});