/* eslint-disable no-unused-vars */
const CustomCodes = module.exports = {

  topicRef: /\\ref{id=(\d+)}/g,

  topicRefFormat: function (teacher) {
    return function (str, p1) {
      return Tasks.findOne(p1).select(['number']).populate('topic').then((task) => {
        if (!task) return '[error]'
        return teacher ? `<a href='/teacher/topics-and-tasks/view/${p1}'>${task.topic.number}.${task.number}</a>` : `<a href='/topic/${task.topic.id}/task/${p1}'>${task.topic.number}.${task.number}</a>`
      }).catch(err => {
        if (err) {
          return '[error]'
        }
      })
    }
  },

  formatText: function (text, teacher, cb) {
    return this.replaceAsync(text, this.topicRef, this.topicRefFormat(teacher)).then(cb)
  },

  replaceAsync: function (str, re, callback) {
    // http://es5.github.io/#x15.5.4.11
    str = String(str)
    let parts = []
    let i = 0
    if (Object.prototype.toString.call(re) === '[object RegExp]') {
      if (re.global) {
        re.lastIndex = i
      }
      let m
      // eslint-disable-next-line no-cond-assign
      while (m = re.exec(str)) {
        const args = m.concat([m.index, m.input])
        parts.push(str.slice(i, m.index), callback.apply(null, args))
        i = re.lastIndex
        if (!re.global) {
          break
        } // for non-global regexes only take the first match
        if (m[0].length === 0) {
          re.lastIndex++
        }
      }
    } else {
      re = String(re)
      i = str.indexOf(re)
      // eslint-disable-next-line no-useless-call
      parts.push(str.slice(0, i), callback.apply(null, [re, i, str]))
      i += re.length
    }
    parts.push(str.slice(i))
    return Promise.all(parts).then(function (strings) {
      return strings.join('')
    })
  }
}
