/**
 * `require` file by path or return undefined, if not found
 * @param path
 * @returns {null|any}
 */
module.exports.safeRequire = path => {
    try{
        return require(path);
    }
    catch(e){
        return null;
    }
};