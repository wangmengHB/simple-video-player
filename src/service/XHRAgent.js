
class XHRAgent {
  /**
   *
   * @param {string} uri
   * @param {object} options  {method,body,timeout,resonseType,headers}
   */
  request(uri, options) {
    let xhr = new XMLHttpRequest();
    const promise = new Promise((resolve, reject) => {
      xhr.open(options.method || 'GET', uri, true);
      if (options.responseType) {
        xhr.responseType = options.responseType;
      }
      if (options.timeout) {
        xhr.timeout = options.timeout;
      }
      xhr.withCredentials = options.withCredentials;

      xhr.onabort = function () {
        if (xhr.activeAbort) {
          xhr.activeAbort = false;
        } else {
          reject(new NetworkError(NetworkError.Abort, uri));
        }
      };
      xhr.onload = function (event) {
        let { response, status } = event.target;
        if (status >= 200 && status <= 299 && status != 202) {
          resolve(response);
        } else {
          reject(new Error('请求{%1}时服务器返回出错'))
        }
      };
      xhr.onerror = function (e) {
        reject(new Error(NetworkError.HttpError, uri));
      };
      xhr.ontimeout = function () {
        reject(new Error(NetworkError.Timeout, uri));
      };
      xhr.onprogress = function (event) {
        if (!options.onProgress) return;
        options.onProgress(event);
      };

      // 设置 request headers
      for (let key in options.headers) {
        if (options.headers.hasOwnProperty(key)) {
          let lowercasedKey = key === 'Authorization' ? key : key.toLowerCase();
          xhr.setRequestHeader(lowercasedKey, options.headers[key]);
        }
      }
      // xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.send(options.body);
    });
    promise.catch(err => {
      xhr.activeAbort = true;
      xhr.abort();
      console.log('abort!');
    })

    
    return promise;
  }
}
export default new XHRAgent();
