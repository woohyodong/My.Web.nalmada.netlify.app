let deferredPrompt;
//PWA 등록****************************************************
//if ("serviceWorker" in navigator) {
if (typeof navigator.serviceWorker !== 'undefined') {

    this.navigator.serviceWorker.register("/pwa/sw.js").then((registration) => {
        console.log("ServiceWorker registered successful with scope:", registration.scope); 
    },(err) => {
        console.log("ServiceWorker registration failed", err); 
    });

    window.addEventListener('beforeinstallprompt', (e) => {
        // 설치 프롬프트를 표시하지 않습니다.
        e.preventDefault();
        deferredPrompt = e;
        // 사용자가 설치를 원하는 시점에 프롬프트를 표시합니다.
        // 예: 설치 버튼에 이벤트 리스너를 추가하여 deferredPrompt.prompt()를 호출
        try{document.getElementById("pwa-setup").classList.add("active");}catch{}
    });
}
//PWA 앱설치 아이콘 표시 및 설치링크**************************
function OnPWASetup() {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('사용자가 앱 설치를 수락했습니다.');
            // 설치 안내 메시지를 표시
            try{ toast('앱 설치를 진행합니다.\n설치가 끝나면 앱을 실행하세요!');}catch{}
        } else {
            console.log('사용자가 앱 설치를 거부했습니다.');
        }
        deferredPrompt = null;
    });
}