//site.plan.js
const PlanHelper = (function() {    
    const _planDBKey = 'myPlan';
    const _planData = {
        readingMethod: null,
        readingMethodName: null,
        readingDays: [],
        readingDuration: null,
        readingDurationName: '',
        startDate: null,  // 시작일자
        endDate: null,    // 종료일자
        plan: []          // 최종 계획 데이터  ex)샘플구조 { "date": "24.10.01", "day": "월", "bible": "창세기 1:1 ~ 2:25", "completed": false, "newweek": true }
    };

    // 계획 데이터 생성
    async function fnCreatePlanData(method, weekDays, duration) {

        try{

            initPlanData();
            
            _planData.readingMethod = method;        
            _planData.readingDays = weekDays;
            _planData.readingDuration = duration;
            _planData.readingDurationName = getDurationText(duration);
            _planData.startDate = new Date();

            // 실제 읽을 수 있는 날 계산
            const actualDays = await calculateActualReadingDays(duration);
            let dbData;//DB에서 읽기 계획 데이터 가져오기

            switch(method) {
                case '01':
                    _planData.readingMethodName = '성경 순서로 읽기';
                    dbData = await DBHelper.fnGetAllData(_STORE_NAME_BIBLE_SUMMARY);
                    _planData.plan = await generateBiblePlan(dbData, actualDays);
                    break;
                case '02':
                    _planData.readingMethodName = '역사 순서로 읽기';
                    dbData = await DBHelper.fnGetAllData(_STORE_NAME_READING_HISTORICAL);
                    _planData.plan = await generateReadingPlan(dbData, actualDays);
                    break;
                case '03':
                    _planData.readingMethodName = '테마 순서로 읽기';
                    dbData = await DBHelper.fnGetAllData(_STORE_NAME_READING_THEME);
                    _planData.plan = await generateReadingPlan(dbData, actualDays);
                    break;
                case '04':
                    _planData.readingMethodName = '주제 순서로 읽기';
                    dbData = await DBHelper.fnGetAllData(_STORE_NAME_READING_TOPIC);
                    _planData.plan = await generateReadingPlan(dbData, actualDays);//
                    break;
                case '05':
                    _planData.readingMethodName = '구약/신약 혼합해서 읽기';
                    dbData = await DBHelper.fnGetAllData(_STORE_NAME_READING_MIXED);
                    _planData.plan = await generateReadingPlan(dbData, actualDays);
                    break;
                case '00':
                    _planData.readingMethodName = '내가 읽은 성경만 기록';                    
                    dbData = await DBHelper.fnGetAllData(_STORE_NAME_BIBLE_SUMMARY);
                    _planData.plan = await generateReadingRecords(dbData);
                    break;                
                default:
                    _planData.readingMethodName = '날마다 성경 읽기';
                    break;
            }

            if(method === '00') {
                _planData.startDate = formatDate(_planData.startDate);
                await DBHelper.fnSaveData(_STORE_NAME_PLAN, {key: _planDBKey, data: _planData});
            }
            else if(_planData.plan.length > 0) {
                _planData.endDate = _planData.plan[_planData.plan.length - 1].date;
                _planData.startDate = formatDate(_planData.startDate);
                //DB 저장 (Key값이 같으면 덮어쓰기 Update)
                await DBHelper.fnSaveData(_STORE_NAME_PLAN, {key: _planDBKey, data: _planData});

                // //DB에서 읽기 계획 데이터 가져오기
                // console.log("plan 1일 샘플 ->  ", `${_planData.plan[0].bible} (구분 : ${_planData.plan[0].category})`);
                // console.log("plan 1일 오진 ->  ", `${_planData.plan[0].bible_origin}`);
                // console.log("plan 2일 샘플 ->  ", `${_planData.plan[1].bible} (구분 : ${_planData.plan[1].category})`);
                // console.log("plan 2일 오진 ->  ", `${_planData.plan[1].bible_origin}`);
                // console.log("plan 60일 샘플 ->  ", `${_planData.plan[59].bible} (구분 : ${_planData.plan[1].category})`);
                // console.log("plan 60일 오진 ->  ", `${_planData.plan[59].bible_origin}`);
            }

            console.log("_planData", _planData);
            
        } catch (error) {
            throw error;
        }
    } // function fnCreatePlanData(method, days, duration)  end ----------------------------
    


    // 하루 평균 소요 시간을 계산하는 함수 (글자 수 기반, 현실적인 읽기 속도 반영)
    function fnCalculateAverageTime(totalDays, weekDays) {
        // 성경 고정 데이터 (개역개정판 기준 총 글자 수 제공)
        const totalCharacters = 1558650; // 성경 전체 글자 수 (개역개정판 기준)

        const totalWeeks = totalDays / 7;  // 총 주 수 계산
        const totalReadingDays = Math.floor(totalWeeks * weekDays);  // 실제 읽을 수 있는 날 수

        // 하루에 읽어야 할 글자 수 계산
        const charactersPerDay = totalCharacters / totalReadingDays;

        // 분당 읽을 수 있는 글자 수 (250자로 조정하여 현실적인 속도 적용)
        const charactersPerMinute = 250;  // 분당 읽을 수 있는 글자 수 (현실적인 속도 적용)

        // 하루 평균 소요 시간 (글자 수 ÷ 분당 읽을 수 있는 글자 수)
        const totalMinutesPerDay = charactersPerDay / charactersPerMinute;

        // 소요 시간을 '시간과 분'으로 변환
        const hours = Math.floor(totalMinutesPerDay / 60);  // 시간
        const minutes = Math.round(totalMinutesPerDay % 60);  // 분

        // 더 명확한 출력: 읽어야 할 글자 수도 함께 반환
        return {
            hours,
            minutes,
            charactersPerDay: Math.round(charactersPerDay)  // 하루에 읽어야 할 글자 수 반환
        };
    }

    // 남은 날짜 계산 함수 -> yy.MM.dd 형식의 종료일자를 받아서 남은 날짜를 계산
    function fnCalculateRemainingDays(endDate) {
        const today = new Date();
        const end = new Date(`20${endDate}`);  // YY.MM.DD 형식을 Date 객체로 변환
        const diffTime = end - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 남은 날짜 계산
    }

    // 읽은 구절을 기록하는 함수
    async function fnSaveReadingRecords(book, chapter, verses) {
        try {
            // PlanStore에서 계획 데이터 가져오기
            const planData = await DBHelper.fnGetDataByKey(_STORE_NAME_PLAN, _planDBKey);
    
            //console.log("planData", planData.data.plan);
        
            // 해당 성경책과 장을 찾기
            const bookEntry = planData.data.plan.find(plan => plan.book === book);
            if (!bookEntry) {
                console.error('해당 책을 찾을 수 없습니다.');
                return;
            }
        
            const chapterEntry = bookEntry.chaptersRead.find(chap => chap.chapter === chapter);
            if (!chapterEntry) {
                console.error('해당 장을 찾을 수 없습니다.');
                return;
            }
        
            // 읽은 절을 추가 (중복 추가 방지)
            verses.forEach(verse => {
                if (!chapterEntry.versesRead.includes(verse)) {
                    chapterEntry.versesRead.push(verse);
                }
            });
        
            // 완료 여부 확인 (모든 절을 읽었는지)
            if (chapterEntry.versesRead.length === chapterEntry.totalVerses) {
                chapterEntry.completed = true;
            }
        
            // 읽은 절 수 업데이트
            bookEntry.versesReadCount = bookEntry.chaptersRead.reduce((acc, chap) => acc + chap.versesRead.length, 0);
        
            // 책 완료 여부 확인
            if (bookEntry.versesReadCount === bookEntry.totalVerses) {
                bookEntry.completed = true;
            }
    
            console.log("bookEntry", bookEntry);
        
            // 업데이트된 데이터를 PlanStore에 저장 (planData 전체를 저장해야 함)
            await DBHelper.fnSaveData(_STORE_NAME_PLAN, planData);
        
            console.log('성공적으로 읽은 구절을 기록했습니다.');
        } catch (error) {
            console.error('오류가 발생했습니다:', error);
        }
    }
    
    // 체크리스트 달성 저장 ==> 토글 방식으로 완료/미완료 상태를 전환
    async function fnSaveReadingPlan(targetDate) {
        try {
            // PlanStore에서 계획 데이터 가져오기
            const planData = await DBHelper.fnGetDataByKey(_STORE_NAME_PLAN, _planDBKey);
    
            if (!planData || !planData.data.plan) {
                console.error('계획 데이터를 찾을 수 없습니다.');
                return;
            }
    
            // 주어진 날짜의 읽기 계획을 찾기
            const dayEntry = planData.data.plan.find(day => day.date === targetDate);
            if (!dayEntry) {
                console.error(`${targetDate}에 해당하는 읽기 계획을 찾을 수 없습니다.`);
                return;
            }
    
            // 읽기 완료 상태 토글 (true -> false 또는 false -> true)
            dayEntry.completed = !dayEntry.completed;
    
            // PlanStore에 업데이트된 데이터를 다시 저장
            await DBHelper.fnSaveData(_STORE_NAME_PLAN, planData);
    
            console.log(`${targetDate} 읽기 계획의 완료 상태가 ${dayEntry.completed ? '완료' : '미완료'}로 업데이트되었습니다.`);
        } catch (error) {
            console.error('오류가 발생했습니다:', error);
        }
    }
    
    
    // 내부 함수 --------------------------------------------------------------------------------------------

    // 계획 데이터 초기화
    function initPlanData() {
        _planData.readingMethod = null;
        _planData.readingMethodName = null;
        _planData.readingDays = [];
        _planData.readingDuration = null;
        _planData.startDate = null;
        _planData.endDate = null;
        _planData.plan = [];
    }

    // 실제 읽을 수 있는 날을 계산하는 함수 (선택된 요일만 고려)
    function calculateActualReadingDays(totalPlannedDays) {
        return new Promise((resolve) => {
            let currentDate = new Date();  // 시작 날짜 설정
            let actualDays = 0;  // 실제 읽을 수 있는 날 카운트

            // 총 계획 일수가 0이 될 때까지 반복
            while (totalPlannedDays > 0) {
                let currentDayOfWeek = currentDate.getDay();  // 현재 날짜의 요일 확인 (0: 일요일, 1: 월요일, ...)
                let currentDayString = getDayString(currentDayOfWeek);  // 숫자를 한글 요일로 변환

                // 선택한 요일인지 확인
                if (_planData.readingDays.includes(currentDayString)) {
                    actualDays++;  // 실제 읽을 수 있는 날 증가
                }

                // 날짜를 다음 날로 이동
                currentDate.setDate(currentDate.getDate() + 1);

                // 남은 총 계획 일수 감소
                totalPlannedDays--;
            }

            resolve(actualDays);  // 실제 읽기 가능한 날 수 반환
        });
    }    

    // 1. 성경 순서로 읽기 계획 생성 함수
    function generateBiblePlan(data, totalDays) {
        return new Promise((resolve, reject) => {
            const plan = [];
            let currentDate = new Date(_planData.startDate); // 시작 날짜 설정
            if (isNaN(currentDate.getTime())) {
                console.error("Invalid start date after conversion:", currentDate);
                reject("Invalid start date after conversion.");
                return;
            }
        
            // 구약과 신약 배열 합침
            let bookArray = data;

            //console.log("bookArray", bookArray);
        
            // 전체 절 수 계산 (각 장별 절 수를 모두 더함)
            let totalVerses = bookArray.reduce((sum, book) => {
                return sum + book.verses.reduce((chapterSum, versesInChapter) => chapterSum + versesInChapter, 0);
            }, 0);
        
            // 하루에 읽을 절 수 계산
            let versesPerDay = Math.ceil(totalVerses / totalDays);
            let currentBookIndex = 0;
            let totalPlanDays = 0;
            let lastWeek = getWeek(currentDate); // 마지막 주를 저장하는 변수
        
            bookArray.forEach(book => {
                book.currentChapter = 1; // 각 책의 첫 장을 시작점으로 설정
                book.currentVerse = 1;   // 각 장의 첫 절 설정
            });
        
            while (totalPlanDays < totalDays && currentBookIndex < bookArray.length) {
                let currentDayOfWeek = currentDate.getDay(); // 요일 확인
                let currentWeek = getWeek(currentDate); // ISO 표준 주 번호 확인
                let currentDayString = getDayString(currentDayOfWeek); // 숫자를 한글 요일로 변환
                let currentDateString = formatDate(currentDate); // 새로운 날짜 포맷 적용
        
                if (_planData.readingDays.includes(currentDayString)) {
                    let bibleEntries = []; // 하루에 읽을 성경 범위를 저장
                    let isNewWeek = false; // 새로운 주 여부
                    let remainingVersesForDay = versesPerDay; // 하루에 읽을 절 수
        
                    if (currentWeek !== lastWeek) {
                        isNewWeek = true;
                        lastWeek = currentWeek;
                    }
        
                    while (remainingVersesForDay > 0 && currentBookIndex < bookArray.length) {
                        let book = bookArray[currentBookIndex];
                        let versesInCurrentChapter = book.verses[book.currentChapter - 1] || 0; // 현재 장의 절 수
                        let currentVerseCount = book.currentVerse; // 현재 읽고 있는 절
                        let startChapter = book.currentChapter; // 시작 장
                        let startVerse = currentVerseCount; // 시작 절
                        let endChapter = startChapter; // 끝 장 (처음엔 시작 장과 동일)
                        let endVerse = versesInCurrentChapter; // 끝 절 (처음엔 현재 장의 끝 절)
        
                        if (remainingVersesForDay >= versesInCurrentChapter - currentVerseCount + 1) {
                            remainingVersesForDay -= (versesInCurrentChapter - currentVerseCount + 1);
                            book.currentChapter++; // 다음 장으로 넘어감
                            book.currentVerse = 1; // 다음 장의 첫 절로 초기화
                        } else {
                            // 남은 절 수만큼만 읽음
                            endVerse = currentVerseCount + remainingVersesForDay - 1;
                            book.currentVerse = endVerse + 1; // 다음에 읽을 절 설정
                            remainingVersesForDay = 0;
                        }
        
                        // 성경 범위 추가
                        bibleEntries.push(`${book.long_label} ${startChapter}:${startVerse} ~ ${endChapter}:${endVerse}`);
        
                        // 책이 끝났으면 다음 책으로 이동
                        if (book.currentChapter > book.chapter_count) {
                            currentBookIndex++;
                        }
                    }
        
                    const mergedBibleEntries = mergeBibleEntries(bibleEntries); // 연속된 구절 병합
        
                    if (mergedBibleEntries.length > 0) {
                        plan.push({
                            date: currentDateString,
                            day: currentDayString,
                            bible: mergedBibleEntries,
                            //bible_origin: bibleEntries,
                            completed: false,
                            newweek: isNewWeek,
                            category: ""
                        });
                        totalPlanDays++;
                    }
                }
        
                currentDate.setDate(currentDate.getDate() + 1); // 날짜를 하루씩 증가시킴
            }
        
            if (plan.length > 0) {
                resolve(plan);
            } else {
                console.warn("No plan data was generated.");
                resolve([]);
            }
        });
    }

    // 2. 역사,테마,주제,구약/신약 나머지 순서로 읽기 통합 계획 생성 함수
    function generateReadingPlan(data, totalDays) {
        return new Promise((resolve, reject) => {
            let result = [];
            let currentDate = new Date();  // 현재 날짜를 시작일로 설정
            let totalChapters = data.length;
            let currentEntryIndex = 0;
            let lastWeek = getWeek(currentDate); // 주 번호 확인
            let minChaptersPerDay = Math.floor(totalChapters / totalDays);  // 각 날에 최소한 할당해야 하는 장 수
            let extraChapters = totalChapters % totalDays;  // 남은 구절 수
        
            for (let currentDay = 1; currentDay <= totalDays; currentDay++) {
                let dailyBible = [];
                let dayCategory = data[currentEntryIndex].category;
                let isNewWeek = false;
    
                let dayOfWeek = currentDate.getDay();
                let dateString = formatDate(currentDate);
                let currentWeek = getWeek(currentDate);
    
                // 주의 첫 날인지 여부 확인
                if (currentWeek !== lastWeek) {
                    isNewWeek = true;
                    lastWeek = currentWeek;
                }
    
                // 각 날에 최소 장을 할당하고 남은 구절을 분배
                let chaptersForToday = minChaptersPerDay;
                if (extraChapters > 0) {
                    chaptersForToday++;  // 남은 구절을 하루씩 추가
                    extraChapters--;
                }
    
                // 필요한 구절을 일별로 분배
                while (dailyBible.length < chaptersForToday && currentEntryIndex < totalChapters) {
                    let currentEntry = data[currentEntryIndex];
                    let bibleText = `${currentEntry.bible}`;
                    dayCategory = currentEntry.category;
                    dailyBible.push(bibleText);
                    currentEntryIndex++;
                }
    
                // 병합된 구절을 적용
                const mergedBibleEntries = mergeBibleEntries(dailyBible);
    
                // 결과에 추가
                result.push({
                    "date": dateString,
                    "day": getDayString(dayOfWeek),
                    "bible": mergedBibleEntries,  // bible 속성을 문자열로 처리
                    //"bible_origin": dailyBible,  // 원본 데이터를 별도 속성으로 저장
                    "completed": false,
                    "newweek": isNewWeek,
                    "category": dayCategory
                });
    
                // 날짜 하루 증가
                currentDate.setDate(currentDate.getDate() + 1);
            }
    
            if (result.length > 0) {
                resolve(result);
            } else {
                reject("No plan data was generated.");
            }
        });
    }

    // 3. 내가 읽은 성경만 기록하는 계획 생성 함수
    function generateReadingRecords(data) {
        return new Promise((resolve, reject) => {
            let result = [];

            data.forEach((entry) => {
                let chaptersRead = [];
                let versesReadCount = 0;

                // 모든 장에 대해 versesRead는 비우고, completed는 false로 설정
                for (let i = 1; i <= entry.chapter_count; i++) {
                    chaptersRead.push({
                        chapter: i,
                        versesRead: [], // 아직 읽지 않은 상태로 비워둠
                        totalVerses: entry.verses[i - 1], // 해당 장의 총 절 수
                        completed: false // 아직 완료되지 않음
                    });
                }

                result.push({
                    book: entry.book,
                    long_label: entry.long_label,
                    short_label: entry.short_label,
                    category: entry.category, // category 속성 추가
                    totalChapters: entry.chapter_count,
                    chaptersRead: chaptersRead,
                    totalVerses: entry.verses.reduce((acc, cur) => acc + cur, 0), // 전체 절 수
                    versesReadCount: versesReadCount, // 초기 값으로 0 설정 (아직 읽지 않음)
                    verses: entry.verses, // verses 배열 추가
                    completed: false // 전체 책을 아직 읽지 않았음
                });
            });

            if (result.length > 0) {
                resolve(result);
            } else {
                reject("No plan data was generated.");
            }
        });
    }



    
    // 연속된 성경 구절을 병합하는 함수 (공용 함수로 외부로 이동)
    function mergeBibleEntries(bibleEntries) {
        if (bibleEntries.length === 0) return "";

        let mergedEntries = [];
        let currentBook = null;
        let startChapter = null;
        let startVerse = null;
        let endChapter = null;
        let endVerse = null;

        if(_planData.readingMethod === '01') { //성경 순서로 읽기

            bibleEntries.forEach((entry, index) => {
                if (!entry || typeof entry !== 'string') {
                    console.warn("Invalid entry found, skipping:", entry);
                    return;
                }

                const parts = entry.split(" "); // "창세기 1:1 ~ 1:31" 같은 형식일 경우 분리
                if (parts.length < 4 || parts[2] !== "~") {
                    console.warn("Invalid format, skipping:", entry);
                    return;
                }

                const bookLabel = parts[0]; // 책 이름 (창세기)
                const start = parts[1]; // 시작 구절 (1:1)
                const end = parts[3]; // 끝 구절 (1:31)

                // 시작 장:절과 끝 장:절을 분리하여 숫자로 변환
                const [startCh, startVs] = start.split(":").map(Number); // 시작 장과 절
                let endCh = startCh, endVs = startVs; // 기본적으로 시작 구절로 초기화

                // 끝 구절이 존재하고, 제대로된 포맷이라면 처리
                if (end && end.includes(":")) {
                    [endCh, endVs] = end.split(":").map(Number);
                }

                if (isNaN(startCh) || isNaN(startVs) || isNaN(endCh) || isNaN(endVs)) {
                    console.warn("Invalid chapter/verse format, skipping:", start, end);
                    return;
                }

                if (!currentBook) {
                    // 첫 번째 구절 시작
                    currentBook = bookLabel;
                    startChapter = startCh;
                    startVerse = startVs;
                    endChapter = endCh;
                    endVerse = endVs;
                } else if (currentBook === bookLabel && ((startCh === endChapter && startVs === endVerse + 1) || (startCh === endChapter + 1 && startVs === 1))) {
                    // 같은 책이고, 장과 절이 연속되면 범위 확장
                    endChapter = endCh;
                    endVerse = endVs;
                } else {
                    // 연속되지 않는 경우 병합된 범위를 저장하고 새 범위 시작
                    mergedEntries.push(`${currentBook} ${startChapter}:${startVerse} ~ ${endChapter}:${endVerse}`);
                    currentBook = bookLabel;
                    startChapter = startCh;
                    startVerse = startVs;
                    endChapter = endCh;
                    endVerse = endVs;
                }

                // 마지막 entry는 병합하여 추가
                if (index === bibleEntries.length - 1) {
                    mergedEntries.push(`${currentBook} ${startChapter}:${startVerse} ~ ${endChapter}:${endVerse}`);
                }
            });

        } 
        else if(_planData.readingMethod === '05') { //구약/신약 혼합해서 읽기

            bibleEntries.forEach((entry, index) => {
                if (!entry || typeof entry !== 'string') {
                    console.warn("Invalid entry found, skipping:", entry);
                    return;
                }
        
                const sections = entry.split(", "); // 책별로 분리
                sections.forEach((section) => {
                    const parts = section.split(" "); // 책 이름과 구절 범위 분리
                    if (parts.length < 4 || parts[2] !== "~") {
                        console.warn("Invalid format, skipping:", section);
                        return;
                    }
        
                    const bookLabel = parts[0]; // 책 이름 (창세기)
                    const start = parts[1]; // 시작 구절 (1:1)
                    const end = parts[3]; // 끝 구절 (1:31)
        
                    // 시작 장:절과 끝 장:절을 분리하여 숫자로 변환
                    const [startCh, startVs] = start.split(":").map(Number); // 시작 장과 절
                    let endCh = startCh, endVs = startVs; // 기본적으로 시작 구절로 초기화
        
                    // 끝 구절이 존재하고, 제대로 된 포맷이라면 처리
                    if (end && end.includes(":")) {
                        [endCh, endVs] = end.split(":").map(Number);
                    }
        
                    if (isNaN(startCh) || isNaN(startVs) || isNaN(endCh) || isNaN(endVs)) {
                        console.warn("Invalid chapter/verse format, skipping:", start, end);
                        return;
                    }
        
                    if (!currentBook) {
                        // 첫 번째 구절 시작
                        currentBook = bookLabel;
                        startChapter = startCh;
                        startVerse = startVs;
                        endChapter = endCh;
                        endVerse = endVs;
                    } else if (currentBook === bookLabel && ((startCh === endChapter && startVs === endVerse + 1) || (startCh === endChapter + 1 && startVs === 1))) {
                        // 같은 책이고, 장과 절이 연속되면 범위 확장
                        endChapter = endCh;
                        endVerse = endVs;
                    } else {
                        // 연속되지 않는 경우 병합된 범위를 저장하고 새 범위 시작
                        mergedEntries.push(`${currentBook} ${startChapter}:${startVerse} ~ ${endChapter}:${endVerse}`);
                        currentBook = bookLabel;
                        startChapter = startCh;
                        startVerse = startVs;
                        endChapter = endCh;
                        endVerse = endVs;
                    }
                });
        
                // 마지막 entry는 병합하여 추가
                if (index === bibleEntries.length - 1) {
                    mergedEntries.push(`${currentBook} ${startChapter}:${startVerse} ~ ${endChapter}:${endVerse}`);
                }
            });
        
            // 책별로 구절 병합
            return groupAndMergeBibleEntries(mergedEntries.join(", "));
        }
        else { //역사,테마,주제 순서로 읽기

            bibleEntries.forEach((entry, index) => {
                if (!entry || typeof entry !== 'string') return;
        
                const sections = entry.split(", "); // 각 책과 장 구분
                sections.forEach((section) => {
                    const parts = section.split(" ");
                    const bookLabel = parts[0]; // 책 이름 추출
                    let chapterRange = parts.slice(1).join(" "); // 장 범위 추출
                    let chapterParts = chapterRange.split("~").map(ch => ch.trim()); // 범위를 분리
        
                    // 시작 장과 끝 장을 추출
                    let startCh = parseInt(chapterParts[0].replace("장", ""), 10);
                    let endCh = chapterParts[1] ? parseInt(chapterParts[1].replace("장", ""), 10) : startCh;
        
                    // 첫 번째 entry 처리
                    if (!currentBook) {
                        currentBook = bookLabel;
                        startChapter = startCh;
                        endChapter = endCh;
                    } else if (currentBook === bookLabel && endChapter + 1 === startCh) {
                        // 같은 책이고 연속된 장이면 병합
                        endChapter = endCh;
                    } else {
                        // 연속되지 않으면 기존 항목 병합 후 새 항목 시작
                        mergedEntries.push(formatChapterRange(currentBook, startChapter, endChapter));
                        currentBook = bookLabel;
                        startChapter = startCh;
                        endChapter = endCh;
                    }
                });
        
                // 마지막 항목 병합
                if (index === bibleEntries.length - 1) {
                    mergedEntries.push(formatChapterRange(currentBook, startChapter, endChapter));
                }
            });
        }

        return mergedEntries.join(", ");
    }



    // 책별로 병합하는 함수
    function groupAndMergeBibleEntries(testData) {
        let mergedEntries = [];
        let finalMergedEntries = [];
    
        // 1차로 구절을 분리하여 책별로 그룹화
        const entries = testData.split(",").map(entry => entry.trim()); // 구절을 ,로 분리하고 트림
    
        // 각 구절을 분리하여 처리
        entries.forEach((entry) => {
            const spaceIndex = entry.indexOf(" "); // 책 이름과 구절 범위를 나누는 첫 번째 공백 찾기
            const book = entry.slice(0, spaceIndex); // 책 이름 추출
            const chapterVerseRange = entry.slice(spaceIndex + 1).trim(); // 구절 범위 전체 추출
            mergedEntries.push({ book, range: chapterVerseRange }); // 책과 구절 범위 객체로 저장
        });
    
    
        // 책별로 구절 병합
        let groupedEntries = {};
        mergedEntries.forEach(({ book, range }) => {
            if (!groupedEntries[book]) {
                groupedEntries[book] = [];
            }
            groupedEntries[book].push(range);
        });
    
        // 범위 병합 로직
        Object.keys(groupedEntries).forEach((book) => {
            const ranges = groupedEntries[book];
    
            // 첫 번째 구절 시작 장과 절
            let [startCh, startVs] = ranges[0].split("~")[0].split(":").map(Number); 
    
            // 끝 구절이 있는 경우 처리, 없는 경우 시작 구절로 끝 구절을 설정
            let [endCh, endVs] = ranges[0].includes("~") 
                ? ranges[0].split("~")[1].split(":").map(Number) 
                : [startCh, startVs]; 
    
            for (let i = 1; i < ranges.length; i++) {
                let nextStartCh, nextStartVs, nextEndCh, nextEndVs;
    
                // "~"가 있는지 확인하여 범위 처리
                if (ranges[i].includes("~")) {
                    const [nextStart, nextEnd] = ranges[i].split("~").map(v => v.trim());
                    [nextStartCh, nextStartVs] = nextStart.split(":").map(Number);
                    [nextEndCh, nextEndVs] = nextEnd.split(":").map(Number);
                } else {
                    // "~"가 없으면 단일 구절로 처리
                    [nextStartCh, nextStartVs] = ranges[i].split(":").map(Number);
                    nextEndCh = nextStartCh;
                    nextEndVs = nextStartVs;
                }
    
                // 범위가 연속되면 병합
                if ((nextStartCh === endCh && nextStartVs === endVs + 1) || (nextStartCh === endCh + 1 && nextStartVs === 1)) {
                    endCh = nextEndCh;
                    endVs = nextEndVs;
                } else {
                    // 연속되지 않으면 저장하고 새 범위 시작
                    finalMergedEntries.push(`${book} ${startCh}:${startVs} ~ ${endCh}:${endVs}`);
                    [startCh, startVs] = [nextStartCh, nextStartVs];
                    [endCh, endVs] = [nextEndCh, nextEndVs];
                }
            }
    
            // 마지막 범위 병합
            finalMergedEntries.push(`${book} ${startCh}:${startVs} ~ ${endCh}:${endVs}`);
        });
    
        return finalMergedEntries.join(", ");
    }
    


    function formatChapterRange(bookLabel, startChapter, endChapter) {
        return startChapter === endChapter
            ? `${bookLabel} ${startChapter}장`
            : `${bookLabel} ${startChapter}장 ~ ${endChapter}장`;
    }


    function formatDate(date) { return fnFormatDate(date, "yy.MM.dd"); }

    // 요일 이름 변환 함수 (숫자를 한글로 변환)
    function getDayString(dayOfWeek) {
        const days = ["일", "월", "화", "수", "목", "금", "토"];
        return days[dayOfWeek];
    }

    // 주 번호를 반환하는 함수 (ISO 8601 기준)
    function getWeek(date) {
        const target = new Date(date.valueOf());
        const dayNr = (date.getDay() + 6) % 7; // ISO 기준: 월요일 = 0
        target.setDate(target.getDate() - dayNr + 3); // 주의 첫날을 목요일로 설정
        const firstThursday = new Date(target.getFullYear(), 0, 4);
        const diff = target - firstThursday;
        return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000)); // 주 계산
    }

    // 기간을 텍스트로 변환하는 함수
    function getDurationText(duration) {
        switch (duration) {
            case 90:
                return '3개월';
            case 180:
                return '6개월';
            case 360:
                return '1년';
            case 540:
                return '1년 6개월';
            case 720:
                return '2년';            
            default:
                return `${duration} 일간`;
        }
    }    

    return {
        fnCreatePlanData,
        fnSaveReadingRecords,
        fnSaveReadingPlan,
        fnCalculateAverageTime,
        fnCalculateRemainingDays
    };

})();

