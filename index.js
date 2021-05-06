const YoutubeUtils = require('./lib/YoutubeUtils');
const {safeRequire} = require('./utils/safeRequire');
const fs = require('fs');

const inquirer = require('inquirer');
const {nicoVideoDownload} = require('./lib/NicoVideoDownload');
const {nicoVideoInfo} = require('./lib/NicoVideoInfo');
const {VideoStream} = require('./lib/VideoStream');
const {NICOVIDEO_SECRET_PATH} = require('./paths');
const {DATA_PATH} = require('./paths');
const {GOOGLE_SECRET_PATH} = require('./paths');
const { program } = require('commander');

program.version(__dirname + require('./package.json').version);

let nicovideo = undefined;

program
    .arguments('[nicovideo_url]')
    .action((nicovideo_url) => {
        nicovideo = nicovideo_url;
    })
    .option(`--google-auth <client-secret-file>`, 'Google auth');

program.parse(process.argv);

const options = program.opts();

(async () => {
    fs.mkdirSync(DATA_PATH, {recursive: true});

    if(options.googleAuth) {
        try{
            fs.accessSync(options.googleAuth, fs.constants.R_OK);
        }
        catch(e) {
            console.error(`Specified client-secret file\n\t${options.googleAuth}\ncould not be found or is not readable.`)
            return;
        }

        console.log("Saving client-secret to app data...");
        fs.copyFileSync(options.googleAuth, GOOGLE_SECRET_PATH);
    }

    const googleSecrets = safeRequire(GOOGLE_SECRET_PATH);

    if(!googleSecrets) {
        console.log(
            "Google client-secret.json file not found! Please register it using `--google-auth <client-secret-file>` argument."
        );
        return;
    }

    const youtube = new YoutubeUtils(googleSecrets);

    if(youtube.authRequired()) {
        console.log("Auth required for youtube utils.");
        console.log(`Use this url to get auth code: ${youtube.getOAuth2Url()}`);
        const {code} = await inquirer.prompt([{
            type: 'input',
            name: 'code',
            message: 'Enter oauth key: ',
        }]);
        try{
            await youtube.oauth2callback(code);
            console.log("Authorized.");
        }
        catch(e) {
            console.error("Auth failed", e);
        }
    }

    let nicoSecrets = safeRequire(NICOVIDEO_SECRET_PATH);

    if(!nicoSecrets) {
        const {username, password} = await inquirer.prompt([{
            type: 'input',
            name: 'username',
            message: 'Enter your nicovideo username: ',
        }, {
            type: 'password',
            name: 'password',
            message: 'Enter your nicovideo password: ',
        }]);

        fs.writeFileSync(NICOVIDEO_SECRET_PATH, JSON.stringify({username, password}));
        nicoSecrets = {username, password};

        console.log("Saved nicovideo secrets.");
    }

    if(!nicovideo) {
        console.log("Specify nicovideo url as CLI arg.");
        return;
    }

    const info = await nicoVideoInfo(nicoSecrets, nicovideo);
    if(!info) {
        console.error("Failed to download video");
    }

    console.log(`Downloading video ${info?.title}`);

    const stream = new VideoStream;
    const ytdl = nicoVideoDownload(nicoSecrets, nicovideo);

    ytdl.stderr.pipe(process.stderr);

    try{
        const video = await youtube.upload(ytdl.stdout, {
            title: info.title,
            description: nicovideo,
        });

        console.log(`Reuploaded to youtube: https://www.youtube.com/watch?v=${video.id}`);
    }
    catch(err) {
        console.error(`Reupload failed: ${err}`);
    }
})().then(() => process.exit(1));