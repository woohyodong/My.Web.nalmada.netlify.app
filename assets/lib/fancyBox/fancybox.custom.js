$(function () {
    //팝업
    //ex)<a class="fancybox_url" title="제목을입력합니다." data-width="800" data-height="600" href="http://www.moumou.co.kr">링크(팝업)</a>
    //ex)<button class="fancybox_url" data-url="http://www.moumou.co.kr">버튼링크</button>
    $(document).on("click", ".fancybox_url", function (e) {

        e.preventDefault();

        //쿠폰팝업일 경우만 체크
        if ($(this).hasClass("_cp_S") || $(this).hasClass("_cp_next_S")) {
            
            var obj = $(this);

            var msg = "<b>[현재 콘텐츠]</b>쿠폰사용중!<p class='text-danger'>※교재 배송전이면 쿠폰은 자동으로 취소됩니다.</p>";

            if ($(this).hasClass("_cp_S") && $(this).hasClass("_cp_next_S")) {
                msg = "<b>[현재/다음 콘텐츠]</b>쿠폰사용중!<p class='text-danger'>※교재 배송전이면 쿠폰은 자동으로 취소됩니다.</p>";
            }else  if ($(this).hasClass("_cp_next_S")) {
                msg = "<b>[다음 콘텐츠]</b>쿠폰사용중!<p class='text-danger'>※교재 배송전이면 쿠폰은 자동으로 취소됩니다.</p>";
            }

            swal({
                title: "확인",
                text: msg,
                type: "warning",
                showCancelButton: true,
                closeOnConfirm: false,
                cancelButtonText: "취소",
                confirmButtonText: "확인",
                html: true
            }, function () {
                swal.close();


                var _url = $(obj).attr("data-url") || $(obj).attr("href");
                var _title = $(obj).attr("title");
                var _width = $(obj).attr("data-width");
                var _height = $(obj).attr("data-height");


                //디폴트
                if (!_width) {
                    _width = 1280;//$(document).width();
                }

                //디폴트
                if (!_height) {
                    _height = $(document).height();
                }

                $.fancybox.open({
                    href: _url,
                    type: 'iframe',
                    title: _title,
                    closeBtn: true,
                    modal: false,

                    padding: 0,
                    margin: 50,
                    width: _width,
                    height: _height,
                    helpers: {
                        title: {
                            type: 'outside'
                        },
                        overlay: {
                            speedOut: 0,
                            locked: false
                        }
                    },
                    onUpdate: function () {
                        $("iframe.fancybox-iframe");
                    },
                    beforeShow: function () {
                        $("body").css({ 'overflow-y': 'hidden' });
                    },

                    afterClose: function () {
                        $("body").css({ 'overflow-y': 'visible' });
                    }
                });
            });

            return;
        }

        

        var _url = $(this).attr("data-url") || $(this).attr("href");
        var _title = $(this).attr("title");
        var _width = $(this).attr("data-width");
        var _height = $(this).attr("data-height");


        //디폴트
        if (!_width) {
            _width = 1280;//$(document).width();
        }

        //디폴트
        if (!_height) {
            _height = $(document).height();
        }

        $.fancybox.open({
            href: _url,
            type: 'iframe',
            title: _title,
            closeBtn: true,
            modal: false,

            padding: 0,
            margin: 50,
            width: _width,
            height: _height,
            autoSize: false,
            helpers: {
                title: {
                    type: 'outside'
                },
                overlay: {
                    speedOut: 0,
                    locked: false
                }
            },
            onUpdate: function () {
                $("iframe.fancybox-iframe");
            },
            beforeShow: function () {
                $("body").css({ 'overflow-y': 'hidden' });
            },

            afterClose: function () {
                $("body").css({ 'overflow-y': 'visible' });
            }
        });

    });


    //팝업
    //ex)<a class="fancybox_modal" title="제목을입력합니다." data-width="800" data-height="600" href="http://www.moumou.co.kr">링크(팝업)</a>
    //ex)<button class="fancybox_modal" data-url="http://www.moumou.co.kr">버튼링크</button>
    $(document).on("click", ".fancybox_modal", function (e) {

        e.preventDefault();

        var _url = $(this).attr("data-url") || $(this).attr("href");
        var _title = $(this).attr("title");
        var _width = $(this).attr("data-width");
        var _height = $(this).attr("data-height");


        //디폴트
        if (!_width) {
            _width = 1280;//$(document).width();
        }

        //디폴트
        if (!_height) {
            _height = $(document).height();
        }

        $.fancybox.open({
            href: _url,
            type: 'iframe',
            title: _title,
            closeBtn: true,
            modal: true,

            padding: 0,
            margin: 50,
            width: parseInt(_width),
            height: parseInt(_height),
            autoSize: false,
            helpers: {
                title: {
                    type: 'outside'
                },
                overlay: {
                    speedOut: 0,
                    locked: false
                }
            },
            onUpdate: function () {
                $("iframe.fancybox-iframe");
            },
            beforeShow: function () {
                $("body").css({ 'overflow-y': 'hidden' });
            },

            afterClose: function () {
                $("body").css({ 'overflow-y': 'visible' });
            }
        });

    });

    //이미지팝업용
    //ex)<a class="fancybox" title="제목을입력합니다." href="http://img.moumou.co.kr/BookImgHandler.ashx?pcode=50301000&s=S"><img src="http://placehold.it/300x200" /></a>
    $(document).on("click", ".fancybox", function (e) {

        e.preventDefault();

        var _url = $(this).attr("data-url") || $(this).attr("href");
        var _title = $(this).attr("title");

        $.fancybox.open({
            href: _url,
            type: 'image',
            title: _title,
            helpers: {
                title: {
                    type: 'outside'
                },
                overlay: {
                    speedOut: 0,
                    locked: false
                }
            },
            beforeShow: function () {
                $("body").css({ 'overflow-y': 'hidden' });
            },

            afterClose: function () {
                $("body").css({ 'overflow-y': 'visible' });
            }
        });

    });

    //닫기 (※모달창 닫기)
    //ex)<a class="fancybox_close" href="#">닫기</a>
    $(document).on("click", ".fancybox_close", function (e) {

        e.preventDefault();

        if (window.parent) {
            parent.$.fancybox.close();
            return;
        }

        $.fancybox.close();

    });


    //동영상 팝업
    $(document).on("click", ".fancybox_video", function (e) {

        e.preventDefault();

        var _url = $(this).attr("data-url") || $(this).attr("href");
        var _title = $(this).attr("title");

        $.fancybox.open({
            href: _url,
            title:_title,
            type: 'iframe',

            padding: 0,
            margin: 50,
            width: 1920,
            height: 1080,
            helpers: {
                title: {
                    type: 'outside'
                },
                overlay: {
                    speedOut: 0,
                    locked: false
                }
            },
            onUpdate: function () {
                $("iframe.fancybox-iframe");
            },
            beforeShow: function () {
                $("body").css({ 'overflow-y': 'hidden' });
            },

            afterClose: function () {
                $("body").css({ 'overflow-y': 'visible' });
            }
        });
    });    
}); //$(function () {

//모달창 처리
function ShowModal(url, w, h) {

    if (!h) {
        h = screen.availHeight - 36;
    }
    //디폴트
    if (!w) {
        w = 1280;
    }
    $.fancybox.open({
        href: url,
        type: 'iframe',
        closeBtn: true,
        modal: true,

        padding: 0,
        margin: 50,
        width: w,
        height: h,
        helpers: {
            title: {
                type: 'outside'
            },
            overlay: {
                speedOut: 0,
                locked: false
            }
        },
        onUpdate: function () {
            $("iframe.fancybox-iframe");
        },
        beforeShow: function () {
            $("body").css({ 'overflow-y': 'hidden' });
        },

        afterClose: function () {
            $("body").css({ 'overflow-y': 'visible' });
        }
    });
}

//모달창 처리 + 닫기 버튼 포함
function ShowModalClose(url, w, h) {

    if (!h) {
        h = screen.availHeight - 36;
    }

    //디폴트
    if (!w) {
        w = 1280;
    }

    $.fancybox.open({
        href: url,
        type: 'iframe',
        closeBtn: true,
        modal: true,

        padding: 0,
        margin: 50,
        width: w,
        height: h,
        helpers: {
            title: {
                type: 'outside'
            },
            overlay: {
                speedOut: 0,
                locked: false
            }
        },
        afterShow: function () {
            $('.fancybox-skin').append('<a title="Close" class="fancybox-item fancybox-close" href="javascript:jQuery.fancybox.close();"></a>');
        },
        onUpdate: function () {
            $("iframe.fancybox-iframe");
        },
        beforeShow: function () {
            $("body").css({ 'overflow-y': 'hidden' });
        },

        afterClose: function () {
            $("body").css({ 'overflow-y': 'visible' });
        }
    });
}


//팝업창 처리
function ShowPopup(url, w, h) {

    if (!h) {
        h = screen.availHeight - 36;
    }

    //디폴트
    if (!w) {
        w = 1280;
    }

    $.fancybox.open({
        href: url,
        type: 'iframe',
        closeBtn: true,
        modal: false,

        padding: 0,
        margin: 50,
        width: w,
        height: h,
        helpers: {
            title: {
                type: 'outside'
            },
            overlay: {
                speedOut: 0,
                locked: false
            }
        },
        onUpdate: function () {
            $("iframe.fancybox-iframe");
        },
        beforeShow: function () {
            $("body").css({ 'overflow-y': 'hidden' });
        },

        afterClose: function () {
            $("body").css({ 'overflow-y': 'visible' });
        }
    });
}
