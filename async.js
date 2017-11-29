'use strict';

exports.isStar = false;
exports.runParallel = runParallel;

function limitedPromiseByTime(wrappedJob, timeout) {
    return Promise.race([
        new Promise((resolve) =>
            setTimeout(resolve, timeout, new Error('Promise timeout'))),
        wrappedJob.job().then((response) => ({ response, index: wrappedJob.index }))
    ]);
}

class JobsContainer {
    constructor(jobs, timeout) {
        this._wrappedJobs = jobs.map((job, index) => ({ job, index }));
        this._result = [];
        this._nextJobIndex = 0;
        this._timeout = timeout;
    }

    run(parallelNum, finishCallback) {
        this._finishCallback = finishCallback;
        while (this._nextJobIndex < parallelNum &&
            this._nextJobIndex < this._wrappedJobs.length) {
            limitedPromiseByTime(this._wrappedJobs[this._nextJobIndex], this._timeout)
                .then(this._runNext.bind(this));
            this._nextJobIndex++;
        }
    }

    _runNext(jobWrapperResult) {
        if (this._nextJobIndex >= this._wrappedJobs.length) {
            this._finishCallback(this._result);

            return;
        }
        let data = jobWrapperResult instanceof Error ? jobWrapperResult : jobWrapperResult.response;
        this._result[jobWrapperResult.index] = data;
        let nextWrappedJob = this._wrappedJobs[this._nextJobIndex++];
        limitedPromiseByTime(nextWrappedJob, this._timeout)
            .then(this._runNext.bind(this));
    }
}

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 * @returns {Promise}
 */
function runParallel(jobs, parallelNum, timeout = 1000) {
    let jobsContainer = new JobsContainer(jobs, timeout);

    return new Promise((resolve) => {
        jobsContainer.run(parallelNum, resolve);
    });
}
