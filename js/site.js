// #region 상수정의 -------------------------------------------------------------------------------
const _APP_VERSION = "2024.11.06.2";
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

const _LOCAL_STORAGE_SETTING_CHECKED = "#CHECKED";
const _LOCAL_STORAGE_SETTING_FONT_SIZE = "#FONT_SIZE";

// 전역변수 -> 계획표 관련
let _currentStep = 1; // 현재 진행 중인 단계
const _totalSteps = 3; // 총 단계 수

// #endregion 상수정의 ----------------------------------------------------------------------------


// #region 초기화 함수 -----------------------------------------------------------------------------

// 이벤트 등록 (초기화)
document.addEventListener('DOMContentLoaded', InitPage);

// 공통 초기화
function InitPage() {

    InitSettingPopup();

    //materializecss init
    $('.modal').modal();
    $("#btn-settings").sideNav({
        edge: 'right',
        onOpen: function () {
            // Sidenav가 열릴 때 히스토리 추가
            history.pushState({ page: "sidenav" }, "sidenav", "#sidenav");
        },
        onClose: function () {
            // Sidenav가 닫힐 때 히스토리 상태를 되돌림
            if (history.state && history.state.page === "sidenav") history.back();
        }
    });

    //simplebar init
    $(".simplebar").each(function () { new SimpleBar(this); });

    // 공통 초기화 코드 -> 주소창에 맞춰 리사이즈    
    window.addEventListener("load", fnResizeHeight);
    window.addEventListener("resize", fnResizeHeight);

    $("#myfamily").on("dblclick", ShowEffectByLove);

    $("#_version").on("dblclick", OnResetApp);

    window.addEventListener('popstate', function(event) {
        if ($('.popup').hasClass('active')) {
            CloseAllPopup();
        }
        else if ($("#sidenav-overlay").length > 0) {
            CloseSettingPopup();
        }

        event.preventDefault();
    });

} // function initPage() end ----------------------------------------------------------------//

function isShowIntroPopup(){
    return sessionStorage.getItem("#popup-intro") ? false : true;
}

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
                else {
                    $("#popup-intro").removeClass("active");
                    sessionStorage.setItem("#popup-intro", "true");
                    OnLoadAndBindingPlan(ToggleCompletedPlan);
                }
            });

        } else {
            console.log('DB가 존재하지 않으므로 초기화 및 데이터 로드를 시작합니다.');
            $("#popup-intro").addClass("active");

        }
    } catch (err) {

        DBHelper.fnDeleteDB();
        toast("DB 처리 중 오류 발생 <br> 새고로침 후 다시 시도해주세요.");
    }  
} // async function InitDB() end ------------------------------------------------------------//

async function OnSetupDB(){
    try{

        // DB 존재 여부 체크
        const dbExists = await DBHelper.fnCheckDBExists();

        if (dbExists) {
            OpenPlanPopup();
            return;
        }

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

        $("body").append('<aside id="_download" class="active"><section><p>Downloading...</p><h1>0%</h1><div class="bar"><i></i></div></section></aside>');

        const datasets = [
            { filePath: '/data/bible_db.json', storeName: _STORE_NAME_BIBLE, keyPath: 'Bible' },
            { filePath: '/data/bible_db.summary.json', storeName: _STORE_NAME_BIBLE_SUMMARY, keyPath: 'oldTestament' },
            { filePath: '/data/bible_db.summary.json', storeName: _STORE_NAME_BIBLE_SUMMARY, keyPath: 'newTestament' },
            { filePath: '/data/historicalOrder_db.json', storeName: _STORE_NAME_READING_HISTORICAL },
            { filePath: '/data/themeOrder_db.json', storeName: _STORE_NAME_READING_THEME },
            { filePath: '/data/topicOrder_db.json', storeName: _STORE_NAME_READING_TOPIC },
            { filePath: '/data/mixedOrder_db.json', storeName: _STORE_NAME_READING_MIXED }
        ];

        let totalRecords = 0;
        const datasetSizes = [];

        // 각 데이터셋의 총 레코드 수를 계산하여 전체 레코드 수 구하기
        for (const dataset of datasets) {
            const data = await fetch(dataset.filePath).then(res => res.json());
            const extractedData = dataset.keyPath ? data[dataset.keyPath] : data;
            const recordCount = Array.isArray(extractedData) ? extractedData.length : 0;
            datasetSizes.push(recordCount);
            totalRecords += recordCount;
        }

        let processedRecords = 0;

        // 각 JSON 파일을 로드하고 저장하며 진행 상태 업데이트
        for (let i = 0; i < datasets.length; i++) {
            const dataset = datasets[i];
            const datasetSize = datasetSizes[i];

            await DBHelper.fnLoadAndSaveJSON(
                dataset.filePath,
                dataset.storeName,
                dataset.keyPath,
                (progress) => {
                    const datasetProgress = (progress / 100) * datasetSize;
                    const overallProgress = Math.floor(((processedRecords + datasetProgress) / totalRecords) * 100);
                    updateProgressBar(overallProgress);
                }
            );

            // 현재 데이터셋 완료 후 processedRecords 업데이트
            processedRecords += datasetSize;
        }

        function updateProgressBar(progress) {
            $("#_download h1").text(progress + "%");
            $("#_download .bar > i").css("width", progress + "%");
        }

        console.log('DB에 데이터 저장 완료.');

        await fnDelay(300);
        $("#_download").removeClass("active");

        OpenPlanPopup();

    } catch (err) {

        DBHelper.fnDeleteDB();
        toast("DB 처리 중 오류 발생 <br> 새고로침 후 다시 시도해주세요.");
    }  
}

// 설정 초기화
function InitSettingPopup(){

    $("#_version").text(`VER_${_APP_VERSION}`);

    //폰트 사이즈 설정
    const savedFontSize = fnNull(localStorage.getItem(_LOCAL_STORAGE_SETTING_FONT_SIZE),"1.8rem");
    if (savedFontSize) {
        ChangeFontSize(savedFontSize);
        $(`input[name=radio-font][value='${savedFontSize}']`).prop('checked', true);
    }

    // 폰트 크기 변경 이벤트 핸들러
    $("input[name=radio-font]").change(function() {
        const newSize = $(this).val();
        ChangeFontSize(newSize);
        localStorage.setItem(_LOCAL_STORAGE_SETTING_FONT_SIZE, newSize);
    });

    // 설정 체크박스
    const savedChecked = localStorage.getItem(_LOCAL_STORAGE_SETTING_CHECKED);
    if (savedChecked) {
        $("#chk-completed").prop('checked', savedChecked === 'true');
    }

    // 완료건 보기/숨기기 이벤트 핸들러
    $("#chk-completed").change(function() {
        const isChecked = $(this).prop('checked');
        localStorage.setItem(_LOCAL_STORAGE_SETTING_CHECKED, isChecked);
        ToggleCompletedPlan();
    });

}

// #endregion 초기화 함수 --------------------------------------------------------------------------


// #region 계획표관련 이벤트 함수 ---------------------------------------------------------------------

// 계획표 > 조회 + 화면 바인딩
async function OnLoadAndBindingPlan(callback = null) {
    
    try{
        console.log("OnLoadAndBindingPlan");
        const planDataDB = await DBHelper.fnGetAllData(_STORE_NAME_PLAN);        
        if(planDataDB.length === 0) return;

        const planData = planDataDB[0].data;
        
        console.log('계획 데이터:', planData);
        console.log(planData.readingMethod);        

        const planList = $('#plan-list');
        planList.empty();

        //완료건 보기/숨기기 설정
        const isHide = localStorage.getItem(_LOCAL_STORAGE_SETTING_CHECKED) === 'true';

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
                // 월에 따라 헤더 생성
                // const header = $(`<h4>20${year}년 ${parseInt(month)}월 <a href="javascript:;" class="btn-icon selected-all"></a></h4>`);
                const header = $(`<h4>20${year}년 ${parseInt(month)}월 <b>${item.category}<b></h4>`);
                planList.append(header);
        
                table = $("<table></table>"); // 새로운 테이블 생성
            }
        
            let isCompleted = item.completed ? 'active' : ''; // 완료 여부에 따른 클래스 설정
            let isNewweek = item.newweek ? ' split' : ''; // 새로운 주 표시 여부
            let classText = "";
            if (isCompleted || isNewweek) classText = `class="${isCompleted}${isNewweek}"`;
        
            // 계획 데이터를 테이블에 추가
            let displayCategory = item.category === "" ? "<i>✔</i>" : `<b>${item.category}</b>`;            
            table.append(`<tr ${classText} data-date="${item.date}"><td>${item.day}</td><td>${item.date}</td><td>${item.bible}</td><td>${displayCategory}</td></tr>`);
        });
        
        // 마지막 테이블을 추가 (마지막 월에 대한 테이블이 남아있을 수 있음)
        if (table) planList.append(table);

        OnBindingPlanAfterProc(planData, (callback) ? false : true);

        if(callback) callback();
        
    }catch(error){
        console.error('계획 조회 중 오류 발생:', error);
        toast('계획 조회 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

//계획표 > 조회 + 화면 바인딩 후처리
function OnBindingPlanAfterProc(planData, isFocus = true) {
    // 남은 항목과 완료율 계산
    const remainingTasks = calculateRemainingTasks(planData);
    const completionRate = calculateCompletionRate(planData);
    
    // 설정 UI 업데이트
    const settings = $('#slide-settings .info');
    settings.find('.info-title').html(`계획표 기간 <small class="op-5">(${planData.readingDurationName})</small>`); // 계획표 기간 표시
    settings.find('.info-days').text(`${remainingTasks}건 남음`); // 남은 건수 표시
    settings.find('.info-date').text(`${planData.startDate} ~ ${planData.endDate}`);
    
    $("#title-plan").text(`${planData.readingMethodName}`);
    
    // 완료율 업데이트
    updateCompletionRateUI(completionRate);

    // UI 바인딩 완료 후, 체크되지 않은 항목으로 포커스 이동
    if(isFocus) focusFirstUncheckedItem();
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

// 완료율 상단 UI 업데이트
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


// 계획표 체크리스트 저장/취소
async function OnSavePlan(date) {
    console.log(date);
    const planDataDB = await PlanHelper.fnSaveReadingPlan(date);
    OnBindingPlanAfterProc(planDataDB.data);
}

// #endregion 계획표관련 이벤트 함수 ---------------------------------------------------------------------


// #region 계획표 팝업 관련 함수 -------------------------------------------------------------------

// 계획표 팝업 > 초기화
function OnResetPlan() {
    // 계획표 초기화
    _currentStep = 1;

    // 모든 선택 해제/선택
    $('input[type="radio"]:not([name=radio-font])').prop('checked', false);
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
function OpenPlanPopup() {
    OnResetPlan(); 
    $("#popup-plan").addClass("active");    
    history.pushState({ page: "popup" }, "popup", "#popup");
}
// 옵션 > 도움말 팝업 열기
function OpenHelpPopup() {
    $("#popup-help").addClass("active");
    history.pushState({ page: "popup" }, "popup", "#popup");
}
// 계획표 팝업 닫기
function CloseAllPopup() {
    $(".popup").removeClass("active");
    if (history.state && history.state.page === "popup") history.back();
}
// 팝업 닫기 (공용)
function ClosePopup(obj) {
    $(obj).parents(".popup").removeClass("active");
    if (history.state && history.state.page === "popup") history.back();
}
function CloseSettingPopup() {
    $("#btn-settings").sideNav("hide");
    //if (history.state && history.state.page === "sidenav") history.back();
}


// 옵션 > 폰트크기 변경
function ChangeFontSize(size) {
    document.documentElement.style.setProperty("--fs", size);
}
// 옵션 > 계획표 완료건 보기/숨기기
function ToggleCompletedPlan() {
    const isHide = localStorage.getItem(_LOCAL_STORAGE_SETTING_CHECKED) === 'true';
    const $tables = $("#plan-list table"); // 모든 table을 가져옵니다.

    $tables.each(function() {
        const $table = $(this);
        const $allRows = $table.find("tr");
        const $activeRows = $table.find("tr.active");
        const $header = $table.prev("h4"); // table 상단의 h4 요소

        // 모든 tr이 active 상태라면 table과 해당 h4를 숨깁니다.
        if ($allRows.length === $activeRows.length) {
            if (isHide) {
                $table.hide();
                $header.hide();
            } else {
                $table.show();
                $header.show();
            }
        } else {
            if (isHide) {
                $activeRows.hide();
            } else {
                $activeRows.show();
            }
            $table.show(); // 일부 row만 active라면 table을 보여줍니다.
            $header.show(); // 일부 row만 active라면 h4도 보여줍니다.
        }
    });

    if(!isHide) focusFirstUncheckedItem();
}


// 화면효과 > 종이 꽃가루 효과
function ShowEffectByStart() {
    //console.log('효과 표시');
    confetti({
        particleCount: fnRandomInt(200,250),
        startVelocity: fnRandomInt(50, 60),
        spread: fnRandomInt(120,150),
        origin: { y: fnRandomFloat(0.5,0.8) }
      });
}

// 화면효과 > 종이 꽃가루 폭죽 
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

function ShowEffectByLove(){
    CloseAllPopup();

    // pumpkin shape from https://thenounproject.com/icon/pumpkin-5253388/
    var pumpkin = confetti.shapeFromPath({
        path: 'M449.4 142c-5 0-10 .3-15 1a183 183 0 0 0-66.9-19.1V87.5a17.5 17.5 0 1 0-35 0v36.4a183 183 0 0 0-67 19c-4.9-.6-9.9-1-14.8-1C170.3 142 105 219.6 105 315s65.3 173 145.7 173c5 0 10-.3 14.8-1a184.7 184.7 0 0 0 169 0c4.9.7 9.9 1 14.9 1 80.3 0 145.6-77.6 145.6-173s-65.3-173-145.7-173zm-220 138 27.4-40.4a11.6 11.6 0 0 1 16.4-2.7l54.7 40.3a11.3 11.3 0 0 1-7 20.3H239a11.3 11.3 0 0 1-9.6-17.5zM444 383.8l-43.7 17.5a17.7 17.7 0 0 1-13 0l-37.3-15-37.2 15a17.8 17.8 0 0 1-13 0L256 383.8a17.5 17.5 0 0 1 13-32.6l37.3 15 37.2-15c4.2-1.6 8.8-1.6 13 0l37.3 15 37.2-15a17.5 17.5 0 0 1 13 32.6zm17-86.3h-82a11.3 11.3 0 0 1-6.9-20.4l54.7-40.3a11.6 11.6 0 0 1 16.4 2.8l27.4 40.4a11.3 11.3 0 0 1-9.6 17.5z',
        matrix: [0.020491803278688523, 0, 0, 0.020491803278688523, -7.172131147540983, -5.9016393442622945]
    });
    // tree shape from https://thenounproject.com/icon/pine-tree-1471679/
    var tree = confetti.shapeFromPath({
        path: 'M120 240c-41,14 -91,18 -120,1 29,-10 57,-22 81,-40 -18,2 -37,3 -55,-3 25,-14 48,-30 66,-51 -11,5 -26,8 -45,7 20,-14 40,-30 57,-49 -13,1 -26,2 -38,-1 18,-11 35,-25 51,-43 -13,3 -24,5 -35,6 21,-19 40,-41 53,-67 14,26 32,48 54,67 -11,-1 -23,-3 -35,-6 15,18 32,32 51,43 -13,3 -26,2 -38,1 17,19 36,35 56,49 -19,1 -33,-2 -45,-7 19,21 42,37 67,51 -19,6 -37,5 -56,3 25,18 53,30 82,40 -30,17 -79,13 -120,-1l0 41 -31 0 0 -41z',
        matrix: [0.03597122302158273, 0, 0, 0.03597122302158273, -4.856115107913669, -5.071942446043165]
    });
    // heart shape from https://thenounproject.com/icon/heart-1545381/
    var heart = confetti.shapeFromPath({
        path: 'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z',
        matrix: [0.03333333333333333, 0, 0, 0.03333333333333333, -5.566666666666666, -5.533333333333333]
    });
    
    var defaults = {
        scalar: 2,
        spread: 180,
        particleCount: 30,
        origin: { y: -0.1 },
        startVelocity: -35
    };
    
    confetti({
        ...defaults,
        shapes: [pumpkin],
        colors: ['#ff9a00', '#ff7400', '#ff4d00']
    });
    confetti({
        ...defaults,
        shapes: [tree],
        colors: ['#8d960f', '#be0f10', '#445404']
    });
    confetti({
        ...defaults,
        shapes: [heart],
        colors: ['#f93963', '#a10864', '#ee0b93']
    });
}

// 공용 이벤트 함수 > 공유하기
function OnShareApp(){
    var packageID = "app.netlify.nalmada.twa";
    fnShareLink('날마다성경','성경 통독 계획표를 만들고,날마다 성경을 읽어보세요.','https://nalmada.netlify.app', packageID);
}

function OnResetApp(){
    if(!confirm("데이터를 정말 초기화 하시겠습니까?")) return;

    DBHelper.fnDeleteDB().then(() => {
        console.log('DB 삭제 완료');
        localStorage.clear();
    }).catch(err => {
        console.error('DB 삭제 실패:', err);
    });

    setTimeout(() => { alert("초기화 되었습니다."); location.reload(); }, 1500);
}

// #endregion 공용 이벤트 함수 -------------------------------------------------------------------------


// #region 테스트 함수-------------------------------------------------------------------------------

function TestPlan(){
    //PlanHelper.fnSaveReadingRecords(1, 1, [1, 3, 5]);
    //PlanHelper.fnSaveReadingPlan("24.10.18");
}

// #endregion 테스트 함수-------------------------------------------------------------------------------