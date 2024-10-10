const DBHelper = (function () {
    const dbName = 'myDatabase'; // 데이터베이스 이름
    const dbVersion = 1; // 데이터베이스 버전
    let db = null; // IndexedDB 참조 변수

    // DB 초기화 및 생성
    function fnInitDB(storeSchemas) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, dbVersion);

            request.onupgradeneeded = function (event) {
                db = event.target.result;
                // 오브젝트 스토어가 없으면 생성
                storeSchemas.forEach(schema => {
                    if (!db.objectStoreNames.contains(schema.name)) {
                        const objectStore = db.createObjectStore(schema.name, { keyPath: schema.keyPath });
                        // 인덱스 추가
                        if (schema.indices) {
                            schema.indices.forEach(index => {
                                objectStore.createIndex(index.name, index.keyPath, { unique: index.unique });
                            });
                        }
                    }
                });
            };

            request.onsuccess = function (event) {
                db = event.target.result;
                resolve(db); // DB 참조 반환
            };

            request.onerror = function (event) {
                reject('DB initialization failed: ' + event.target.errorCode);
            };
        });
    }

    // DB 존재 여부 체크 (DB가 존재하는지만 확인)
    function fnCheckDBExists(dbName) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName);

            request.onsuccess = function (event) {
                // DB가 이미 존재하는 경우
                const db = event.target.result;
                db.close();
                resolve(true); // 존재함
            };

            request.onupgradeneeded = function () {
                // DB가 없는 경우 새로 생성되지 않도록 함
                request.transaction.abort();
                resolve(false); // 존재하지 않음
            };

            request.onerror = function (event) {
                reject('Error checking DB existence: ' + event.target.errorCode);
            };
        });
    }

    // 단일 데이터 저장
    function fnSaveData(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.add(data);

            request.onsuccess = function () {
                resolve('Data saved successfully');
            };

            request.onerror = function (event) {
                reject('Data save failed: ' + event.target.errorCode);
            };
        });
    }

    // 여러 데이터를 한번에 저장 (대량 데이터 처리)
    function fnBulkSaveData(storeName, dataArray) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);

            dataArray.forEach(data => {
                objectStore.add(data);
            });

            transaction.oncomplete = function () {
                resolve('All data saved successfully');
            };

            transaction.onerror = function (event) {
                reject('Bulk save failed: ' + event.target.errorCode);
            };
        });
    }

    // JSON 파일을 비동기적으로 로드하여 IndexedDB에 저장
    function fnLoadAndSaveJSON(filePath, storeName, progressCallback) {
        return fetch(filePath)
            .then(response => response.json())
            .then(jsonData => {
                return fnSaveLargeJSONToDB(storeName, jsonData, progressCallback);
            })
            .catch(error => {
                console.error('Error loading JSON file:', error);
                throw error;
            });
    }

    // 큰 JSON 데이터를 IndexedDB에 저장하는 함수 (진행 상태 포함)
    function fnSaveLargeJSONToDB(storeName, jsonData, progressCallback) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);

            const totalItems = jsonData.length;
            let processedItems = 0;

            jsonData.forEach((data, index) => {
                const request = objectStore.add(data);
                request.onsuccess = function () {
                    processedItems++;
                    const progress = Math.floor((processedItems / totalItems) * 100);
                    if (progressCallback) {
                        progressCallback(progress); // 진행 상태 업데이트
                    }
                };

                request.onerror = function (event) {
                    reject('Error saving data: ' + event.target.errorCode);
                };
            });

            transaction.oncomplete = function () {
                resolve('All data saved successfully');
            };

            transaction.onerror = function (event) {
                reject('Transaction failed: ' + event.target.errorCode);
            };
        });
    }

    // 특정 키로 데이터 조회
    function fnGetDataByKey(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.get(key);

            request.onsuccess = function (event) {
                resolve(event.target.result);
            };

            request.onerror = function (event) {
                reject('Data fetch by key failed: ' + event.target.errorCode);
            };
        });
    }

    // 오브젝트 스토어에서 모든 데이터 조회
    function fnGetAllData(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.getAll();

            request.onsuccess = function (event) {
                resolve(event.target.result);
            };

            request.onerror = function (event) {
                reject('Data fetch failed: ' + event.target.errorCode);
            };
        });
    }

    // DB 삭제
    function fnDeleteDB() {
        return new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(dbName);

            deleteRequest.onsuccess = function () {
                resolve('Database deleted successfully');
            };

            deleteRequest.onerror = function (event) {
                reject('Database deletion failed: ' + event.target.errorCode);
            };
        });
    }

    return {
        fnInitDB,
        fnCheckDBExists,
        fnSaveData,
        fnBulkSaveData,
        fnLoadAndSaveJSON,
        fnSaveLargeJSONToDB,
        fnGetDataByKey,
        fnGetAllData,
        fnDeleteDB
    };
})();
