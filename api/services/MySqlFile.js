/**
 * Module dependencies
 */

var Writable = require('stream').Writable;
var _ = require('lodash');
var concat = require('concat-stream');
var base64 = require('base64-js')
const cs = require('convert-string')
var path = require('path')

module.exports = function MySqlStore (globalOpts) {
  globalOpts = globalOpts || {};

  _.defaults(globalOpts, {
  });


  var adapter = {
    ls: function (dirname, cb) {
      return cb(null, [])
    },

    read: function (fileId, cb) {
      TaskReplyFiles.findOne({id: fileId, visible: true})
        .populate('file')
        .populate('reply')
        .exec((err, file) => {
          if (err) {
            return cb(err)
          }
          if (!file) {
            err = new Error('ENOENT');
            err.name = 'Error (ENOENT)';
            err.code = 'ENOENT';
            err.status = 404;
            return cb(err);
          }
          if (file.fileMimeType === 'text/plain') {
            file.file = Object.values(base64.toByteArray(file.file.content))
            file.file = cs.UTF8.bytesToString(file.file)
          }
          else{
            file.file = file.file.content
          }
          return cb(null, file)
        })
    },

    rm: function (fd, cb) {
      return cb()
    },

    /**
     * @param  {Object} options
     * @return {Stream.Writable}
     */
    receive: function MySqlReceiver (options) {
      options = options || {};
      options = _.defaults(options, globalOpts);

      var receiver__ = Writable({
        objectMode: true
      });
      receiver__._write = function onFile(__newFile, encoding, done) {


        receiver__.once('error', function (err, db) {
          console.log('ERROR ON RECEIVER__ ::',err);
          done(err);
        });

        __newFile.pipe(concat((file)=>{
          let fileFormat = path.parse(__newFile.filename)
          TaskReplyFiles.create({
            reply: options.replyId,
            fileName: fileFormat.name,
            fileSize: __newFile.byteCount,
            fileExt: fileFormat.ext.substring(1),
            fileMimeType: __newFile.headers['content-type'],
          }).meta({fetch: true})
            .exec((err,createdFile)=>{
              if(err) return done(err)
              let file64 = base64.fromByteArray(file)
              TaskReplyFileContent.create({
                  file: createdFile.id,
                  content: file64
                }).meta({fetch: true})
                .exec((err,createdFileContent)=>{
                  if(err) return done(err)
                  TaskReplyFiles.update(createdFile.id, {file:createdFileContent.id}).exec((err)=>{
                    if(err) return done(err)
                    done()
                  })
                })
            })
        }))
      };
      return receiver__;
    }
  };

  return adapter;
};