// ex) $('#myElement').showAnim();
$.fn.extend({
    showAnim: function(duration = 400) { // 기본값 400ms
        return this.each(function() {
            // 부모 .step만 슬라이드 및 페이드 인
            $(this).removeClass('none').css({
                'position': 'relative',
                'left': '100%',
                'opacity': 0 // 초기 페이드 아웃 상태
            }).animate({
                'left': '0',  // 슬라이드 인
                'opacity': 1  // 페이드 인
            }, duration); // 속도를 전달받은 값으로 설정
        });
    },
    hideAnim: function(duration = 400) { // 기본값 400ms
        return this.each(function() {
            // 부모 .step만 슬라이드 아웃 및 페이드 아웃
            $(this).animate({
                'left': '-100%',  // 슬라이드 아웃
                'opacity': 0      // 페이드 아웃
            }, duration, function() {
                $(this).addClass('none').css({
                    'left': '0', // 숨김 처리 후 위치 초기화
                    'opacity': 1 // opacity도 원상복구
                });
            });
        });
    },
    fadeIn: function(duration = 400) { // 기본값 400ms
        return this.each(function() {
            // 단순 페이드 인
            $(this).removeClass('none').css('opacity', 0).animate({
                'opacity': 1  // 페이드 인
            }, duration);
        });
    },
    fadeOut: function(duration = 400) { // 기본값 400ms
        return this.each(function() {
            // 단순 페이드 아웃
            $(this).animate({
                'opacity': 0  // 페이드 아웃
            }, duration, function() {
                $(this).addClass('none').css('opacity', 1);  // 숨김 처리 후 opacity 초기화
            });
        });
    }
});
