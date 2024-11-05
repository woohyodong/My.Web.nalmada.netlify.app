// 사용 예시:
// fnFormatNumber(1234567),fnFormatNumber('1234567')
// 반환 값: "1,234,567"
// 주의: 반환 값은 현재 로케일에 따라 달라질 수 있습니다. 예를 들어, 일부 국가에서는 숫자를 "1.234.567" 형태로 포맷할 수 있습니다.
function fnFormatNumber(number) {
    return new Intl.NumberFormat().format(number);
    //로케일을 명시적으로 지정하고 싶다면
    //return new Intl.NumberFormat('de-DE').format(number);
}

// 사용 예시:
// fnFormatDate(new Date(), "yyyy-MM-dd HH:mm:ss")
// 반환 값: "2024-03-27 15:42:00" (현재 날짜와 시간에 따라 달라짐)
function fnFormatDate(date, format = "yyyy-MM-dd") {
    const map = {
      yyyy: date.getFullYear(),
      yy: String(date.getFullYear()).slice(-2),
      MM: (date.getMonth() + 1).toString().padStart(2, '0'),
      dd: date.getDate().toString().padStart(2, '0'),
      HH: date.getHours().toString().padStart(2, '0'),
      mm: date.getMinutes().toString().padStart(2, '0'),
      ss: date.getSeconds().toString().padStart(2, '0'),
    };
    return format.replace(/yyyy|yy|MM|dd|HH|mm|ss/g, (matched) => map[matched]);
}

// 사용 예시:
// let originalArray = [1, 2, 3, 4, 5];
// let shuffledArray = fnShuffle(originalArray);
// 반환 값 예시: [3, 1, 4, 5, 2]
// 주의: 반환 값은 무작위로 섞이기 때문에 실행할 때마다 달라집니다.
function fnShuffle(array) {
    let arr = array.map(a => ([Math.random(), a])).sort((a, b) => a[0] - b[0]).map(a => a[1]);
    return arr;
}

//사용 예시
//var originalWord = "abroad";
//var scrambledWord = fnShuffleWord(originalWord);
function fnShuffleWord(word) {
    // 문자열을 배열로 변환하여 각 문자를 분리
    var characters = word.split('');

    // 문자 배열을 섞기 위해 Fisher-Yates 알고리즘을 사용
    for (var i = characters.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = characters[i];
        characters[i] = characters[j];
        characters[j] = temp;
    }
    // 섞인 문자 배열을 다시 문자열로 결합하여 반환
    return characters.join('');
}

// 사용 예시:
// fnValidateEmail("test@example.com")
// 반환 값: true
function fnValidateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// 사용 예시:
// fnRandomInt(1, 10)
// 반환 값: 1과 10 사이의
function fnRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 사용 예시:
// fnRandomFloat(0.1, 1.0)
// 반환 값: 0.1과 1.0 사이의 실수 (예: 0.456, 0.892 등)
function fnRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// 사용 예시:
// fnRandomArray([1, 2, 3, 4, 5])
// 배열에서 랜덤한 요소 하나를 반환하는 함수
function fnRandomArray(array) {
    if (!array || array.length === 0) return null; // 배열이 비어있을 경우 null 반환
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

// 사용 예시:
// fnParseQueryString("?key1=value1&key2=value2")
// 반환 값: { key1: "value1", key2: "value2" }
function fnParseQueryString(queryString) {
    const params = new URLSearchParams(queryString);
    const obj = {};
    for (let [key, value] of params.entries()) {
      obj[key] = value;
    }
    return obj;
}

// 사용 예시:
// fnParameterByName("USERID");
function fnParameterByName(name) {
    const params = new URLSearchParams(window.location.search);
    const value = params.get(name);
    return value ? decodeURIComponent(value.replace(/\+/g, ' ')) : null;
}


// 사용 예시 (스크롤 이벤트에 디바운스 적용):
// window.addEventListener('scroll', fnDebounce(() => {
//   console.log('Scroll event triggered');
// }, 200));
// 스크롤 이벤트가 멈춘 후 200ms 뒤에 "Scroll event triggered" 로그 출력
function fnDebounce(func, wait, immediate) {
    let timeout;
    return function() {
      const context = this, args = arguments;
      const later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
}

// 사용 예시 (스크롤 이벤트에 쓰로틀 적용):
// window.addEventListener('scroll', fnThrottle(() => {
//   console.log('Scroll event triggered');
// }, 2000));
// 스크롤하는 동안 2초마다 한 번씩 "Scroll event triggered" 로그 출력
function fnThrottle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
}

// 사용 예시:
// const obj = { a: 1, b: { c: 2 } };
// const objClone = fnDeepClone(obj);
// console.log(objClone);
// 반환 값: { a: 1, b: { c: 2 } }, obj의 깊은 복사본
function fnDeepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// 사용 예시:
// const isMobile = fnIsMobile();
// console.log(isMobile); // 모바일이면 true, 아니면 false
function fnIsMobile() {
    try {
        const userAgent = navigator.userAgent;
        // 모바일 디바이스를 식별할 수 있는 키워드들의 정규식
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        return mobileRegex.test(userAgent);
    } catch (e) { 
        return false; 
    }
}



// 현재 브라우저가 크롬일 경우, 크롬의 버전을 반환하는 함수
// 사용 예시:
// const chromeVersion = fnChromeBrowserVersion();
// console.log(chromeVersion); // 예: "88.0.4324.150" 또는 null
function fnChromeBrowserVersion() {
    // navigator.userAgent를 소문자로 변환하여 사용자 에이전트 정보를 가져옴
    const userAgent = navigator.userAgent.toLowerCase();
    // 크롬 브라우저인지 확인하는 정규식 패턴 (크롬 또는 크로미움 기반 브라우저를 포함)
    const chromeRegex = /chrome|chromium|crios/i;

    // 사용자 에이전트 문자열이 크롬을 포함하고 있는지 확인
    if (chromeRegex.test(userAgent)) {
        // 버전 정보를 추출하는 정규식을 사용하여 버전 번호를 매치
        const matches = userAgent.match(/chrome\/([0-9.]+)/);
        // 매치가 성공하면, 버전 번호 (예: "88.0.4324.150") 반환
        if (matches && matches.length > 1) {
            return matches[1];
        }
    }
    // 크롬 브라우저가 아니거나 버전 정보를 찾을 수 없는 경우, null 반환
    return null;
}

//Trim 앞/뒤 공백제거
function fnTrim(val) { return val.replace(/(^\s*)|(\s*$)/g, "");}

//Trim 모든 공백제거
function fnTrimAll(val) { return val.replace(/(\s*)/g, "");}

//null처리
function fnNull(val, def = "") {
    return (val === "" || val === "null" || val == null || val == undefined) ? def : val;
}

// 문자열의 왼쪽을 특정 문자로 채우는 함수
//ex) fnLpad("123", 5, "0"); // "00123"
function fnLpad(originalStr, length, padString) {
    let str = originalStr.toString();
    while (str.length < length) {
        str = padString + str;
    }
    return str;
}

// 문자열의 오른쪽을 특정 문자로 채우는 함수
//ex) fnRpad("123", 5, "0"); // "12300"
function fnRpad(originalStr, length, padString) {
    let str = originalStr.toString();
    while (str.length < length) {
        str = str + padString;
    }
    return str;
}

// Video, Audio -> duration 소수점 초단위 00:00 포멧으로 변경
// ex) fnPlayerFormatTime(video.duration) // 289.556875 -> 4:49 
function fnPlayerFormatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const hours = h < 10 ? '0' + h : h;
    const minutes = m < 10 ? '0' + m : m;
    const secondsFixed = s < 10 ? '0' + s : s;

    return h > 0 ? `${hours}:${minutes}:${secondsFixed}` : `${minutes}:${secondsFixed}`;
}

//반응형 -> 가로 모드일 경우 zoom기능 
function fnZoomChange(){
    if(!fnIsMobile()) return;
    const zoom = Math.min((window.innerHeight / window.innerWidth) * 1.25 , 1);
    document.documentElement.style.zoom = `${zoom}`;
}
//toast ------------------------------
function toast(msg, sec) {
    sec = sec || 3000;
    try { Materialize.toast(msg, sec);} 
    catch {alert(msg);}
}
//Delay ------------------------------
//ex) await fnDelay(1000); // 1초 대기
function fnDelay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

//Share Link------------------------------
async function fnShareLink(shareTitle, shareText, link) {
    const shareData = {
        title: shareTitle,
        text: shareText,
        url: link,
    };
    try {
        await navigator.share(shareData);
    } catch (e) {
        console.error(e);
    }
}

//Share Files------------------------------
async function fnShareFiles(filesArray, shareTitle, shareText) {
    if (navigator.canShare && navigator.canShare({ files: filesArray })) {
        try {
            await navigator.share({
                files: filesArray,
                title: shareTitle,
                text: shareText
            });
        } catch (error) {
            console.log('Sharing failed', error);
        }
    } else {
        console.log(`System doesn't support sharing.`);
    }
};
