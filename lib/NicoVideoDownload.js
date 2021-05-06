const spawn = require('child_process').spawn;
const path = require('path');

module.exports.nicoVideoDownload = (nicoSecrets, nicovideo) => {
    return spawn('python3', [
        `-m`, `youtube_dl`,
        nicovideo,
        `--username`, nicoSecrets.username,
        `--password`, nicoSecrets.password,
        `-o`, `-`
    ], {cwd: path.join(process.cwd(), "youtube-dl")});
};