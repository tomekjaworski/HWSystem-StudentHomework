/**
 * Module dependencies
 */

const Writable = require('stream').Writable
const _ = require('lodash')
const concat = require('concat-stream')
const utf8 = require('to-utf-8')
const path = require('path')
const mmmagic = require('mmmagic')

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
              file.file = Buffer.from(file.file.content, 'base64').toString()
            } else {
              file.file = file.file.content
            }
          } else {
            file.file = _.values(Buffer.from(file.file.content, 'base64'))
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
                file.file = Buffer.from(file.file.content, 'base64').toString()
              } else {
                file.file = file.file.content
              }
            } else {
              file.file = _.values(Buffer.from(file.file.content, 'base64'))
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
        let fileFormat = path.parse(__newFile.filename)

        if (!options.extensions.includes(fileFormat.ext.substring(1))) {
          let err = new Error()
          err.code = 'E_EXTENSION_NOT_ALLOWED'
          err.name = 'Upload Error'
          return done(err)
        }
        // todo: david weź to zweryfikuj czy ci pasuję, ewentualnie zrób to ładniej :)
          // todo: w skrócie, jeżeli jest 'application/octet-stream', to sprawdzamy poprzez zawartość
          // todo: pliku czy jest to ASCII text, lub coś w ten deseń...
          /*
            https://tools.ietf.org/pdf/rfc1867.pdf

            3.3 use of multipart/form-data
            [...]
            Each part should be labelled with an appropriate content-type if the
            media type is known (e.g., inferred from the file extension or
            operating system typing information) or as application/octet-stream.
          */
          // todo: przeglądarka wysyła 'application/octet-stream' jeżeli system nie ma przypisanego
          // todo: rozszerzenia do danego pliku co prawda, jeżeli ma sie jakieś visual studio, albo
          // todo: linuxa, mimetype istnieje, lecz gdy ktoś ma np. dev-c++ portable, to już nie
          // todo: koniecznie, byłem w sali obok, w której były zajęcia z C, i coś podsłuchałem :)

        __newFile.pipe(utf8())
          .pipe(concat((file) => {
          if (file.length > options.maxBytes) {
            let err = new Error()
            err.code = 'E_EXCEEDS_UPLOAD_LIMIT'
            err.name = 'Upload Error'
            return done(err)
          }
          function afterMimeChecked () {
            TaskReplyFiles.findOrCreate({id: options.updateFileId}, {
              reply: options.replyId,
              fileName: fileFormat.name,
              fileSize: file.length,
              fileExt: fileFormat.ext.substring(1),
              fileMimeType: __newFile.headers['content-type']
            }).exec((err, createdFile, created) => {
              if (err) {
                return done(err)
              }
              let file64 = file.toString('base64')
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
                        fileSize: file.length,
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
                      fileSize: file.length
                    }).exec((err) => {
                      if (err) {
                        return done(err)
                      }
                      done()
                    })
                  })
              }
            })
          }
          if (__newFile.headers['content-type'] === 'application/octet-stream') {
            let magic = new mmmagic.Magic(mmmagic.MAGIC_MIME_TYPE)
            magic.detect(file, function (err, result) {
              if (err) {
                throw new Error(err)
              }
              const arrayPng = ['application/png', 'application/x-png', 'image/png', 'image/x-png']
              const arrayBmp = ['application/bmp', 'application/preview', 'application/x-bmp', 'application/x-win-bitmap', 'image/bmp', 'image/ms-bmp', 'image/x-bitmap', 'image/x-bmp', 'image/x-ms-bmp', 'image/x-win-bitmap', 'image/x-windows-bmp', 'image/x-xbitmap']

              if (result.includes('text/')) {
                __newFile.headers['content-type'] = 'text/plain'
              } else if (arrayPng.indexOf(result) > -1) {
                __newFile.headers['content-type'] = 'image/png'
              } else if (arrayBmp.indexOf(result) > -1) {
                __newFile.headers['content-type'] = 'image/bmp'
              }
              afterMimeChecked()
            })
          } else {
            afterMimeChecked()
          }
        }))
      }
      return receiver__
    }
  }

  return adapter
}
