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