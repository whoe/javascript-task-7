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
        let countResults = 0;
        let nextJob = 0;
        if (jobs.length === 0) {
            return [];
        }
        while (nextJob < parallelNum && nextJob < jobs.length) {
            runJob(nextJob++);
        }

        function runJob(jobIndex) {
            let concurents = [
                new Promise((resolveTimeout) => {
                    setTimeout(resolveTimeout, timeout, new Error('Promise timeout'));
                }),
                jobs[jobIndex]()
            ];
            Promise.race(concurents)
                .catch(result => handleResult(result, jobIndex))
                .then(result => handleResult(result, jobIndex));
        }

        function handleResult(result, jobIndex) {
            results[jobIndex] = result;
            if (++countResults === jobs.length) {
                resolve(results);

                return;
            }
            if (nextJob < jobs.length) {
                runJob(nextJob++);
            }
        }
    });
}


