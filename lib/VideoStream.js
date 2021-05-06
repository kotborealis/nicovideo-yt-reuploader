const stream = require('stream');

module.exports.VideoStream = class VideoStream extends stream.Transform {
    constructor(source, options) {
        super(options);
    }

    _transform(data, encoding, callback) {
        callback(null, data, encoding);
    }
};