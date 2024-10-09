document.addEventListener('DOMContentLoaded', initPage);

function initPage() {
    // 공통 초기화 코드
    fnResizeHeight();
    window.addEventListener("resize", fnResizeHeight);

    //materializecss init
    $('.modal').modal();
    $('.tooltipped').tooltip();
    $(".btn-side").sideNav();//$(".btn-side").sideNav({edge: 'right'});
    
    //simplebar init
    //$(".simplebar").each(function () { new SimpleBar(this); });        

    // Controls
    //Tab Control
    $(document).on("click", "ul.tab li", function () {
        $(this).siblings().removeClass("active");
        $(this).addClass("active");
        var idx = $(this).index();

        $(this).parent().next(".tab-body").children().hide();
        $(this).parent().next(".tab-body").children().eq(idx).show();
    });

} //function initPage() {


// 높이는 제한해서 딱 맞출때 (앱모드 pwa 사이트활용)
function fnResizeHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
}

// 기능 및 이벤트 관련 -------------------------------------------------------------------------

////// dialog ----------------------------
let _dialog = document.getElementById("_dialog");
let _dialog_close_function;
function OnEventDialogClose(ev) {
    var res = ev.target;
    if (_dialog_close_function) _dialog_close_function(res.returnValue);
}
// dialog open
function fnOpenDialog(msg, btnTexts, callback = null) {
    if (!_dialog) _dialog = document.getElementById("_dialog");
    $(_dialog).find("button").hide();
    btnTexts.forEach((btnText, idx) => {
        $(_dialog).find("button").eq(idx).show().text(btnText);
    });
    _dialog_close_function = null;
    if (_dialog.open) return;
    if (msg) _dialog.firstElementChild.innerHTML = msg;
    _dialog.showModal();
    _dialog.removeEventListener("close", OnEventDialogClose);
    _dialog.addEventListener("close", OnEventDialogClose);
    if (callback) _dialog_close_function = callback;
    $("body").addClass("no-scroll");
}
// dialog close
function fnCloseDialog(choice) {
    if (!_dialog.open) return;
    _dialog.close(choice);
    $("body").removeClass("no-scroll");
}

////// toast ------------------------------
function toast(msg, sec) {
    sec = sec || 3000;
    try {
        Materialize.toast(msg, sec);
    } catch { alert(msg); }
}

////// Notifications ------------------------------
function noti(msg, sec) {
    sec = sec || 4000;
    try {
        notifier.show('Notifications!', msg, 'info', '', sec);
    } catch { alert(msg); }
}

/// Screen Lock ------------------------------
function fnOpenScreenLock(msg) {
    const screenLock = document.getElementById('_screen-lock');
    if (msg) { screenLock.querySelector('.message-box').innerHTML = msg; }
    screenLock.classList.add('active');
    document.body.classList.add('no-scroll');
}
function fnCloseScreenLock() {
    const screenLock = document.getElementById('_screen-lock');
    screenLock.classList.remove('active');
    document.body.classList.remove('no-scroll');
}
