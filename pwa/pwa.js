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

        const appSetup = document.querySelector('a.app-setup');
        if(appSetup) appSetup.classList.add('active');

        // 현재 페이지가 로그인 페이지인지 확인합니다.
        //if (window.location.pathname.toLowerCase() !== '/login') return;
    
        // 로컬 스토리지에서 취소한 시간을 확인합니다.
        const dismissTime = localStorage.getItem('pwaDismissTime');
        if (dismissTime) {
            const currentTime = new Date().getTime();
            const timeDifference = currentTime - dismissTime;
            const oneDay = 4 * 60 * 60 * 1000; // 4시간을 밀리초로 변환
            // 4시간이 지나지 않았으면 메시지를 표시하지 않습니다.
            if (timeDifference < oneDay) return; 
        }
    
        // 사용자가 설치를 원하는 시점에 프롬프트를 표시합니다.
        try {
            const pwaSetupHTML = `
                <aside id="pwa-setup" class="active">
                    <div class="flex gap center">
                        <img src="/pwa/icon-192.png" class="icon" alt="앱아이콘" /> 
                        <h5>홈 화면으로 설치하시겠습니까?</h5>
                    </div>
                    <div class="grid col-2 gap-sm m-l" style="max-width: 150px;">
                        <button class="btn btn-sm active rad" onclick="OnPWASetup()">설치</button>
                        <button class="btn btn-sm rad" onclick="OnPWAClose()">닫기</button>
                    </div> 
                </aside>
                <div id="sidenav-overlay"></div>  
            `;
            document.body.insertAdjacentHTML('beforeend', pwaSetupHTML);
            
        } catch (error) {
            console.error('Error adding PWA setup HTML:', error);
        }
    });

    
}

//PWA 앱설치 아이콘 표시 및 설치링크**************************
function OnPWASetup() {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('사용자가 앱 설치를 수락했습니다.');
            // 설치 안내 메시지를 표시
            //try { toast('앱 설치를 진행합니다.\n설치가 끝나면 앱을 실행하세요!'); } catch { }
        } else {
            console.log('사용자가 앱 설치를 거부했습니다.');
        }
        deferredPrompt = null;
        OnPWAClose();
    });
}

function OnPWAClose() {
    const pwaSetup = document.getElementById('pwa-setup');
    const sidenavOverlay = document.getElementById('sidenav-overlay');

    if (pwaSetup) pwaSetup.remove();
    if (sidenavOverlay) sidenavOverlay.remove();

    // 현재 시간을 로컬 스토리지에 저장하여 4시간 동안 메시지가 표시되지 않도록 합니다.
    const currentTime = new Date().getTime();
    localStorage.setItem('pwaDismissTime', currentTime);
}
