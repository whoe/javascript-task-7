'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 * @returns {Promise}
 */
function runParallel(jobs, parallelNum, timeout = 1000) {
    return new Promise((resolve) => {
        let results = [];
        let nextJob = 0;
        if (jobs.length === 0) {
            return [];
        }
        while (nextJob < parallelNum && nextJob < jobs.length) {
            runJob(nextJob++);
        }

        function runJob(jobIndex) {
            if (jobIndex >= jobs.length) {
                resolve(results);

                return;
            }
            let concurents = [
                new Promise((resolveTimeout) => {
                    setTimeout(resolveTimeout, timeout, new Error('Promise timeout'));
                }),
                jobs[jobIndex]()
            ];
            Promise.race(concurents)
                .then(result => {
                    results[jobIndex] = result;
                    runJob(nextJob++);
                })
                .catch(result => {
                    results[jobIndex] = result;
                    runJob(nextJob++);
                });
        }
    });
}


