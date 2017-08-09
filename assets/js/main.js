var formbutton = $('#nav-form-button');
var emailfield = $('#nav-form-email');
var passfield = $('#nav-form-pass');

formbutton.on('click', function () {


    var regexEmail = /^\w+@(p\.lodz\.pl)|\w+@(edu\.p\.lodz\.pl)$/;
    if (emailfield.val() === "") {
        emailfield.show();
        emailfield.focus();
        $(this).removeClass("btn-outline-success");
        $(this).addClass("btn-outline-primary");
        $(this).val("Next");
    } else {
        if (regexEmail.test(emailfield.val())) {
            if (passfield.val() !== "") {
                $(this).attr('type', 'submit');
                $(this).submit();
                console.log(":thinking:");
            } else {
                $('#nav-form').removeClass('has-danger');
                emailfield.hide();
                passfield.show();
                passfield.focus();

                $(this).addClass("btn-outline-success");
                $(this).removeClass("btn-outline-primary");
                $(this).val("Login");


            }
        } else {
            $('#nav-form').addClass('has-danger')
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