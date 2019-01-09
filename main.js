window.jQuery = function (nodeOrSelector) {
    let nodes = {}
    nodes.addClass = function () { }
    nodes.html = function () { }
    return nodes
}

window.Promise = function(fn){
    // ....
    return {
        then: function(){}
    }
} //Promise 函数的大概构造形式

window.jQuery.ajax = function ({ url, method, body, headers }) {
    return new Promise(function (resolve, reject) { //返回一个 promise对象,所以下面可以用 then属性
        let request = new XMLHttpRequest()
        request.open(method, url)
        for (let key in headers) {
            let value = headers[key]
            request.setRequestHeader(key, value)
        }
        request.onreadystatechange = () => {
            if (request.readyState === 4) {
                if (request.status >= 200 && request.status < 300) {
                    resolve.call(undefined, request.responseText)
                } else if (request.status >= 400) {
                    reject.call(undefined, request)
                }
            }
        }
        request.send(body)
    })
}

myButton.addEventListener('click', function () {
    let promise = window.jQuery.ajax({
        url: '/xxx',
        method: 'get',
        headers: {
            'content-type': 'x-www-form-urlencoded',
            'wanggege': '18'
        },
    })
    promise.then( //then 之后又可以返回一个 promise对象,所以可以再次 then
        (responseText) => {
            console.log(responseText)
        },
        (request) => { console.log(request) })
})