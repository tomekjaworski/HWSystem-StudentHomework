/**
 * Module dependencies
 */

const Writable = require('stream').Writable
const _ = require('lodash')
const concat = require('concat-stream')
const base64 = require('base64-js')
const cs = require('convert-string')
const path = require('path')

module.exports = function MySqlStore (globalOpts) {
  globalOpts = globalOpts || {}

  _.defaults(globalOpts, {
    visible: true,
    convert: true,
    updateFileId: 0,
    maxBytes: 102400,
    extensions: ['c', 'cpp', 'h', 'hpp', 'inc', 'txt', 'bmp', 'png']
  })

  let adapter = {
    ls: function (reply, cb) {
      TaskReplyFiles.find({reply: reply, visible: globalOpts.visible})
        .exec(function (err, taskReplyFiles) {
          if (err) {
            return cb(err)
          }
          return cb(null, taskReplyFiles)
        })
    },

    read: function (fileId, cb) {
      TaskReplyFiles.findOne({id: fileId, visible: globalOpts.visible})
        .populate('file')
        .populate('reply')
        .exec((err, file) => {
          if (err) {
            return cb(err)
          }
          if (!file) {
            err = new Error('ENOENT')
            err.name = 'Error (ENOENT)'
            err.code = 'ENOENT'
            err.status = 404
            return cb(err)
          }
          if (!file.file) {
            err = new Error()
            err.name = 'File fontents not found'
            err.code = 'E_FILE_CONTENTS_NOT_FOUND'
            return cb(err)
          }
          if (globalOpts.convert) {
            if (file.fileMimeType.includes('text/')) {
              file.file = _.values(base64.toByteArray(file.file.content))
              file.file = cs.UTF8.bytesToString(file.file)
            } else {
              file.file = file.file.content
            }
          } else {
            file.file = _.values(base64.toByteArray(file.file.content))
          }
          return cb(null, file)
        })
    },

    readManyByReply: function (replies, cb) {
      TaskReplyFiles.find({reply: replies, visible: globalOpts.visible})
        .populate('file')
        .exec((err, files) => {
          if (err) {
            return cb(err)
          }
          files = _.forEach(files, (file) => {
            if (!file.file) {
              err = new Error()
              err.name = 'File fontents not found'
              err.code = 'E_FILE_CONTENTS_NOT_FOUND'
              file.file = {err: err}
            } else if (globalOpts.convert) {
              if (file.fileMimeType.includes('text/')) {
                file.file = _.values(base64.toByteArray(file.file.content))
                file.file = cs.UTF8.bytesToString(file.file)
              } else {
                file.file = file.file.content
              }
            } else {
              file.file = _.values(base64.toByteArray(file.file.content))
            }
          })
          return cb(null, files)
        })
    },

    /**
     * @param  {Object} options
     * @return {Stream.Writable}
     */
    receive: function MySqlReceiver (options) {
      options = options || {}
      options = _.defaults(options, globalOpts)

      let receiver__ = Writable({
        objectMode: true
      })
      receiver__._write = function onFile (__newFile, encoding, done) {
        if (__newFile.byteCount > options.maxBytes) {
          let err = new Error()
          err.code = 'E_EXCEEDS_UPLOAD_LIMIT'
          err.name = 'Upload Error'
          return done(err)
        }
        let fileFormat = path.parse(__newFile.filename)

        if (!options.extensions.includes(fileFormat.ext.substring(1))) {
          let err = new Error()
          err.code = 'E_EXTENSION_NOT_ALLOWED'
          err.name = 'Upload Error'
          return done(err)
        }

        __newFile.pipe(concat((file) => {
          TaskReplyFiles.findOrCreate({id: options.updateFileId}, {
            reply: options.replyId,
            fileName: fileFormat.name,
            fileSize: __newFile.byteCount,
            fileExt: fileFormat.ext.substring(1),
            fileMimeType: __newFile.headers['content-type']
          }).exec((err, createdFile, created) => {
            if (err) {
              return done(err)
            }
            let file64 = base64.fromByteArray(file)
            if (!created) {
              if (createdFile.fileExt !== fileFormat.ext.substring(1)) {
                let err = new Error()
                err.code = 'E_EXTENSION_NOT_ALLOWED'
                err.name = 'Upload Error'
                return done(err)
              }
              TaskReplyFileContent.findOrCreate({id: createdFile.file, file: createdFile.id}, {file: createdFile.id, content: file64})
                .exec((err, createdFileContent, created) => {
                  if (err) {
                    return done(err)
                  }
                  if (created) {
                    TaskReplyFiles.update(createdFile.id, {
                      fileSize: __newFile.byteCount,
                      file: createdFileContent.id
                    }).exec((err) => {
                      if (err) {
                        return done(err)
                      }
                      done()
                    })
                  } else {
                    TaskReplyFileContent.update(createdFile.file, {content: file64}).exec((err) => {
                      if (err) {
                        return done(err)
                      }
                      TaskReplyFiles.update(createdFile.id, {
                        fileSize: __newFile.byteCount
                      }).exec((err) => {
                        if (err) {
                          return done(err)
                        }
                        done()
                      })
                    })
                  }
                })
            } else {
              TaskReplyFileContent.create({
                file: createdFile.id,
                content: file64
              }).meta({fetch: true})
                .exec((err, createdFileContent) => {
                  if (err) {
                    return done(err)
                  }
                  TaskReplyFiles.update(createdFile.id, {
                    file: createdFileContent.id,
                    fileSize: __newFile.byteCount
                  }).exec((err) => {
                    if (err) {
                      return done(err)
                    }
                    done()
                  })
                })
            }
          })
        }))
      }
      return receiver__
    }
  }

  return adapter
}
