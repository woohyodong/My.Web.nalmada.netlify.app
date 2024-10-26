//PWA 캐시 사용***********************************************
const _KEY_CACHE_VERSION = '#KEY_CACHE_NAME.20240430'; //갱신 key값
// This url end-point will be used when there is an issue with processing API request.(eg: no internet connection or any other error occured.)
const somethingWentWrongURL = "/error.html";
// REQUEST URL ASSETS END-POINTS to be CACHED!
// view developers tool Network tab to see what end-points are being called when the web page loads and add end-points here which you want to be cached!
const toCache = [
    somethingWentWrongURL, // html page to inform "Something went wrong!".
    "/images/icon_eva_c.png", // image asset used in the html page.

    // JAVASCRIPT ASSETS
    "/lib/jquery/jquery.min-3.7.1.js",
    "/lib/materializecss/materialize.min.js",
    "/lib/swiper/swiper-element-bundle.min-11.1.1.js",
    "/js/site.utils.js",
    "/js/site.media.js",

    //"/js/site.js",    
    //"/js/site.study.js",

    // STYLES ASSETS
    "/lib/materializecss/materialize.custom.css",
    //"/css/site.css",

    // DATA ASSETS
    "/data/correct.wav",
    "/data/incorrect.mp3",

    // FONTS ASSETS
    //"/dist/fonts/titillium-bold-webfont.woff2",
    //"/dist/fonts/titillium-light-webfont.woff2",

    // IMAGES ASSETS
    "/images/icon_o.png",
    "/images/icon_x.png",
    "/images/book_default.png",
    "/images/square_check.png",
    "/images/icon_cha_c.png",
    "/images/icon_cha_b.png",
    "/images/icon_cha_a.png",
    "/images/icon_timer.png",
    "/images/icon_mic.png",
    "/images/bg_arr.png",
    "/images/black.png",
    "/images/icon_combo_arrow.png",
    "/images/icon_warning.png",
    "/images/icon_link.png",
    "/images/square.png",
    "/images/favicon/apple-touch-icon.png",
    "/images/favicon/favicon.ico",
    "/images/favicon/favicon-16x16.png",
    "/images/favicon/favicon-32x32.png"
];

// self.addEventListener("install", (event) => {
//     // Cache resources when service-worker is installed!
//     const initCaching = async () => {
//         const cache = await caches.open(_KEY_CACHE_VERSION);
//         await cache.addAll(toCache);
//     };

//     // When new version of service wroker is detected then
//     // previous one will be discard and new one will be used without waiting!
//     self.skipWaiting();
//     event.waitUntil(initCaching());
// });


// self.addEventListener("fetch", (event) => {
//     // Your HTTP request will be intercepted here.
//     // At first try to load content from the cache.
//     // If not found then continue with the API request.
//     // Display custom page ("something went wrong!") if API request fails.
//     const response = async () => {
//         const cache = await caches.open(_KEY_CACHE_VERSION);
//         try {
//             const res = await cache.match(event.request);
//             return res || (await fetch(event.request));
//         } catch (e) {
//             return cache.match(somethingWentWrongURL);
//         }
//     };
//     event.respondWith(response());
// });


// self.addEventListener("activate", (event) => {
//     // After service-worker is installed then activate is called.
//     // This insures only one version of service-worker file is in effect.  
//     const removeOldCache = async () => {
//         const keyList = await caches.keys();
//         await Promise.all(
//             keyList.map((key) => {
//                 if (key !== _KEY_CACHE_VERSION) {
//                     return caches.delete(key);
//                 }
//             })
//         );
//     };
//     event.waitUntil(
//         (async () => {
//             if ("navigationPreload" in self.registration) {
//                 // navigationPreload if supported by the browser will allow you to make api request at the same time when service-worker is being started for faster load of the contents.
//                 await self.registration.navigationPreload.enable();
//             }
//             removeOldCache();
//         })()
//     );
//     // when service worker is registered it will not be used as a controller until next load! Running this code will trigger "controllerchange" and this service worker will be used as a controller so we won't have to wait until next load.
//     self.clients.claim();
// });


//동적 콘텐츠 캐시 방식
//self.addEventListener('fetch', function (event) {
//    event.respondWith(
//        caches.match(event.request).then(function (response) {
//            // 캐시에 응답이 있으면 반환
//            if (response) {
//                // 백그라운드에서 캐시를 업데이트
//                console.log("sw.js -> fetch", response);
//                fetch(event.request).then(function (response) {
//                    // 새 응답을 캐시에 저장
//                    return caches.open(_KEY_CACHE_VERSION).then(function (cache) {
//                        cache.put(event.request, response.clone());
//                        return response;
//                    });
//                });
//                return response;
//            }

//            // 캐시에 없는 경우 네트워크에서 요청
//            return fetch(event.request).then(function (response) {
//                // 응답을 복제하여 캐시에 저장
//                return caches.open(_KEY_CACHE_VERSION).then(function (cache) {
//                    cache.put(event.request, response.clone());
//                    return response;
//                });
//            }).catch(function () {
//                // 네트워크 요청 실패 시 적절한 대체 응답 처리
//                return caches.match('/fallback.png');
//            });
//        })
//    );
//});