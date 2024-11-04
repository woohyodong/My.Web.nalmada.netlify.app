//PWA 캐시 사용***********************************************
const _KEY_CACHE_VERSION = '#KEY_CACHE_NAME.20241103'; //갱신 key값
const somethingWentWrongURL = "/pwa/error.html";
const criticalAssets = [
    // 주요 CSS
    "/assets/lib/simplebar/simplebar.min.css",
    "/assets/lib/materializecss/materialize.custom.css",
    "/assets/css/style.common.min.css",

    // 주요 JS 파일
    "/assets/lib/simplebar/simplebar.min.js",
    "/assets/lib/materializecss/materialize.min.js",
    "/assets/lib/jquery/jquery.min-3.7.1.js",
    "/assets/js/utils.js",
    "/assets/js/extend.anim.js",
    "/assets/lib/canvas-confetti/confetti.browser.min.js",

    // 주요 DATA 파일
    // "/data/correct.wav",
    // "/data/incorrect.mp3",

    // 주요 이미지 및 폰트
    "/images/img_bible.png",
    "/images/icon_settings.png",
    "/images/icon_share.png",
    "/images/icon_refresh.png"

    //"/assets/fonts/Inkfree.woff"
];
const toCache = [
    somethingWentWrongURL, // html page to inform "Something went wrong!".    
    ...criticalAssets, 
    // JAVASCRIPT ASSETS    
    "/js/site.js",
    "/js/site.db.js",
    "/js/site.plan.js",

    // STYLES ASSETS    
    "/css/style.css",

    // IMAGES ASSETS (Uploaded and existing)    
    "/images/icon_select.png",
    "/images/icon_help.png"
];

self.addEventListener("install", (event) => {
    const initCaching = async () => {
        const cache = await caches.open(_KEY_CACHE_VERSION);
        await cache.addAll(criticalAssets); // 우선적으로 중요한 리소스 캐싱
        await cache.addAll(toCache); // 나머지 리소스 캐싱
    };
    self.skipWaiting();
    event.waitUntil(initCaching());
});

self.addEventListener("fetch", (event) => {
    const response = async () => {
        const cache = await caches.open(_KEY_CACHE_VERSION);
        try {
            const res = await cache.match(event.request);
            if (res) return res;

            const fetchRes = await fetch(event.request);
            if (event.request.method === 'GET') {
                cache.put(event.request, fetchRes.clone());
            }
            return fetchRes;
        } catch (e) {
            return cache.match(somethingWentWrongURL);
        }
    };
    event.respondWith(response());
});

self.addEventListener("activate", (event) => {
    const removeOldCache = async () => {
        const keyList = await caches.keys();
        await Promise.all(
            keyList.map((key) => {
                if (key !== _KEY_CACHE_VERSION) {
                    return caches.delete(key);
                }
            })
        );
    };
    event.waitUntil(
        (async () => {
            if ("navigationPreload" in self.registration) {
                await self.registration.navigationPreload.enable();
            }
            removeOldCache();
        })()
    );
    self.clients.claim();
});