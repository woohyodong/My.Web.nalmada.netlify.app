const DBHelper = (function () {
    const _dbName = 'myDatabase'; // 데이터베이스 이름
    const _dbVersion = 20241105; // 데이터베이스 버전
    let _db = null; // IndexedDB 참조 변수

    // DB 초기화 및 생성
    function fnInitDB(storeSchemas) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(_dbName, _dbVersion);

            request.onupgradeneeded = function (event) {
                _db = event.target.result;
                // 오브젝트 스토어가 없으면 생성
                storeSchemas.forEach(schema => {
                    if (!_db.objectStoreNames.contains(schema.name)) {
                        const objectStore = _db.createObjectStore(schema.name, { keyPath: schema.keyPath || null, autoIncrement: schema.autoIncrement || false });
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
                _db = event.target.result;
                resolve(_db); // DB 참조 반환
            };

            request.onerror = function (event) {
                reject('DB initialization failed: ' + event.target.errorCode);
            };
        });
    }


    // DB 존재 여부 체크 (DB가 존재하는지만 확인)
    function fnCheckDBExists(dbName) {
        dbName = dbName || _dbName;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName);

            request.onsuccess = function (event) {
                // DB가 이미 존재하는 경우
                // const db = event.target.result;
                // db.close();
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
            const transaction = _db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            // put() 메서드는 동일한 키가 있으면 덮어쓰고, 없으면 새로 저장합니다.
            const request = objectStore.put(data);

            request.onsuccess = function (event) {
                resolve(data);
            };

            request.onerror = function (event) {
                reject('Data save failed: ' + event.target.errorCode);
            };
        });
    }

    // 여러 데이터를 한번에 저장 (대량 데이터 처리)
    function fnBulkSaveData(storeName, dataArray) {
        return new Promise((resolve, reject) => {
            const transaction = _db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);

            dataArray.forEach(data => {
                //objectStore.add(data);
                objectStore.put(data);
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
    function fnLoadAndSaveJSON(filePath, storeName, keyPath, progressCallback) {
        return fetch(filePath)
            .then(response => response.json())
            .then(jsonData => {
                let extractedData;

                // keyPath가 있으면 해당 데이터를 추출
                if (keyPath) {
                    extractedData = jsonData[keyPath];
                    if (!Array.isArray(extractedData)) {
                        throw new Error(`Loaded JSON does not contain valid array at keyPath: ${keyPath}`);
                    }
                } else {
                    // keyPath가 없으면 jsonData가 배열인지 확인 후 처리
                    if (Array.isArray(jsonData)) {
                        extractedData = jsonData;
                    } else {
                        throw new Error("Loaded JSON is not a valid array or does not contain an array at the root.");
                    }
                }

                return fnSaveLargeJSONToDB(storeName, extractedData, progressCallback);
            })
            .catch(error => {
                console.error('Error loading JSON file:', error);
                throw error;
            });
    }

    
    

    // 큰 JSON 데이터를 IndexedDB에 저장하는 함수 (진행 상태 포함)
    function fnSaveLargeJSONToDB(storeName, jsonData, progressCallback) {
        return new Promise((resolve, reject) => {
            const transaction = _db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);
    
            const totalItems = jsonData.length;
            let processedItems = 0;
    
            jsonData.forEach((data, index) => {
                // 키가 없는 데이터를 추가할 때 자동 키 생성
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
            // 이미 DB가 초기화되어 있으면 바로 접근
            if (_db) {
                getDataByKey(_db, storeName, resolve, reject, key);
            } else {
                // DB가 초기화되지 않은 경우 새로 열기
                const request = indexedDB.open(_dbName, _dbVersion);

                request.onsuccess = function (event) {
                    _db = event.target.result;
                    getDataByKey(_db, storeName, resolve, reject, key);
                };

                request.onerror = function (event) {
                    reject('Database open error: ' + event.target.errorCode);
                };
            }
        });
    }

    // 인덱스 기반으로 데이터 조회
    function fnGetDataByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            // 이미 DB가 초기화되어 있으면 바로 접근
            if (_db) {
                getDataByIndex(_db, storeName, resolve, reject, indexName, value);
            } else {
                // DB가 초기화되지 않은 경우 새로 열기
                const request = indexedDB.open(_dbName, _dbVersion);

                request.onsuccess = function (event) {
                    _db = event.target.result;
                    getDataByIndex(_db, storeName, resolve, reject, indexName, value);
                };

                request.onerror = function (event) {
                    reject('Database open error: ' + event.target.errorCode);
                };
            }
        });
    }


    // 오브젝트 스토어에서 모든 데이터 조회
    function fnGetAllData(storeName) {
        return new Promise((resolve, reject) => {
            // 이미 DB가 초기화되어 있으면 바로 접근
            if (_db) {
                getAllStoreData(_db, storeName, resolve, reject);
            } else {
                // DB가 초기화되지 않은 경우 새로 열기
                const request = indexedDB.open(_dbName, _dbVersion);

                request.onsuccess = function (event) {
                    _db = event.target.result;
                    getAllStoreData(_db, storeName, resolve, reject);
                };

                request.onerror = function (event) {
                    reject('Database open error: ' + event.target.errorCode);
                };
            }
        });
    }
    // DB 삭제
    function fnDeleteDB(dbName) {
        dbName = dbName || _dbName;
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

    // 특정 스토어 내에 데이터가 존재하는지 체크하는 함수
    function fnCheckStoreHasData(storeName) {
        return new Promise((resolve, reject) => {
            // 이미 DB가 초기화되어 있으면 바로 접근
            if (_db) {
                checkStoreData(_db, storeName, resolve, reject);
            } else {
                // DB가 초기화되지 않은 경우 새로 열기
                const request = indexedDB.open(_dbName, _dbVersion);
    
                request.onsuccess = function (event) {
                    _db = event.target.result;
                    checkStoreData(_db, storeName, resolve, reject);
                };
    
                request.onerror = function (event) {
                    reject('Database open error: ' + event.target.errorCode);
                };
            }
        });
    }


    // 내부 함수 --------------------------------------------------------------------------------------------
    
    // 스토어 내 데이터가 존재하는지 체크하는 함수 (별도 함수로 분리)
    function checkStoreData(db, storeName, resolve, reject) {
        if (!db.objectStoreNames.contains(storeName)) {
            reject(`Store ${storeName} does not exist in the database.`);
            return;
        }
    
        const transaction = db.transaction([storeName], 'readonly');
        const objectStore = transaction.objectStore(storeName);
        const countRequest = objectStore.count(); // 데이터 개수 확인
    
        countRequest.onsuccess = function () {
            const count = countRequest.result;
            resolve(count > 0); // 데이터가 존재하면 true 반환
        };
    
        countRequest.onerror = function (event) {
            reject('Error checking store data: ' + event.target.errorCode);
        };
    }



    // 특정 스토어에서 모든 데이터를 가져오는 내부 함수
    function getAllStoreData(database, storeName, resolve, reject) {
        try {
            const transaction = database.transaction([storeName], 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.getAll();

            request.onsuccess = function (event) {
                resolve(event.target.result);
            };

            request.onerror = function (event) {
                reject('Data fetch failed: ' + event.target.errorCode);
            };
        } catch (error) {
            reject('Transaction failed: ' + error);
        }
    }
    
    // 특정 키로 데이터 조회
    function getDataByKey(database, storeName, resolve, reject, key) {

        try {
            const transaction = database.transaction([storeName], 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.get(key);

            request.onsuccess = function (event) {
                resolve(event.target.result);
            };

            request.onerror = function (event) {
                reject('Data fetch failed: ' + event.target.errorCode);
            };
        } catch (error) {
            reject('Transaction failed: ' + error);
        }
    }

    // 인덱스 기반으로 데이터 조회
    function getDataByIndex(database, storeName, resolve, reject, indexName, value) {

        try {
            const transaction = database.transaction([storeName], 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const index = objectStore.index(indexName);
            const request = index.getAll(value); // 인덱스 값으로 여러 데이터를 가져오기 위해 getAll 사용

            request.onsuccess = function (event) {
                resolve(event.target.result);
            };

            request.onerror = function (event) {
                reject('Data fetch failed: ' + event.target.errorCode);
            };
        } catch (error) {
            reject('Transaction failed: ' + error);
        }
    }    
    

    return {
        fnInitDB,
        fnCheckDBExists,
        fnSaveData,
        fnBulkSaveData,
        fnLoadAndSaveJSON,
        fnSaveLargeJSONToDB,
        fnGetDataByKey,
        fnGetDataByIndex,
        fnGetAllData,
        fnDeleteDB,
        fnCheckStoreHasData
    };
})();
