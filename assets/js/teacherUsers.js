(function () {
  function usersSelectUser (id) {
    document.location = '/teacher/users/profile/' + id
  }
  function editUser (id) {
    document.location = '/teacher/users/edit/' + id
  }
  $('.usersSelectUser').on('click', function () {
    usersSelectUser($(this).data('id'))
    return false;
  })
  $('.editUserButton').on('click', function () {
    editUser($(this).data('id'))
    return false;
  })
})()
