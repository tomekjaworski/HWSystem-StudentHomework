var formbutton = $('#nav-form-button');
var formregister = $('#nav-form-register');
var emailfield = $('#nav-form-email');
var passfield = $('#nav-form-pass');
var navform = $('#nav-form');

formbutton.on('click', function () {


    var regexEmail = /^\w+@(p\.lodz\.pl)|\w+@(edu\.p\.lodz\.pl)$/;
    if (navform.data('step') === 0) {
        formregister.hide();
        emailfield.show();
        emailfield.focus();
        $(this).removeClass("btn-outline-success");
        $(this).addClass("btn-outline-primary");
        $(this).val("Next");
        navform.data('step', 1);
        console.log(navform.data('step'));
    } else {
        if (regexEmail.test(emailfield.val())) {
            if ((passfield.val() !== "") && (navform.data('step') === 2)) {
                $(this).attr('type', 'submit');
                $(this).submit();
                console.log(":thinking:");
                console.log(navform.data('step'));
            } else if (navform.data('step') === 1) {
                navform.removeClass('has-danger');
                emailfield.hide();
                passfield.show();
                passfield.focus();

                $(this).addClass("btn-outline-success");
                $(this).removeClass("btn-outline-primary");
                $(this).val("Login");
                console.log(navform.data('step'));
                navform.data('step', 2);

            }
        } else {
            console.log(navform.data('step'));
            navform.addClass('has-danger')
        }
    }
});

emailfield.keydown(function (handler) {
    if (handler.keyCode === 13) {
        formbutton.click();
    }
});

passfield.keydown(function (handler) {
    if (handler.keyCode === 13) {
        formbutton.click();
    }
});

$( '.button-topicview' ).click(function ( event ) {
    event.preventDefault();
    loadTaskView($(this).data('topicid'));
    return false;
});

function loadTaskView( topicid ) {

    var topicscolumn = $('#topics-column');
    var taskscolumn = $('#tasks-column');

    topicscolumn.addClass('hidden-md-down');
    taskscolumn.removeClass('hidden-md-down');

    var request = $.ajax({
        url: "/ajax/topic/" + topicid + "/tasks",
        // url: "/",
        method: "GET",
        dataType: "json"
    });

    request.done(function (msg) {
        taskscolumn.html('<table class="table table-striped table-hover responsive"><thead><tr><th>Numer</th><th>Tytuł Zadania</th><th>A</th><th>B</th><th>C</th><th>D</th><th>Termin</th></tr></thead><tbody id="tasks-tbody"></tbody></table>');
        for (var i = 0; i <= msg.length - 1; i++) {
            $('#tasks-tbody').append('<tr><th scope="row">'+msg[i].number+'</th><td>'+ msg[i].title +'</td><td>'+ msg[i].hasReply +'</td><td>'+ msg[i].hasComments +'</td><td>'+ msg[i].teacherStatus +'</td><td>'+ msg[i].machineStatus +'</td><td>'+ msg[i].deadline +'</td></tr>');
        }

        // $( "#log" ).html( msg );
    });

    request.fail(function (jqXHR, textStatus) {
        console.log("Request failed: " + textStatus);
    });

    history.replaceState(null, document.title, location.pathname + "#!/back");
    history.pushState(null, document.title, "/topic/" + topicid + "/tasks");

    window.addEventListener("popstate", function () {
        if (location.hash === "#!/back") {
            history.replaceState(null, document.title, location.pathname);
            setTimeout(function () {
                location.replace("/account");
            }, 0);
        }
    }, false);

    return false;
}

if(typeof taskView !== "undefined"){
    loadTaskView(taskView);
}