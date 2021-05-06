const debug = require('debug')('YoutubeUtil');

const google = require('googleapis');
const youtube = google.youtube('v3');
const OAuth2Client = google.auth.OAuth2;

const path = require('path');
const fs = require('fs');
const {VideoStream} = require('./VideoStream');
const {DATA_PATH} = require('../paths');

let oauth2client = undefined;

module.exports = class YoutubeUtil{
    authenticated = false;

    constructor(googleSecrets = {}) {
        const config = googleSecrets;
        oauth2client = new OAuth2Client(config.installed.client_id,
            config.installed.client_secret,
            config.installed.redirect_uris[0]);

        debug('oauth2client === undefined', oauth2client === undefined);

        this.authenticated = false;

        const google_tokens = YoutubeUtil.getSavedTokens();

        this.expiry = (google_tokens && google_tokens.expiry_date) || 0xfffffffffff;

        if(google_tokens){
            oauth2client.setCredentials(google_tokens);
            google.options({auth: oauth2client});
            this.authenticated = true;
            this.refreshTokens();

            debug('Got saved tokens');
            debug('Google auth complete');
        }
        else{
            debug('No saved tokens, waiting for auth');
        }
    }

    authRequired() {
        return !this.authenticated;
    }

    refreshTokens(){
        if(this.expiry > Date.now() + 1000 * 60){
            setTimeout(this.refreshTokens.bind(this), 1000 * 60);
        }
        else{
            debug('...oauth2client === undefined', oauth2client === undefined);
            oauth2client.refreshAccessToken((err, tokens) => {
                YoutubeUtil.saveTokens(tokens);
                const timeout = tokens.expiry_date - Date.now() - 1000 * 60;
                debug("refresh tokens", typeof this.refreshTokens);
                setTimeout(this.refreshTokens.bind(this), timeout);
            });
        }
    }

    static getSavedTokens(){
        try{
            const str = fs.readFileSync(path.join(DATA_PATH, '.google-tokens.json'));
            return JSON.parse(str);
        }
        catch(e){
            return null;
        }
    }

    getOAuth2Url(){
        debug("Generating oauth2 url");
        if(this.authenticated) return '/';
        return oauth2client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/youtube',
                'https://www.googleapis.com/auth/youtube.upload']
        });
    }

    async oauth2callback(code){
        debug("Got oauth2 code");
        if(this.authenticated) return null;
        oauth2client.getToken(code, (err, tokens) => {
            if(!err){
                oauth2client.setCredentials(tokens);
                google.options({auth: oauth2client});
                this.authenticated = true;
                debug('Google auth complete');
                YoutubeUtil.saveTokens(tokens);
                debug('Saving tokens');
                return true;
            }
            else{
                debug('Error while getting tokens', err);
                throw new Error(err);
            }
        });
    }

    static saveTokens(tokens){
        fs.writeFileSync(path.join(DATA_PATH, '.google-tokens.json'), JSON.stringify(tokens));
    }

    requestUserUploadsPlaylist() {
        debug("requestUserUploadsPlaylist");
        return new Promise((resolve, reject) => {
            youtube.channels.list(Object.assign({
                mine: true,
                part: 'contentDetails',
            }, {auth: youtube.oauth}), (err, data) => {
                if(err || !data || data.error){
                    reject(err || (data && data.error));
                }
                else{
                    resolve(data.items[0].contentDetails.relatedPlaylists.uploads);
                }
            });
        });
    }

    requestVideoPlaylist(id, pageToken) {
        debug("requestVideoPlaylist", id, pageToken);
        return new Promise((resolve, reject) => {
            youtube.playlistItems.list(Object.assign({
                playlistId: id,
                part: 'id,snippet',
                maxResults: 50,
                pageToken
            }, {auth: youtube.oauth}), (err, data) => {
                if(err || data.error){
                    reject(err || data.error);
                }
                else{
                    resolve(data);
                }
            });
        });
    }

    findExistingVideo(id) {
        debug("findExistingVideo", id);
        return new Promise(async(resolve, reject) => {
            const playlistId = await this.requestUserUploadsPlaylist();

            let nextPageToken = null;
            for(; ;){
                try{
                    const playlist = await this.requestVideoPlaylist(playlistId, nextPageToken);
                    let res = null;
                    playlist.items.forEach(video => {
                        if(video.snippet.description.indexOf(`sm${id}`) >= 0){
                            res = video;
                        }
                    });

                    if(res){
                        resolve(res);
                        break;
                    }
                    if(!playlist.nextPageToken){
                        reject();
                        break;
                    }

                    nextPageToken = playlist.nextPageToken;
                }
                catch(e){
                    reject();
                }
            }
        });
    }

    upload(stream, {title, description, privacyStatus = 'public'}){
        debug("Upload", title, description, privacyStatus);
        const s = new VideoStream;
        stream.pipe(s);

        return new Promise((resolve, reject) => {
            youtube.videos.insert({
                part: 'status,snippet',
                media: {
                    body: s
                },
                resource: {
                    snippet: {
                        title,
                        description
                    },
                    status: {
                        privacyStatus
                    }
                }
            }, (err, video) => {
                if(err){
                    reject(err);
                }
                else{
                    resolve(video);
                }
            });
        });
    }
};