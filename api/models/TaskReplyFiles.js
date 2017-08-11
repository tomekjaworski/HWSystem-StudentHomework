/**
 * TaskReplayFiles.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const TaskReplyFiles = module.exports = {

    attributes: {

        reply: { model: 'taskreplies' },

        filePath: { type: 'string' },

        fileName: { type: 'string' },

        fileSize: { type: 'integer' },

        fileExt: { type: 'string' },

        fileMimeType: { type: 'string' }
    }
};

