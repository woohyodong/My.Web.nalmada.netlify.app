﻿// site.js
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

///테스트 데이터 ///////////////////////////////////////////////////////////////////////////////////////

//const testData = "창세기 1:1 ~ 2:2, 마태복음 1:1 ~ 1:12, 창세기 2:3 ~ 3:10, 마태복음 1:13 ~ 1:24";

///////////////////////////////////////////////////////////////////////////////////////////////////////



// 이벤트 등록 (초기화)
document.addEventListener('DOMContentLoaded', InitPage);

// 공통 초기화
function InitPage() {

    //테스트
    // console.log("원본:", testData);
    // console.log("수정:", groupAndMergeBibleEntries(testData));

    InitDB();

    //materializecss init
    $('.modal').modal();
    $(".btn-side").sideNav();//$(".btn-side").sideNav({edge: 'right'});    

    //simplebar init
    $(".simplebar").each(function () { new SimpleBar(this); });

    // 공통 초기화 코드
    fnResizeHeight();
    window.addEventListener("resize", fnResizeHeight);

    //성경 선택 이벤트
    $("#bibles li").on("click", function(){ OnSelectBibleBook($(this).data("book"), $(this).text()); });

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
                        { name: 'chapter', keyPath: 'chapter', unique: false },
                        { name: 'book_chapter', keyPath: ['book', 'chapter'], unique: false } // 복합 인덱스 추가
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
    
        return;
        
        // 계획 생성 후 계획표 화면 바인딩
        await OnLoadAndBindingPlan();

        // 계획 생성 후 팝업 닫기
        CloseAllPopup();

        // 축폭 효과
        ShowEffect();
        
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
        if(planData.length === 0) return;
        //TODO: 계획 데이터 바인딩
        console.log(planData[0].data.readingMethod);
        
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
    if(isShowBook) {
        $("#bibles").show();
        $("#bible-list").hide();
    }else{
        $("#bibles").hide();
        $("#bible-list").show();
    } 

}

// 성경 > 상단 네비게이션 상태 변경
function OnChangeBibleNavState(step = 0, book = null, chapter = null) {
    
}

// 성경 > 책 선택 -> 장 목록 표시
async function OnSelectBibleBook(book, bookName) {
    try {
        console.log('선택한 성경책:', book, bookName);
        
        // 성경 요약 데이터에서 장 정보 가져오기
        var chapters = await DBHelper.fnGetDataByKey(_STORE_NAME_BIBLE_SUMMARY, book);
        if (!chapters) {
            console.log('해당 책에 대한 정보가 없습니다.');
            return;
        }

        OnDisplayBibleBook(false);  // 책 선택 화면 업데이트
        console.log('장 목록:', chapters.chapter_count);

        // 장 목록을 화면에 표시
        $("#bible-list").empty();
        $("#bible-list").append(`<h4>${bookName}</h4>`).append('<ul>');
        for (let i = 1; i <= chapters.chapter_count; i++) {
            $("#bible-list ul").append(`<li onclick="OnSelectBibleChapter(${book}, ${i})">${i}</li>`);
        }

        //TODO: 상단 네비게이션 상태 변경 + 주소 추가 (히스토리)
    } catch (error) {
        console.error('Error selecting Bible book:', error);
    }
}

// 성경 > 책 > 장 선택 -> 절 목록 표시
async function OnSelectBibleChapter(book, chapter) {
    try {
        // 복합 인덱스를 사용하여 book과 chapter를 기반으로 데이터를 조회
        const verses = await DBHelper.fnGetDataByIndex(_STORE_NAME_BIBLE, 'book_chapter', [book, chapter]);
        if (!verses || verses.length === 0) {
            console.log('해당 장에 대한 정보가 없습니다.');
            return;
        }
        
        // 절 목록을 화면에 표시
        console.log('절 목록:', verses);
        $("#bible-list").empty();
        verses.forEach(verse => {
            $("#bible-list").append(`<p data-idx="${verse.idx}"><sup>${verse.paragraph}</sup>${verse.sentence}</p>`);
        });

        //TODO: 상단 네비게이션 상태 변경 + 주소 추가 (히스토리)
    } catch (error) {
        console.error('Error fetching chapter data:', error);
    }
}




// 공용 이벤트 함수 -------------------------------------------------------------------------

function initRouter() {
    const path = window.location.pathname;
    handleRoute(path); // 현재 경로에 맞게 초기 화면 로드

    window.addEventListener('popstate', (event) => {
        const path = window.location.pathname;
        handleRoute(path); // 뒤로가기 버튼 클릭 시 경로 처리
    });
}

// TODO:경로에 따라 화면 표시 
// 참고: https://chatgpt.com/c/67076ad3-a0b4-8003-9e51-371a165ea674
function handleRoute(path) {
    const segments = path.split('/').filter(Boolean);

    // if (segments.length === 1) {
    //     // /bible -> 성경 목록 표시
    //     displayBibleList();
    // } else if (segments.length === 2) {
    //     // /bible/1 -> 장 목록 표시
    //     const book = parseInt(segments[1]);
    //     displayChapters(book);
    // } else if (segments.length === 3) {
    //     // /bible/1/1 -> 절 목록 표시
    //     const book = parseInt(segments[1]);
    //     const chapter = parseInt(segments[2]);
    //     displayVerses(book, chapter);
    // }
}

// 높이는 제한해서 딱 맞출때 (앱모드 pwa 사이트활용)
function fnResizeHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
}
// 계획표 팝업 열기
function OpenPlanPopup() {$("#popup-plan").addClass("active");}
// 계획표 팝업 닫기
function CloseAllPopup() {$(".popup").removeClass("active");}
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
    console.log('효과 표시');
}











// 테스트 함수-------------------------------------------------------------------------------

function TestDDB(){
    DBHelper.fnDeleteDB().then(() => {
        console.log('DB 삭제 완료');
        
    }).catch(err => {
        console.error('DB 삭제 실패:', err);
    });

    setTimeout(() => { alert("새로고침 합니다."); location.reload(); }, 1500);
}

function TestPlan(){
    PlanHelper.fnSaveReadingRecords(1, 1, [1, 3, 5]);
    //PlanHelper.fnSaveReadingPlan("24.10.18");

}


