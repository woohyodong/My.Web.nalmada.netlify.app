// #region 상수정의 -------------------------------------------------------------------------------
const _APP_VERSION = "2024.1.0";
const _STORE_NAME_BIBLE = "BibleStore";
const _STORE_NAME_BIBLE_SUMMARY = "BibleSummaryStore";
const _STORE_NAME_PLAN = "PlanStore";
const _STORE_NAME_READING_HISTORICAL = "ReadingHistoricalStore";
const _STORE_NAME_READING_THEME = "ReadingThemeStore";
const _STORE_NAME_READING_TOPIC = "ReadingTopicStore";
const _STORE_NAME_READING_MIXED = "ReadingMixedStore";
const _STORE_NAME_READING_RECORD = "ReadingRecordStore";
// localStorage
const _LOCAL_STORAGE_BIBLE_BOOK = "#DB_BOOK";
const _LOCAL_STORAGE_BIBLE_BOOKNAME = "#DB_BOOKNAME";
const _LOCAL_STORAGE_BIBLE_CHAPTER = "#DB_CHAPTER";

// 전역변수 -> 계획표 관련
let _currentStep = 1; // 현재 진행 중인 단계
const _totalSteps = 3; // 총 단계 수

// #endregion 상수정의 ----------------------------------------------------------------------------


// #region 초기화 함수 -----------------------------------------------------------------------------

// 이벤트 등록 (초기화)
document.addEventListener('DOMContentLoaded', InitPage);

// 공통 초기화
function InitPage() {

    InitDB();

    //materializecss init
    $('.modal').modal();
    $("#btn-settings").sideNav({ edge: 'right' });

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

// #endregion 초기화 함수 --------------------------------------------------------------------------


// #region 계획표관련 이벤트 함수 ---------------------------------------------------------------------

// 계획표 > 조회 + 화면 바인딩
async function OnLoadAndBindingPlan() {
    try{
        console.log("OnLoadAndBindingPlan");
        const planDataDB = await DBHelper.fnGetAllData(_STORE_NAME_PLAN);        
        if(planDataDB.length === 0) return;

        const planData = planDataDB[0].data;
        
        console.log('계획 데이터:', planData);
        console.log(planData.readingMethod);        

        const planList = $('#plan-list');
        planList.empty();


        let currentMonth = null; // 현재 처리 중인 월을 저장할 변수
        let table = null; // 월별로 테이블을 관리할 변수
        
        planData.plan.forEach(item => {
            const [year, month, day] = item.date.split('.'); // 날짜에서 연도와 월을 추출
        
            // 월이 바뀔 때마다 <h4> 헤더와 새로운 테이블을 추가
            if (currentMonth !== month) {
                currentMonth = month;
                if (table) {
                    // 기존의 테이블이 존재하면 planList에 추가
                    planList.append(table);
                }
                // 새로운 월의 헤더와 테이블 생성
                const header = $(`<h4>20${year}년 ${parseInt(month)}월 <a href="javascript:;" class="btn btn-icon"><svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="240" height="240"><path d="m10.933 13.519-2.226-2.226-1.414 1.414 3.774 3.774 5.702-6.84-1.538-1.282z"></path><path d="M19 3H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zM5 19V5h14l.002 14H5z"></path></svg></a></h4>`); // 월에 따라 헤더 생성
                planList.append(header);
        
                table = $("<table></table>"); // 새로운 테이블 생성
            }
        
            let isCompleted = item.completed ? 'active' : ''; // 완료 여부에 따른 클래스 설정
            let isNewweek = item.newweek ? ' split' : ''; // 새로운 주 표시 여부
            let classText = "";
            if (isCompleted || isNewweek) classText = `class="${isCompleted}${isNewweek}"`;
        
            // 계획 데이터를 테이블에 추가
            table.append(`<tr ${classText} data-date="${item.date}"><td>${item.day}</td><td>${item.date}</td><td>${item.bible}</td><td><i>✔</i></td></tr>`);
        });
        
        // 마지막 테이블을 추가 (마지막 월에 대한 테이블이 남아있을 수 있음)
        if (table) {
            planList.append(table);
        }
        
        // 체크리스트 항목 클릭 시 완료 상태 변경
        planList.find('tr').on('click', function () {
            const date = $(this).data('date');
            toggleCompletion(date); // 클릭한 항목의 완료 상태를 변경
        });
        
        // 남은 항목과 완료율 계산
        const remainingTasks = calculateRemainingTasks(planData);
        const completionRate = calculateCompletionRate(planData);
        
        // 설정 UI 업데이트
        const settings = $('#slide-settings .info');
        settings.find('h5').text(`계획표 기간 (${getDurationText(planData.readingDuration)})`);
        settings.find('h3').text(`${remainingTasks}건 남음`); // 남은 건수 표시
        settings.find('h6').text(`${planData.startDate} ~ ${planData.endDate}`);
        
        $("#title-plan").text(`${getMethodText(planData.readingMethod)}`);
        
        // 완료율 업데이트
        updateCompletionRateUI(completionRate);
        
        // UI 바인딩 완료 후, 체크되지 않은 항목으로 포커스 이동
        focusFirstUncheckedItem();



        
    }catch(error){
        console.error('계획 조회 중 오류 발생:', error);
        toast('계획 조회 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

//함수에서 남은 체크리스트 항목 표시
function calculateRemainingTasks(planData) {
    // 완료되지 않은 항목의 개수를 계산
    const remainingTasks = planData.plan.filter(item => !item.completed).length;
    return remainingTasks;
}

//전체 완료율을 반환하는 함수
function calculateCompletionRate(planData) {
    const totalTasks = planData.plan.length;
    const completedTasks = planData.plan.filter(item => item.completed).length;
    const completionRate = (completedTasks / totalTasks) * 100; // 완료율 계산
    return completionRate.toFixed(2); // 소수점 두 자리까지 반올림
}

function updateCompletionRateUI(completionRate) {
    const header = document.querySelector('#header.plan-progress-bar');
    header.style.setProperty('--completion-rate', `${completionRate}%`);
}

//체크되지 않은 항목 찾기 -> 스크롤 이동
function focusFirstUncheckedItem() {
    // 체크되지 않은 첫 번째 항목 찾기 (active 클래스가 없는 tr 요소)
    const firstUncheckedItem = $('#plan-list tr').not('.active').first();

    console.log(firstUncheckedItem);
    
    if (firstUncheckedItem.length) {
        // 해당 항목으로 스크롤 이동
        firstUncheckedItem[0].scrollIntoView({
            behavior: 'smooth' // 부드럽게 스크롤
            ,block: 'center'     // 화면 중앙에 위치하도록
        });
    }
}

function getDurationText(duration) {
    switch (duration) {
        case '90':
            return '3개월';
        case '180':
            return '6개월';
        case '360':
            return '1년';
        case '540':
            return '1년 6개월';
        case '720':
            return '2년';            
        default:
            return `${duration} 일간`;
    }
}

function getMethodText(method) {
    switch (method) {
        case '01':
            return '성경 순서로 읽기';
        case '02':
            return '역사 순서로 읽기';
        case '03':
            return '테마 순서로 읽기';
        case '04':
            return '주제 순서로 읽기';
        case '05':
            return '구약/신약 혼합해서 읽기';
        case '00':
            return '내가 읽은 성경만 기록하기';            
        default:
            return '날마다성경';
    }
}

// 계획표 > 저장
function OnSavePlan() {
    
}

// #endregion 계획표관련 이벤트 함수 ---------------------------------------------------------------------


// #region 계획표 팝업 관련 함수 -------------------------------------------------------------------

// 계획표 팝업 > 초기화
function OnResetPlan() {
    // 계획표 초기화
    _currentStep = 1;

    // 모든 선택 해제/선택
    $('input[type="radio"]').prop('checked', false);
    $('input[type="checkbox"]').prop('checked', true);
    // 버튼 초기화
    $('#prevStep').prop('disabled', true);
    $('#nextStep').prop('disabled', false);

    OnShowStep();
}

// 계획표 팝업 > 단계 표시
function OnShowStep() {
    $('.step').addClass('none');
    $(`.step.s${_currentStep}`).removeClass('none').fadeIn(300 * _currentStep);
    $('#stepCount').text(_currentStep);
    if (_currentStep === _totalSteps) {
        $('#nextStep').hide();
        $('#btnGenerate').show();
    } else {
        $('#nextStep').show();
        $('#btnGenerate').hide();
        if (_currentStep === 1) {
            $('#prevStep').prop('disabled', true); // 첫 단계에서는 '이전' 버튼 비활성화
        } else {
            $('#prevStep').prop('disabled', false); // 두 번째 단계부터는 '이전' 버튼 활성화
        }
    }
}

// 계획표 팝업 > 단계 유효성 검사
function IsValidateStep(){
    if(_currentStep === 1){
        
        if($("input[name='chk1']:checked").length === 0){
            toast('읽기 방식을 선택해주세요.');
            return false;
        }
    } else if(_currentStep === 2){        
        if($('input[name="chk2"]:checked').length === 0){
            toast('최소 하나의 요일을 선택해주세요.');
            return false;
        }
    } else if(_currentStep === 3){
        if($('input[name="chk3"]:checked').length === 0){
            toast('읽기 기간을 선택해주세요.');
            return false;
        }
    }
    return true;
}

// 계획표 팝업 > 다음 단계 선택
function OnNextPlanStep() {
    if(IsValidateStep() === false) return;
    _currentStep++;

    // 마지막 단계에서 평균 소요 시간 계산
    if(_currentStep === _totalSteps){

        const weekDays = $('input[name="chk2"]:checked').map(function() { return $(this).val(); }).get();

        $('input[name="chk3"]').each(function() {
            const totalDays = parseInt($(this).val());  // 선택한 기간 (3개월, 6개월 등)
            // 평균 소요 시간을 계산
            const averageTime = PlanHelper.fnCalculateAverageTime(totalDays, weekDays.length);
            //console.log(`하루 평균 ${averageTime.hours}시간 ${averageTime.minutes}분 소요 (하루에 ${averageTime.charactersPerDay}글자 읽기)`);
            
            $(this).parent().find('.time-display').html(`<strong>하루 평균 ${averageTime.hours}시간 ${averageTime.minutes}분</strong>`.replace("0시간", ""));
        });
    }

    OnShowStep();
}

// 계획표 팝업 > 이전 단계 선택
function OnPrevPlanStep() {
    if(_currentStep === 1) return;
    _currentStep--;
    OnShowStep();
}

// 계획표 팝업 > 생성
async function OnCreatePlan() {

    try{
        if(IsValidateStep() === false) return;

        const method = $("input[name='chk1']:checked").val();
        const weekDays = $('input[name="chk2"]:checked').map(function() { return $(this).val(); }).get();
        const totalDays = parseInt($("input[name='chk3']:checked").val());
    
        // console.clear();
        // console.log(`선택한 방식: ${method}`);
        // console.log(`총 일수: ${totalDays}일`);
        // console.log(weekDays);    
    
        // // 평균 소요 시간을 계산
        // const averageTime = PlanHelper.fnCalculateAverageTime(totalDays, weekDays.length);
        // console.log(`하루 평균 ${averageTime.hours}시간 ${averageTime.minutes}분 소요 (하루에 ${averageTime.charactersPerDay}글자 읽기)`);
    
        await PlanHelper.fnCreatePlanData(method, weekDays, totalDays);
    
        //return;
        
        // 계획 생성 후 계획표 화면 바인딩
        await OnLoadAndBindingPlan();

        // 계획 생성 후 팝업 닫기
        CloseAllPopup();

        // 축폭 효과
        setTimeout(ShowEffectByStart, 500);
        
        
    }catch(error){
        console.error('계획 생성 중 오류 발생:', error);
        toast('계획 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
    
}

// #endregion 계획표 팝업 관련 함수 -------------------------------------------------------------------


// #region 성경관련 이벤트 함수 -----------------------------------------------------------------------

// 이전에 읽었던 성경 히스토리 조회
async function OnHistoryBible() {    
    const savedBook = fnNull(localStorage.getItem(_LOCAL_STORAGE_BIBLE_BOOK),"");
    const saveBookName = fnNull(localStorage.getItem(_LOCAL_STORAGE_BIBLE_BOOKNAME),"");
    const savedChapter = fnNull(localStorage.getItem(_LOCAL_STORAGE_BIBLE_CHAPTER),"");

    if (savedChapter && savedBook) {
        await OnLoadVerses(parseInt(savedBook),saveBookName, parseInt(savedChapter));
    } else if (savedBook) {
        await OnLoadChapters(parseInt(savedBook), saveBookName);
    } else {
        OnLoadBooks();
    }
}

 // 책 목록 불러오기
 async function OnLoadBooks() {
    console.log("OnLoadBooks");

    $("#bibles").show();
    $("#bible-list").hide();
    OnUpdateNav(0);
}

// 장 목록 불러오기
async function OnLoadChapters(book, bookName = null) {
    console.log("OnLoadChapters");
    $("#bibles").hide();
    $("#bible-list").show();

    try {
        console.log('선택한 성경책:', book, bookName);
        
        // 성경 요약 데이터에서 장 정보 가져오기
        var chapters = await DBHelper.fnGetDataByKey(_STORE_NAME_BIBLE_SUMMARY, book);
        if (!chapters) {
            console.log('해당 책에 대한 정보가 없습니다.');
            return;
        }

        OnUpdateNav(1, book, bookName);  // 상단 네비게이션 상태 변경
        console.log('장 목록:', chapters.chapter_count);

        // 장 목록을 화면에 표시
        $("#bible-list").empty();
        $("#bible-list").append(`<h4>${bookName}</h4>`).append('<ul>');
        for (let i = 1; i <= chapters.chapter_count; i++) {
            const li = $("<li></li>").text(`${i}장`);
            li.on("click", () => OnLoadVerses(book,bookName,i));
            $("#bible-list ul").append(li);
        }

        //TODO: 상단 네비게이션 상태 변경 + 주소 추가 (히스토리)
        
    } catch (error) {
        console.error('Error selecting Bible book:', error);
    }
}

// 절 목록 불러오기
async function OnLoadVerses(book, bookName, chapter) {
    console.log("OnLoadVerses");
    $("#bibles").hide();
    $("#bible-list").show();

    try {
        // 복합 인덱스를 사용하여 book과 chapter를 기반으로 데이터를 조회
        const verses = await DBHelper.fnGetDataByIndex(_STORE_NAME_BIBLE, 'book_chapter', [book, chapter]);
        if (!verses || verses.length === 0) {
            console.log('해당 장에 대한 정보가 없습니다.');
            return;
        }
        
        OnUpdateNav(2, book, bookName, chapter);  // 상단 네비게이션 상태 변경

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

// 상단 네비게이션 업데이트
function OnUpdateNav(step = 0, book = null, bookName = null, chapter = null) {
    const nav = $("#bible-nav").empty();

    if (step === 0) {
        nav.append($("<a href='javascript:;'></a>").text("전체"));
    } else if (step === 1) {
        nav.append($("<a href='javascript:;'></a>").text("전체").on("click", OnLoadBooks));
        nav.append($("<a href='javascript:;'></a>").text(bookName));
    } else if (step === 2) {
        nav.append($("<a href='javascript:;'></a>").text("전체").on("click", OnLoadBooks));
        nav.append($("<a href='javascript:;'></a>").text(bookName).on("click", () => OnLoadChapters(book, bookName)));
        nav.append($("<a href='javascript:;'></a>").text(`${chapter}장`));
    }
    // 로컬 스토리지에 상태 저장
    localStorage.setItem(_LOCAL_STORAGE_BIBLE_BOOK, book);
    localStorage.setItem(_LOCAL_STORAGE_BIBLE_BOOKNAME, bookName);
    localStorage.setItem(_LOCAL_STORAGE_BIBLE_CHAPTER, chapter);
}

// #endregion 성경관련 이벤트 함수 -----------------------------------------------------------------------


// #region 공용 이벤트 함수 -------------------------------------------------------------------------

// 높이는 제한해서 딱 맞출때 (앱모드 pwa 사이트활용)
function fnResizeHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
}
// 계획표 팝업 열기
function OpenPlanPopup() {OnResetPlan(); $("#popup-plan").addClass("active");}
// 옵션 > 도움말 팝업 열기
function OpenHelpPopup() {$("#popup-help").addClass("active");}
// 계획표 팝업 닫기
function CloseAllPopup() {$(".popup").removeClass("active");}
// 팝업 닫기 (공용)
function ClosePopup(obj) {$(obj).parents(".popup").removeClass("active");}
function CloseSettingPopup() {$("#btn-settings").sideNav("hide");}

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

// 옵션 > 폰트크기 변경
function ChangeFontSize(size) {
    // $(".bible-text").css("font-size", size + "px");
    // $(".bible-text").css("line-height", size + 10 + "px");
}
// 옵션 > 계획표 완료건 보기/숨기기
function ToggleCompletedPlan() {
    // $(".completed").toggle();
}


// 화면효과 > 종이 꽃가루 효과
function ShowEffectByStart() {
    //console.log('효과 표시');
    confetti({
        particleCount: 200,
        startVelocity: 50,
        spread: 120,
        origin: { y: 0.5 }
      });
}

function ShowEffectByEnd() {
    //console.log('효과 표시');
    var duration = 7 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    
    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }
    
    var interval = setInterval(function() {
      var timeLeft = animationEnd - Date.now();
    
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
    
      var particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
}

// #endregion 공용 이벤트 함수 -------------------------------------------------------------------------


// #region 테스트 함수-------------------------------------------------------------------------------

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

// #endregion 테스트 함수-------------------------------------------------------------------------------