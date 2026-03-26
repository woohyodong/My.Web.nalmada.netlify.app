# 날마다성경 프로젝트 개발 스펙 및 구성 정의서

## 1. 문서 목적

이 문서는 현재 `nalmada.netlify.app` 프로젝트를 기준으로, 유사한 신앙생활 보조 웹앱을 재구축할 때 바로 개발 설계서로 활용할 수 있도록 정리한 문서이다.

목표는 다음과 같다.

- 현재 서비스의 실제 구현 스펙을 빠르게 파악할 수 있어야 한다.
- 유사 사이트를 새로 만들 때 정보구조, 화면구성, 데이터모델, 저장방식, 공통 유틸을 재사용할 수 있어야 한다.
- 코드 해석 없이도 기능 단위로 개발 범위를 정의할 수 있어야 한다.

본 문서는 실제 소스 기준으로 작성했으며, 추정이 필요한 부분은 최소화했다.

---

## 2. 프로젝트 한눈에 보기

### 2.1 서비스 정체성

- 서비스명: `날마다성경`
- 형태: 모바일 중심 정적 웹앱 + PWA
- 운영 목적:
  - 365일 성경통독 지원
  - 52주 성경암송 지원
  - 개인 중보기도문 보관
- 주요 사용자: 교회 성도 또는 개인 신앙생활 사용자
- 운영 특성:
  - 로그인 없음
  - 서버 API 없음
  - 사용자 데이터는 브라우저 로컬 저장소에 저장
  - 오프라인 일부 사용 가능

### 2.2 기술 성격

- 정적 호스팅 중심 구조
- 프론트엔드 단일 프로젝트
- 빌드 시스템 없음
- 번들러 없음
- 패키지 매니저 의존성 없음
- HTML + Vanilla JavaScript + jQuery + Tailwind CDN 기반

### 2.3 핵심 구현 원칙

- 페이지별 독립 실행
- 데이터 파일(JSON) 중심 렌더링
- 사용자 진도/설정은 `localStorage` 중심 저장
- 필요한 경우에만 브라우저 내장 기능 사용
  - Web Share API
  - Web Speech API
  - Wake Lock API
  - Service Worker
  - Web Crypto API

---

## 3. 기술 스택

### 3.1 프론트엔드

- HTML5
- Tailwind CSS CDN
- Vanilla JavaScript
- jQuery 3.7.1 CDN

### 3.2 브라우저 기능 활용

- PWA Manifest
- Service Worker Cache
- Web Share API
- SpeechSynthesis API
- Screen Wake Lock API
- `crypto.subtle.digest` 기반 SHA-256 해시
- `localStorage`
- 일부 레거시 데이터 이전용 `IndexedDB`

### 3.3 외부 리소스

- Tailwind CDN
- jQuery CDN
- GOODTV 성경 음원 URL
- `canvas-confetti` 브라우저 번들 파일

### 3.4 배포 환경

- Netlify 정적 배포 구조로 설계됨
- 루트 기준 절대경로(`/memorize/`, `/bible-read/`, `/prayer/`) 사용

---

## 4. 디렉터리 구조

```text
/
├─ index.html                    # 메인 홈
├─ manifest.webmanifest          # PWA 설정
├─ sw.js                         # 서비스워커
├─ README.md
├─ Web.config
├─ js/
│  ├─ site.js                    # 전역 공통 기능
│  ├─ confetti.browser.min.js    # 효과 라이브러리
│  └─ readme.txt
├─ assets/
│  └─ js/
│     └─ utils.wakelock.js       # 화면 꺼짐 방지 유틸
├─ memorize/
│  ├─ index.html                 # 52주 암송 화면
│  ├─ app.js                     # 52주 암송 로직
│  └─ data.json                  # 암송 데이터 52주
├─ bible-read/
│  ├─ index.html                 # 365일 통독 화면
│  ├─ app.js                     # 통독/본문/오디오 로직
│  └─ data.json                  # 365일 읽기표
├─ prayer/
│  ├─ index.html                 # 중보기도 화면
│  └─ app.js                     # 기도문 CRUD/잠금 로직
├─ data/
│  ├─ bible_db.json              # 성경 본문 DB
│  ├─ memorize_weeks_2026.xlsx   # 원본 관리용 추정 데이터
│  └─ bible_read_plan_template.xlsx
├─ icons/
├─ images/
└─ .well-known/
```

---

## 5. 페이지/기능 구성

### 5.1 홈(`/`)

역할:

- 전체 서비스 진입점
- 3개 하위 기능으로 이동
- 전체 진행률 요약 표시
- 앱 설치 유도
- 테마 및 글자크기 설정 진입점

주요 기능:

- 올해 기준 메인 타이틀 표시
- 365일 통독 진행률 표시
- 52주 암송 진행률 표시
- 저장된 기도문 개수 표시
- 공유 버튼
- 설정 드로어
  - 라이트/다크 모드
  - 전역 글자 크기
- PWA 설치 도움 팝업

데이터 소스:

- `/memorize/data.json`
- `/bible-read/data.json`
- `localStorage`

특징:

- 홈은 단순 링크 페이지가 아니라, 하위 앱의 현재 상태를 종합하는 대시보드 역할을 한다.
- 기도문은 데이터 파일이 아니라 브라우저 저장소에서 개수만 읽는다.

### 5.2 52주 암송(`/memorize/`)

역할:

- 연도별 52주 암송 콘텐츠 표시
- 주차 이동 및 완료 체크
- 음성 반복 암송 보조

주요 기능:

- 현재 연도 기준 첫 월요일로 주차 계산
- 이번 주/이전 주/다음 주 이동
- URL 쿼리 `?week=` 지원
- 완료 체크 및 해제
- 자동 다음 미완료 주 이동 옵션
- TTS 반복 암송
  - 텀 설정
  - 속도 설정
  - 한국어 음성 자동 선택
- 진도 초기화

데이터 소스:

- `/memorize/data.json`
- `localStorage`

특징:

- 진도 저장 키가 연도별로 분리되어 있다.
- 홈에서 올해 데이터가 없으면 완료 수가 가장 많은 연도 데이터를 대표값으로 사용한다.

### 5.3 365일 일독(`/bible-read/`)

역할:

- 1년 성경 읽기표 제공
- 읽은 분량 체크
- 성경 본문 열람
- GOODTV 오디오 재생

주요 기능:

- 오늘 날짜에 해당하는 Day 자동 선택
- URL 쿼리 `?day=` 지원
- 오늘/이전/다음 이동
- 완료 체크 및 해제
- 자동 다음 미완료 Day 이동 옵션
- 회차(`n독`) 개념 지원
- 읽기표의 구절 버튼 클릭 시 본문 모달 오픈
- 성경 DB에서 본문 조회
- GOODTV 장별 음원 재생
- 선택한 Day 전체 이어듣기
- 완독 시 자동 다음 회차 생성
- 화면 꺼짐 방지 옵션
- 진도 초기화

데이터 소스:

- `/bible-read/data.json`
- `/data/bible_db.json`
- 외부 GOODTV MP3 URL
- `localStorage`

특징:

- 가장 기능이 많은 핵심 앱이다.
- 통독표 데이터와 본문 DB가 분리되어 있다.
- 단순 “1회 체크”가 아니라 반복 통독을 지원하도록 회차 구조를 둔다.

### 5.4 중보기도(`/prayer/`)

역할:

- 개인 기도문 작성/보관/수정/삭제
- 공개/잠금 상태 구분 저장

주요 기능:

- 기도문 목록 표시
- 작성/수정/삭제
- 위/아래 순서 변경
- 공개/잠금 상태 구분
- 잠금 기도문 비밀번호 확인 후 펼치기
- 전체 펼치기/접기
- 이전 IndexedDB 데이터 마이그레이션

데이터 소스:

- `localStorage`
- 레거시 이전 시 `IndexedDB`

특징:

- 서버 저장이 아니라 기기 로컬 저장 전용이다.
- 잠금은 암호화 저장이 아니라 비밀번호 해시 비교 기반의 가림 기능이다.

---

## 6. 공통 UI/UX 설계 원칙

### 6.1 화면 폭 기준

- `max-w-md` 중심의 모바일 퍼스트 설계
- 데스크톱에서도 모바일 앱 카드처럼 중앙 정렬

### 6.2 디자인 시스템 특징

- Tailwind 유틸리티 클래스 직접 사용
- 별도 CSS 파일 거의 없음
- 카드형 레이아웃 중심
- 둥근 모서리(`rounded-2xl`, `rounded-3xl`)
- 그림자(`shadow`, `shadow-lg`)
- 밝은 배경 + 다크 모드 대응

### 6.3 공통 인터랙션

- 하단 고정 네비게이션
- 우측 슬라이드 메뉴
- 모달/오버레이
- `active:scale-*` 기반 탭 피드백
- 브라우저 뒤로가기와 오버레이 스택 연동

### 6.4 접근성/편의 기능

- 다크 모드
- 전역 글자 크기
- iOS/Android 설치 안내
- 일부 브라우저 API 미지원 시 graceful fallback

---

## 7. 공통 자바스크립트 모듈

### 7.1 `js/site.js`

전역 공통 모듈 역할을 한다.

제공 기능:

- 우클릭/드래그/텍스트 선택 방지
- 전역 글자 크기 상태 관리
- 전역 테마 상태 관리
- 오버레이 백스택 관리
- 종이꽃가루 효과 래퍼

노출 객체:

- `window.SiteTheme`
- `window.SiteTextSize`
- `window.SiteOverlay`
- `window.SiteFX`

재사용 포인트:

- 유사 사이트 구축 시 `site.js`는 사실상 공통 프레임워크처럼 재사용 가능하다.

### 7.2 `assets/js/utils.wakelock.js`

역할:

- Wake Lock API 래핑
- 화면 꺼짐 방지 on/off 제어

노출 객체:

- `window.SiteWakeLock`

적용 페이지:

- 주로 `/bible-read/`

---

## 8. 데이터 구조 정의

### 8.1 암송 데이터 `memorize/data.json`

구조:

```json
{
  "weeks": [
    {
      "week": 1,
      "ref": "요일 5:11-12",
      "text": "..."
    }
  ]
}
```

필드 정의:

- `week`: 1~52 주차 번호
- `ref`: 성경 구절 레퍼런스
- `text`: 암송 본문

재구축 규칙:

- 52개 항목 고정이 가장 안정적
- 주차 번호는 반드시 정수 1부터 순차 배치

### 8.2 통독표 데이터 `bible-read/data.json`

구조:

```json
[
  {
    "day": 1,
    "date": "01-01",
    "month": 1,
    "dayOfMonth": 1,
    "readings": ["창1", "마1", "스1", "행1"]
  }
]
```

필드 정의:

- `day`: 1~365 일차
- `date`: `MM-DD`
- `month`: 월 숫자
- `dayOfMonth`: 일 숫자
- `readings`: 당일 읽을 구절 배열

재구축 규칙:

- `day`와 `date`는 반드시 일관되어야 함
- `readings` 항목은 앱의 구절 파서가 이해 가능한 표기여야 함
  - 예: `창9-10`
  - 예: `눅1:1-38`
  - 예: `출11,12:1-28`

### 8.3 성경 본문 DB `data/bible_db.json`

코드상 기대 역할:

- 책 약어 -> 책 번호 매핑
- 책 번호 -> 긴 이름/짧은 이름 매핑
- 책/장 -> 절 목록 조회

실제 앱은 이 DB를 사용해 다음을 수행한다.

- 읽기표의 약어 구절 파싱
- 본문 모달 렌더링
- GOODTV 음원 URL 생성용 책 번호 조회

재구축 시 필수 조건:

- 책 약어 체계가 읽기표 표기 방식과 반드시 일치해야 함
- 장/절 단위 조회가 가능해야 함

### 8.4 기도문 데이터 모델

저장 구조:

```json
[
  {
    "id": "prayer-1710000000000",
    "title": "가정을 위한 기도",
    "content": "....",
    "isPrivate": true,
    "passwordHash": "sha256...",
    "order": 0,
    "createdAt": "2026-03-26T00:00:00.000Z",
    "updatedAt": "2026-03-26T00:00:00.000Z"
  }
]
```

필드 정의:

- `id`: 문자열 PK
- `title`: 제목
- `content`: 본문
- `isPrivate`: 잠금 여부
- `passwordHash`: SHA-256 해시
- `order`: 목록 정렬 순서
- `createdAt`: 생성 시각
- `updatedAt`: 수정 시각

주의:

- 비밀번호 원문은 저장하지 않는다.
- 완전한 보안 저장소가 아니라 “로컬 가림 기능”으로 보는 것이 맞다.

---

## 9. 브라우저 저장소 규격

### 9.1 전역 설정

- `theme`
  - 값: `light` | `dark`
- `textSize`
  - 값: `sm` | `base` | `lg`
- `installHelpSeen:v1`
  - 설치 안내 팝업 노출 여부

### 9.2 암송 관련

- `memorized:{year}`
  - 예: `memorized:2026`
  - 값: `{ "1": true, "2": false ... }`
- `memorize:options:v1`
  - 자동 다음 이동 옵션
- `memorize:tts:v4`
  - TTS 패널 상태, 텀, 속도, 음성 설정

### 9.3 통독 관련

- `bibleRead:progress:v2`
  - 회차별 완료 데이터
- `bibleRead:options:v1`
  - 자동 다음 이동, 화면 꺼짐 방지 설정
- `bibleRead:audio:v1`
  - GOODTV 패널 열림 상태

### 9.4 기도문 관련

- `nalmada-prayers:v1`
  - 전체 기도문 배열
- `nalmada-prayers:migrated:v1`
  - 레거시 IndexedDB 이전 완료 여부

### 9.5 레거시 DB

- IndexedDB 이름: `nalmada-prayer-db`
- Store 이름: `prayers`

---

## 10. 기능별 상세 설계

### 10.1 홈 진행률 계산 방식

암송:

- `memorize/data.json`의 `weeks.length`를 총량으로 사용
- 현재 연도 저장 키가 있으면 그것을 우선 사용
- 없으면 저장된 `memorized:*` 중 완료 수가 가장 많은 연도 사용

통독:

- `bible-read/data.json.length`를 총량으로 사용
- `bibleRead:progress:v2.activeCycle` 기준 완료 맵 사용

기도:

- `nalmada-prayers:v1` 배열 길이 사용

### 10.2 52주 암송 주차 계산 규칙

- 기준연도: `new Date().getFullYear()`
- 시작일: 해당 연도 1월 1일 이후 첫 월요일
- 오늘과 시작일 차이를 일수로 계산 후 7일 단위 주차 환산
- 결과 범위는 1~52로 clamp

즉, 이 앱은 ISO week를 쓰지 않고 자체 “첫 월요일 시작 규칙”을 사용한다.

### 10.3 52주 암송 완료 처리

- 버튼 클릭 시 주차별 boolean 토글
- 완료 증가 시 confetti 효과
- 52주 모두 완료 시 큰 효과
- 옵션 ON 상태에서 현재 주가 완료되어 있으면 초기 진입 시 다음 미완료 주 선택

### 10.4 암송 TTS 설계

- 브라우저 `speechSynthesis` 사용
- 한국어 음성 우선 선택
- 가능하면 Google 한국어 음성 우선
- 1회 읽기 후 지정된 텀만큼 쉬고 반복

설정값:

- `gapSec`
- `ratePreset`
- `voiceURI`
- `open`

### 10.5 통독 Day 선택 규칙

- 기본은 오늘 날짜와 일치하는 `date(MM-DD)` 행 선택
- `?day=`가 있으면 우선
- 자동 다음 옵션 ON이면 오늘이 완료된 경우 다음 미완료 Day 선택

### 10.6 통독 진행 회차 설계

`bibleRead:progress:v2` 구조 개념:

```json
{
  "activeCycle": 1,
  "cycles": {
    "1": {
      "completed": { "1": true, "2": true },
      "startedAt": "...",
      "finishedAt": "..."
    }
  }
}
```

회차 처리 규칙:

- 현재 회차가 365일 완료되면 `finishedAt` 기록
- 다음 회차 자동 생성
- 이후 진행률은 다음 회차 기준으로 다시 시작

### 10.7 성경 본문 열람 설계

흐름:

1. 읽기표 구절 클릭
2. 토큰 파싱
3. `bible_db.json`에서 책/장/절 매핑
4. 모달에 장/절 렌더링

지원 대상:

- 단일 장
- 장 범위
- 절 범위
- 복합 표기 일부

재구축 시 핵심은 “구절 문자열 파서”와 “본문 DB 인덱스”의 호환성이다.

### 10.8 GOODTV 오디오 설계

음원 URL 규칙:

- 기본 URL: `https://online.goodtv.co.kr/online_bible/goodtvbible/Revision/{bookNum}/{chapter}.mp3`
- 장 번호는 3자리 패딩 사용

지원 방식:

- 현재 선택한 장 재생/정지
- 선택한 Day의 모든 장을 순차 재생
- 재생 중 본문 모달도 해당 장으로 동기화

주의:

- 외부 URL 의존 기능이므로 네트워크 연결이 필요하다.
- GOODTV 경로 정책이 바뀌면 기능이 깨질 수 있다.

### 10.9 중보기도 저장/잠금 설계

작성:

- 제목, 내용 필수
- 공개/잠금 선택
- 잠금 시 비밀번호 필수

열람:

- 공개 글은 즉시 펼침
- 잠금 글은 비밀번호 입력 후 `unlockedIds` 메모리 상태에 등록

수정:

- 잠금 글은 수정 전 비밀번호 검증
- 기존 잠금 글 수정 시 새 비밀번호 미입력하면 기존 해시 유지

정렬:

- `order` 값 기준
- 없으면 보정 후 저장
- 위/아래 이동 시 배열 재정렬 후 저장

### 10.10 레거시 마이그레이션

기도 기능은 과거 IndexedDB 저장 구조를 사용했던 흔적이 있다.

현재 처리 방식:

- `localStorage`에 데이터가 비어 있고
- 마이그레이션 완료 플래그가 없으면
- IndexedDB `nalmada-prayer-db / prayers`에서 전체 조회
- `localStorage`로 이관
- 완료 플래그 저장

즉, 기존 사용자의 데이터 보존을 위한 1회 이행 로직이 들어 있다.

---

## 11. PWA/오프라인 설계

### 11.1 Manifest

주요 설정:

- `display: standalone`
- `orientation: portrait`
- `start_url: /`
- `scope: /`
- 아이콘 192 / 512 제공

### 11.2 Service Worker

캐시 전략:

- HTML/JS/JSON: network-first
- 이미지/기타 정적 리소스: cache-first

사전 캐시 대상:

- 홈
- 3개 서브앱 HTML/JS/JSON
- 공통 JS
- 아이콘
- `data/bible_db.json`

로컬 개발 예외:

- `localhost`, `127.0.0.1`에서는 서비스워커 캐시 로직 비활성화

장점:

- 배포 환경에서 기본 앱 셸과 데이터 재사용 가능
- 네트워크 불안정 상황에서 어느 정도 복원력 확보

제약:

- 외부 CDN 및 GOODTV 음원은 완전 오프라인 보장 불가

---

## 12. 라우팅/URL 정책

현재 구조는 멀티 페이지 앱(MPA)이다.

정책:

- `/` 홈
- `/memorize/`
- `/bible-read/`
- `/prayer/`

보정 로직:

- `/memorize` -> `/memorize/`
- `/bible-read` -> `/bible-read/`
- `/prayer` -> `/prayer/`

상태 공유 방식:

- 암송: `?week=`
- 통독: `?day=`

즉, 각 화면은 “북마크 가능한 단일 상태 URL”을 갖는다.

---

## 13. 유사 사이트 재구축 시 권장 아키텍처

### 13.1 그대로 재사용하기 좋은 부분

- 모바일 카드형 UI 구조
- `site.js` 기반 전역 설정/오버레이 관리
- JSON 데이터 기반 렌더링 구조
- `localStorage` 중심 진도 저장
- PWA + Service Worker 기본 구조

### 13.2 교체 가능성이 높은 부분

- 성경 통독표 내용
- 암송 본문 데이터
- 홈 메인 문구 및 브랜딩
- GOODTV 외부 음원 경로
- 성경 본문 DB 형식

### 13.3 새 프로젝트에서 추천하는 모듈 분리

- `core/`
  - theme
  - text-size
  - overlay
  - storage
- `features/memorize/`
- `features/bible-read/`
- `features/prayer/`
- `data/`
- `pwa/`

현재 프로젝트는 단순 파일 구조지만, 재구축 시 기능별 모듈화가 더 유지보수에 유리하다.

---

## 14. 개발 우선순위 제안

유사 사이트를 새로 만들 경우 아래 순서가 가장 효율적이다.

1. 공통 셸 구축
   - 홈
   - 공통 JS
   - 다크모드
   - 글자 크기
   - PWA
2. 데이터 포맷 확정
   - 암송 JSON
   - 통독표 JSON
   - 성경 본문 DB 형식
3. 52주 암송 구현
   - 난이도 낮음
   - 구조 검증에 적합
4. 365일 일독 구현
   - 본문 파서
   - 회차 구조
   - 오디오 연동
5. 중보기도 구현
   - 로컬 저장
   - 잠금/정렬
6. 캐시/오프라인/설치 UX 마감

---

## 15. 리스크 및 주의사항

### 15.1 데이터 저장 리스크

- 모든 사용자 데이터가 브라우저 저장소에 있으므로
  - 브라우저 데이터 삭제 시 유실 가능
  - 기기 교체 시 자동 이전 불가
  - 계정 기반 동기화 없음

### 15.2 보안 리스크

- 중보기도 잠금은 서버 암호화 저장이 아니다.
- 비밀번호 해시는 저장되지만, 근본적으로 로컬 데이터이므로 민감정보 보관용으로는 한계가 있다.

### 15.3 외부 의존 리스크

- Tailwind CDN
- jQuery CDN
- GOODTV 음원 URL

이들 경로가 변경되면 기능 영향이 발생한다.

### 15.4 데이터 품질 리스크

- 읽기표 표기와 성경 DB 약어 체계가 어긋나면 본문 열람이 깨진다.
- 통독표 오탈자 하나가 파싱 오류로 이어질 수 있다.

---

## 16. 운영 관점 체크리스트

- 연도 변경 시 52주 암송 데이터 갱신 여부 확인
- 홈 카피/SEO/canonical/OG URL 실제 운영 도메인과 일치 여부 확인
- `bible-read/data.json` 날짜와 실제 달력 일치 여부 확인
- `bible_db.json` 약어 체계 검증
- 서비스워커 캐시 이름 변경 필요 여부 확인
- GOODTV 음원 경로 정상 동작 여부 확인
- iOS 설치 안내 문구 동작 점검
- 다크모드/글자크기 전역 반영 점검

---

## 17. 결론

현재 프로젝트는 “교회/개인 신앙 루틴 관리용 모바일 웹앱”을 매우 가볍게 구현한 정적 PWA 구조이다.

가장 중요한 설계 포인트는 다음 4가지다.

- 페이지별 독립 실행 구조
- JSON 데이터 중심 콘텐츠 관리
- `localStorage` 기반 개인 진도/설정 저장
- 공통 UX 모듈(`site.js`)을 통한 일관된 앱 경험 제공

유사 사이트를 만들 때는 이 구조를 그대로 유지해도 충분히 실용적이며, 장기 운영이나 다인 사용 확장이 필요할 때만 서버 저장, 사용자 계정, 빌드 시스템, 모듈 번들링 등을 추가하는 방식이 적합하다.
