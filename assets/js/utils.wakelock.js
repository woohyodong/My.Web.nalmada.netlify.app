(() => {
  let wakeLock = null;
  let requesting = false; // ✅ 중복요청 방지

  if (!('wakeLock' in navigator)) return;

  async function enableWakeLock() {
    // ✅ 이미 활성/요청중이면 스킵
    if (requesting) return;
    if (wakeLock && !wakeLock.released) return;

    requesting = true;
    try {
      wakeLock = await navigator.wakeLock.request('screen');

      wakeLock.addEventListener('release', () => {
        wakeLock = null;              // ✅ (중요) 해제 시 null로 갱신
        if (document.visibilityState === 'visible') {
          enableWakeLock();           // ✅ 보이는 상태면 즉시 재요청
        }
      });
    } catch (err) {
      // 필요하면 err.name(예: NotAllowedError)만 로깅
      wakeLock = null;
    } finally {
      requesting = false;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      enableWakeLock();
    }
  });

  enableWakeLock();
})();