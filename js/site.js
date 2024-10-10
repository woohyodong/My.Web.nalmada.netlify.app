//site.js
//상수정의
const _APP_VERSION = "2024.1.0";
const _KEY_IS_INTRO = "#_KEY_IS_INTRO";
const _DB_NAME = "BibleDB";
const _DB_VERSION = 1;
const _DB_STORE = "bible";

//변수정의
const progressBar = document.getElementById('progressBar');

//이벤트 등록
document.addEventListener('DOMContentLoaded', InitPage);

// 공통 초기화
function InitPage() {

    //IsCheckIntro();

    //InitDB();

    document.addEventListener('contextmenu', function(event) {
        event.preventDefault();
      });
      
      document.addEventListener('keydown', function(event) {
        console.log(event.key);
        if (event.key === 'PrintScreen' || (event.ctrlKey && event.key === 'p')) {
          event.preventDefault();
          alert('스크린샷이 차단되었습니다.');
        }
      });
          

} //function initPage() {


function IsCheckIntro() {
    const isIntro = localStorage.getItem(_KEY_IS_INTRO);    
    if (!isIntro) $("#popup-intro").addClass("active");
}

//계획표 팝업 열기
function OpenPlanPopup() {$("#popup-plan").addClass("active");}
//팝업 닫기 (공용)
function ClosePopup(obj) {$(obj).parents(".popup").removeClass("active");}


async function InitDB(){
    try {
        // DB 존재 여부 체크
        const dbExists = await DBHelper.fnCheckDBExists('myDatabase');
        
        if (dbExists) {
            console.log('DB가 이미 존재합니다.');
        } else {
            console.log('DB가 존재하지 않으므로 초기화 및 데이터 로드를 시작합니다.');
            
            // DB 스키마 정의 후 초기화
            await DBHelper.fnInitDB([
                { 
                    name: 'Bible', 
                    keyPath: 'idx', // 고유 인덱스 필드를 키로 사용
                    indices: [
                        { name: 'cate', keyPath: 'cate', unique: false }, // 성경 구분 (구약/신약)
                        { name: 'book', keyPath: 'book', unique: false }, // 성경책 번호
                        { name: 'chapter', keyPath: 'chapter', unique: false }, // 장 번호
                        { name: 'paragraph', keyPath: 'paragraph', unique: false }, // 절 번호
                        { name: 'long_label', keyPath: 'long_label', unique: false }, // 성경책의 전체 이름
                        { name: 'short_label', keyPath: 'short_label', unique: false } // 성경책의 짧은 이름
                    ]
                }
            ]);
            console.log('DB 초기화 완료. 이제 JSON 데이터를 로드합니다.');

            // JSON 데이터를 로드하여 IndexedDB에 저장 (프로세스 바 업데이트)
            //await DBHelper.fnLoadAndSaveJSON('/data/bible_db.json', 'bible', updateProgressBar);
            //console.log('DB에 데이터 저장 완료.');
        }
    } catch (err) {
        console.error('DB 처리 중 오류 발생:', err);
    }
}


// 진행 상태 업데이트 함수
function updateProgressBar(progress) {
    if (progressBar) {
        progressBar.style.width = progress + '%';
        progressBar.innerText = progress + '% 완료';
    }
}


// 테스트 ----------------------------------------------------------------

function TestDeleteDB(){
    DBHelper.fnDeleteDB().then(() => {
        console.log('DB 삭제 완료');
    }).catch(err => {
        console.error('DB 삭제 실패:', err);
    });
}



