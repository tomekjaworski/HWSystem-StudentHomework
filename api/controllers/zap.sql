SELECT tasks.number, tasks.title, (case when reply.id IS NOT NULL then 1 else 0 end) hasReply,
(case when comments.id IS NOT NULL then 1 else 0 end) hasComments,
(case when reply.id IS NOT NULL then reply.teacherStatus else 0 end) teacherStatus,
(case when reply.id IS NOT NULL then reply.machineStatus else 0 end) machineStatus,
(case when deadlines.id IS NOT NULL then deadlines.deadline else topics.deadline end)
FROM tasks
LEFT JOIN taskreplies reply ON reply.task = tasks.id AND reply.student = 3
LEFT JOIN taskreplycomments comments ON comments.reply = reply.id AND comments.viewed = false
LEFT JOIN customdeadlines deadlines ON deadlines.topic = tasks.topic AND deadlines.student = 3
LEFT JOIN topics ON topics.id = 1
WHERE tasks.topic = 1
GROUP BY tasks.id