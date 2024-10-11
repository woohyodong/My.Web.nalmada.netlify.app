// site.js
// 상수정의
const _APP_VERSION = "2024.1.0";
const _STORE_NAME_BIBLE = "BibleStore";
const _STORE_NAME_BIBLE_SUMMARY = "BibleSummaryStore";
const _STORE_NAME_PLAN = "PlanStore";
const _STORE_NAME_READING_HISTORICAL = "ReadingHistoricalStore";
const _STORE_NAME_READING_THEME = "ReadingThemeStore";
const _STORE_NAME_READING_TOPIC = "ReadingTopicStore";
const _STORE_NAME_READING_MIXED = "ReadingMixedStore";
const _STORE_NAME_READING_RECORD = "ReadingRecordStore";

let _currentStep = 1; // 현재 진행 중인 단계

// 이벤트 등록 (초기화)
document.addEventListener('DOMContentLoaded', InitPage);

// 공통 초기화
function InitPage() {

    InitDB();

    //simplebar init
    $(".simplebar").each(function () { new SimpleBar(this); });

    // 공통 초기화 코드
    fnResizeHeight();
    window.addEventListener("resize", fnResizeHeight);

} // function initPage() end ----------------------------------------------------------------//

// DB 초기화
async function InitDB(){
    try {
        // DB 존재 여부 체크
        const dbExists = await DBHelper.fnCheckDBExists();
        
        if (dbExists) {
            console.log('DB가 이미 존재합니다.');
            // 이제 DB가 존재하므로 특정 스토어 내 데이터가 존재하는지 확인
            DBHelper.fnCheckStoreHasData(_STORE_NAME_PLAN).then(hasData => {
                if(!hasData) $("#popup-intro").addClass("active");
                else OnLoadAndBindingPlan();
            });

        } else {
            console.log('DB가 존재하지 않으므로 초기화 및 데이터 로드를 시작합니다.');
            $("#popup-intro").addClass("active");
            // DB 스키마 정의 후 초기화
            await DBHelper.fnInitDB([
                { 
                    name: _STORE_NAME_BIBLE, 
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
                    name: _STORE_NAME_BIBLE_SUMMARY, // 성경 요약 스토어 (구약/신약 데이터 저장)
                    keyPath: 'book', // 책의 고유 번호를 key로 사용
                    indices: [
                        { name: 'long_label', keyPath: 'long_label', unique: false }, // 성경책의 전체 이름
                        { name: 'short_label', keyPath: 'short_label', unique: false }, // 성경책의 짧은 이름
                        { name: 'chapter_count', keyPath: 'chapter_count', unique: false }, // 장 수
                        { name: 'cate', keyPath: 'cate', unique: false } // 성경 구분 (구약/신약 구분)
                    ]
                },
                { 
                    name: _STORE_NAME_PLAN, // 계획 스토어 생성
                    keyPath: 'key'
                },
                {
                    name: _STORE_NAME_READING_HISTORICAL,
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
                    name: _STORE_NAME_READING_THEME, // 테마순 읽기
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
                    name: _STORE_NAME_READING_TOPIC, // 주제순 읽기
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
                    name: _STORE_NAME_READING_MIXED, // 구약/신약 혼합순 읽기
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
                    name: _STORE_NAME_READING_RECORD, // 읽은 성경 구절 기록
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
            await DBHelper.fnLoadAndSaveJSON('/data/bible_db.json', _STORE_NAME_BIBLE, 'Bible', updateProgressBar);
            // 다른 구조의 JSON 파일을 처리할 경우, 적절한 keyPath를 지정
            await DBHelper.fnLoadAndSaveJSON('/data/bible_db.summary.json', _STORE_NAME_BIBLE_SUMMARY, 'oldTestament');
            await DBHelper.fnLoadAndSaveJSON('/data/bible_db.summary.json', _STORE_NAME_BIBLE_SUMMARY, 'newTestament');

            await DBHelper.fnLoadAndSaveJSON('/data/historicalOrder_db.json', _STORE_NAME_READING_HISTORICAL);

            await DBHelper.fnLoadAndSaveJSON('/data/themeOrder_db.json', _STORE_NAME_READING_THEME);

            await DBHelper.fnLoadAndSaveJSON('/data/topicOrder_db.json', _STORE_NAME_READING_TOPIC);

            await DBHelper.fnLoadAndSaveJSON('/data/mixedOrder_db.json', _STORE_NAME_READING_MIXED);

            console.log('DB에 데이터 저장 완료.');
            $("#_download").removeClass("active");
        }
    } catch (err) {

        DBHelper.fnDeleteDB();
        toast("DB 처리 중 오류 발생 <br> 새고로침 후 다시 시도해주세요.");
    }

    // 다운로드 진행 상태 업데이트 함수
    function updateProgressBar(progress) {
        //console.log('진행률:', progress);
        $("#_download h1").text(progress + "%");
        $("#_download .bar > i").css("width", progress + "%");
    }    
} // async function InitDB() end ------------------------------------------------------------//


// 계획표관련 이벤트 함수 ---------------------------------------------------------------------

// 계획표 > 초기화
function OnResetPlan() {
    // 계획표 초기화
    _currentStep = 1;
    PlanHelper.fnInitPlanData();

    // 모든 선택 해제/선택
    $('input[type="radio"]').prop('checked', false);
    $('input[type="checkbox"]').prop('checked', true);
}

function IsValidateStep(){
    if(_currentStep === 1){
        const method = $("input[name='chk1']:checked").val();
        if(method === undefined){
            toast('읽기 방식을 선택해주세요.');
            return false;
        }
    } else if(_currentStep === 2){
        const selectedDays = $('input[name="chk2-1"]:checked');
        if(selectedDays.length === 0){
            toast('읽을 요일을 선택해주세요.');
            return false;
        }
    } else if(_currentStep === 3){
        const totalDays = parseInt($("input[name='chk3']:checked").val());
        if(totalDays === undefined){
            toast('총 일수를 선택해주세요.');
            return false;
        }
    }
    return true;
}

// 계획표 > 다음 단계 선택
function OnNextPlanStep() {
    _currentStep++;
}

// 계획표 > 이전 단계 선택
function OnPrevPlanStep() {
    _currentStep--;
}

// 계획표 > 생성
async function OnCreatePlan() {

    try{
        if(IsValidateStep() === false) return;

        const method = $("input[name='chk1']:checked").val();
        const weekDays = $('input[name="chk2-1"]:checked').map(function() { return $(this).val(); }).get();
        const totalDays = parseInt($("input[name='chk3']:checked").val());
    
        console.clear();
        console.log(`선택한 방식: ${method}`);
        console.log(`총 일수: ${totalDays}일`);
        console.log(weekDays);    
    
        // 평균 소요 시간을 계산
        const averageTime = PlanHelper.fnCalculateAverageTime(totalDays, weekDays.length);
        console.log(`하루 평균 ${averageTime.hours}시간 ${averageTime.minutes}분 소요 (하루에 ${averageTime.charactersPerDay}글자 읽기)`);
    
        await PlanHelper.fnCreatePlanData(method, weekDays, totalDays);
    
        // 남은 일수 계산
        // const remainingDays = PlanHelper.fnCalculateRemainingDays("24.12.31");
        // console.log(`남은 일수: ${remainingDays}일`);
    }catch(error){
        console.error('계획 생성 중 오류 발생:', error);
        toast('계획 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
    
}

// 계획표 > 조회 + 화면 바인딩

async function OnLoadAndBindingPlan() {
    try{
        const planData = await DBHelper.fnGetAllData(_STORE_NAME_PLAN);
        console.log('계획 데이터:', planData);
    }catch(error){
        console.error('계획 조회 중 오류 발생:', error);
        toast('계획 조회 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 계획표 > 저장
function OnSavePlan() {
    
}


// 성경관련 이벤트 함수 -----------------------------------------------------------------------

// 성경 책 화면 표시/숨김
function OnDisplayBibleBook(isShowBook){

}

// 성경 > 상단 네비게이션 상태 변경
function OnChangeBibleNavState(step = 0, book = null, chapter = null) {
    
}

// 성경 > 책 선택 -> 장 목록 표시
function OnSelectBibleBook(book, bookName) {

}
// 성경 > 책 > 장 선택 -> 절 목록 표시
function OnSelectBibleChapter(book, chapter) {

}



// 공용 이벤트 함수 -------------------------------------------------------------------------
// 높이는 제한해서 딱 맞출때 (앱모드 pwa 사이트활용)
function fnResizeHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
}
// 계획표 팝업 열기
function OpenPlanPopup() {$("#popup-plan").addClass("active");}
// 팝업 닫기 (공용)
function ClosePopup(obj) {$(obj).parents(".popup").removeClass("active");}
// 옵션 > 폰트크기 변경
function ChangeFontSize(size) {
    // $(".bible-text").css("font-size", size + "px");
    // $(".bible-text").css("line-height", size + 10 + "px");
}
// 옵션 > 계획표 완료건 보기/숨기기
function ToggleCompletedPlan() {
    // $(".completed").toggle();
}
// 옵션 > 도움말 팝업 열기
function OpenHelpPopup() {$("#popup-help").addClass("active");}

// 화면효과 > 종이 꽃가루 효과
function ShowEffect() {
    
}











// 테스트 함수-------------------------------------------------------------------------------

function TestDDB(){
    DBHelper.fnDeleteDB().then(() => {
        console.log('DB 삭제 완료');
        
    }).catch(err => {
        console.error('DB 삭제 실패:', err);
    });

    setTimeout(() => { alert("새로고침 합니다."); location.reload(); }, 2000);
}



