//site.js
//상수정의
const _APP_VERSION = "2024.1.0";

//이벤트 등록 (초기화)
document.addEventListener('DOMContentLoaded', InitPage);

// 공통 초기화
function InitPage() {

    InitDB();

} //function initPage() {


//계획표 팝업 열기
function OpenPlanPopup() {$("#popup-plan").addClass("active");}
//팝업 닫기 (공용)
function ClosePopup(obj) {$(obj).parents(".popup").removeClass("active");}

// DB 초기화
async function InitDB(){
    try {
        // DB 존재 여부 체크
        const dbExists = await DBHelper.fnCheckDBExists();
        
        if (dbExists) {
            console.log('DB가 이미 존재합니다.');
            // 이제 DB가 존재하므로 특정 스토어 내 데이터가 존재하는지 확인
            DBHelper.fnCheckStoreHasData('PlanStore').then(hasData => {
                if(!hasData) $("#popup-intro").addClass("active");
            });

        } else {
            console.log('DB가 존재하지 않으므로 초기화 및 데이터 로드를 시작합니다.');
            $("#popup-intro").addClass("active");
            // DB 스키마 정의 후 초기화
            await DBHelper.fnInitDB([
                { 
                    name: 'BibleStore', 
                    keyPath: 'idx', // 고유 인덱스 필드를 키로 사용
                    indices: [
                        { name: 'cate', keyPath: 'cate', unique: false }, // 성경 구분 (구약/신약)
                        { name: 'book', keyPath: 'book', unique: false }, // 성경책 번호
                        { name: 'chapter', keyPath: 'chapter', unique: false }, // 장 번호
                        { name: 'paragraph', keyPath: 'paragraph', unique: false }, // 절 번호
                        { name: 'long_label', keyPath: 'long_label', unique: false }, // 성경책의 전체 이름
                        { name: 'short_label', keyPath: 'short_label', unique: false } // 성경책의 짧은 이름
                    ]
                },
                { 
                    name: 'PlanStore', // 계획 스토어 생성
                    keyPath: null, // 고유한 keyPath를 사용하지 않고 자동 생성
                    autoIncrement: true, // 고유 ID 자동 생성
                    indices: [
                        { name: 'readingMethod', keyPath: 'readingMethod', unique: false }, // 읽기 방식
                        { name: 'startDate', keyPath: 'startDate', unique: false }, // 시작 날짜
                        { name: 'endDate', keyPath: 'endDate', unique: false } // 종료 날짜
                        // plan[].completed는 사용할 수 없으므로 제거
                    ]
                },
                {
                    name: 'ReadingHistoricalStore',
                    keyPath: null, // 명시적인 키 없음
                    autoIncrement: true, // 자동 키 생성
                    indices: [
                        { name: 'book', keyPath: 'book', unique: false },
                        { name: 'chapter', keyPath: 'chapter', unique: false },
                        { name: 'long_label', keyPath: 'long_label', unique: false },
                        { name: 'category', keyPath: 'category', unique: false }
                    ]
                },
                {
                    name: 'ReadingThemeStore', // 테마순 읽기
                    keyPath: null, // 고유한 keyPath를 사용하지 않고 자동 생성
                    autoIncrement: true, // 고유 ID 자동 생성
                    indices: [
                        { name: 'book', keyPath: 'book', unique: false },
                        { name: 'chapter', keyPath: 'chapter', unique: false },
                        { name: 'long_label', keyPath: 'long_label', unique: false },
                        { name: 'category', keyPath: 'category', unique: false }
                    ]
                },
                {
                    name: 'ReadingTopicStore', // 주제순 읽기
                    keyPath: null, // 고유한 keyPath를 사용하지 않고 자동 생성
                    autoIncrement: true, // 고유 ID 자동 생성
                    indices: [
                        { name: 'book', keyPath: 'book', unique: false },
                        { name: 'chapter', keyPath: 'chapter', unique: false },
                        { name: 'long_label', keyPath: 'long_label', unique: false },
                        { name: 'category', keyPath: 'category', unique: false }
                    ]
                },
                {
                    name: 'ReadingMixedStore', // 구약/신약 혼합순 읽기
                    keyPath: null, // 고유한 keyPath를 사용하지 않고 자동 생성
                    autoIncrement: true, // 고유 ID 자동 생성
                    indices: [
                        { name: 'book', keyPath: 'book', unique: false },
                        { name: 'chapter', keyPath: 'chapter', unique: false },
                        { name: 'long_label', keyPath: 'long_label', unique: false },
                        { name: 'category', keyPath: 'category', unique: false }
                    ]
                },
                {
                    name: 'ReadingRecordStore', // 읽은 성경 구절 기록
                    keyPath: null, // 고유한 keyPath를 사용하지 않고 자동 생성
                    autoIncrement: true, // 고유 ID 자동 생성
                    indices: [
                        { name: 'book', keyPath: 'book', unique: false },
                        { name: 'chapter', keyPath: 'chapter', unique: false },
                        { name: 'verse', keyPath: 'verse', unique: false }
                    ]
                }
            ]);

            console.log('DB 초기화 완료. 이제 JSON 데이터를 로드합니다.');

            // JSON 데이터를 로드하여 IndexedDB에 저장 (프로세스 바 업데이트)
            $("body").append('<aside id="_download" class="active"><section><p>Downloading...</p><h1>0%</h1><div class="bar"><i></i></div></section></aside>');
            // '/data/bible_db.json' 파일에서 'Bible' 배열을 추출하고 저장
            await DBHelper.fnLoadAndSaveJSON('/data/bible_db.json', 'BibleStore', 'Bible', updateProgressBar);

            // 다른 구조의 JSON 파일을 처리할 경우, 적절한 keyPath를 지정
            //$("#_download").addClass("active");
            await DBHelper.fnLoadAndSaveJSON('/data/historicalOrder_db.json', 'ReadingHistoricalStore', 'readingOrder');

            await DBHelper.fnLoadAndSaveJSON('/data/themeOrder_db.json', 'ReadingThemeStore', 'readingOrder');

            await DBHelper.fnLoadAndSaveJSON('/data/topicOrder_db.json', 'ReadingTopicStore', 'readingOrder');

            await DBHelper.fnLoadAndSaveJSON('/data/mixedOrder_db.json', 'ReadingMixedStore', 'readingOrder');

            console.log('DB에 데이터 저장 완료.');            
            $("#_download").removeClass("active");
        }
    } catch (err) {

        DBHelper.fnDeleteDB();
        toast("DB 처리 중 오류 발생 <br> 새고로침 후 다시 시도해주세요.");
    }
}

// 진행 상태 업데이트 함수
function updateProgressBar(progress) {
    $("#_download h1").text(progress + "%");
    $("#_download .bar > i").css("width", progress + "%");
}


// 테스트 ----------------------------------------------------------------

function TestDeleteDB(){
    DBHelper.fnDeleteDB().then(() => {
        console.log('DB 삭제 완료');
    }).catch(err => {
        console.error('DB 삭제 실패:', err);
    });
}



