# Warning!

Youtube marks all videos, uploaded via unverified API, as private.

[https://developers.google.com/youtube/v3/docs/videos/insert](https://developers.google.com/youtube/v3/docs/videos/insert):
>All videos uploaded via the videos.insert endpoint from unverified API projects created after 28 July 2020 will be restricted to private viewing mode. To lift this restriction, each API project must undergo an audit to verify compliance with the Terms of Service. Please see the API Revision History for more details.

# NicoVideo -> Youtube reuploader

CLI tool to reupload videos from NicoVideo to Youtube.

This project uses a [fork of youtube-dl by animelover1984](https://github.com/animelover1984/youtube-dl),
which fixes nicovideo downloads.

## Setup

Clone this repo with submodules:
```bash
git clone --recurse-submodules https://github.com/kotborealis/nicovideo-yt-reuploader
```

Install python3:
```bash
sudo apt install python3
```

Install youtube-dl requirements:
```bash
cd nicovideo-yt-reuploader/youtube-dl/
python3 -m pip install -r requirements.txt
```

Create a new Google API app and obtain OAuth2 credentials for `Desktop application` 
(see [docs](https://developers.google.com/youtube/registering_an_application) for reference).

Register your OAuth2 credentials (`client-secret.json`):
```bash
cd nicovideo-yt-reuploader/
node index.js --google-oauth ./path/to/client-secret.json
```

You will be prompted to auth via browser and copy-paste auth key into CLI.
After that, you will be prompted to enter your NicoVideo.jp account credentials.

All secrets are saved to `$HOME_DIR/.nicovideo-reuploader`.

## Usage

After completing setup, you can reupload nicovideo's to your youtube channel like this:
```bash
node index.js https://www.nicovideo.jp/watch/sm3608358
```
