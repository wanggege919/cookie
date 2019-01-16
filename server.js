var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}

let sessions = {

}
var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url
  var queryString = ''
  if (pathWithQuery.indexOf('?') >= 0) { queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/

  console.log('方方说：含查询字符串的路径\n' + pathWithQuery)

  if (path ==='/') {
    let string = fs.readFileSync('./index.html', 'utf8')
    let cookies = ''
    if (request.headers.cookie) {
      cookies = request.headers.cookie.split('; ') //['email = 1@','a=1','b=2']
    }
    let hash = {}
    // cookies.forEach((x) => {
    //   var parts = x.split('=')
    //   let key = parts[0]
    //   let value = parts[1]
    //   hash[key] = value
    // })
    for(let i=0;i<cookies.length;i++){
      var parts = cookies[i].split('=')
        let key = parts[0]
        let value = parts[1]
        hash[key] = value
    }
    let mySession = sessions[hash.sessionId]
    let email
    if(mySession){
      email = mySession.sign_in_email
    }
    let users = fs.readFileSync('./db/users', 'utf8')
    users = JSON.parse(users)
    let foundUser
    for (let i = 0; i < users.length; i++) {
      if (users[i].email === email) {
        foundUser = users[i]
        break
      }
    }
    if (foundUser) {
      string = string.replace('__password__', foundUser.password)
    } else {
      string = string.replace('__password__', '不知道')
    }
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  } else if (path === '/sign_up' && method === 'GET') {
    let string = fs.readFileSync('./sign_up.html', 'utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  } else if (path === '/sign_up' && method === 'POST') {
    readBody(request).then((body) => {
      let strings = body.split('&') //['email = 1','password = 2','password_confirmation = 3']
      let hash = {}
      strings.forEach((string) => {
        let parts = string.split('=') //['email','1']
        let key = parts[0]
        let value = parts[1]
        hash[key] = decodeURIComponent(value) //hash['email'] = '1' 把value转码
      })
      // let email = hash['email']
      // let password = hash['password']
      // let password_confirmation = hash['password_confirmation']
      let { email, password, password_confirmation } = hash  //es6 语法  与上面三句等同
      if (email.indexOf('@') === -1) {
        response.statusCode = 400
        response.setHeader('Content-Type', 'application/json;charset=utf-8')
        response.write(`{
          "errors": {
            "email": "invalid"
          }
        }`)
      } else if (password !== password_confirmation) {
        response.statusCode = 400
        response.write('Password not match')
      } else {
        var users = fs.readFileSync('./db/users', 'utf8') //字符串
        try {
          users = JSON.parse(users)
        } catch (exception) {
          users = []
        }//用来排错
        //users = JSON.parse(users)  //数组
        let inUse = false
        for (let i = 0; i < users.length; i++) {
          let user = users[i]
          if (user.email === email) {
            inUse = true
            break
          }
        }
        if (inUse) {
          response.statusCode = 400
          response.write('email in use')
        } else {
          users.push({ email: email, password: password }) //users现在是一个对象,对象是不能直接存的,必须转化为字符串
          var usersString = JSON.stringify(users)
          fs.writeFileSync('./db/users', usersString)
          response.statusCode = 200
        }
      }
      response.end()
    })
  } else if (path === '/sign_in' && method === 'GET') {//获取登录页面
    let string = fs.readFileSync('./sign_in.html', 'utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  } else if (path === '/sign_in' && method === 'POST') {
    readBody(request).then((body) => {
      let strings = body.split('&')
      let hash = {}
      strings.forEach((string) => {
        let parts = string.split('=')
        let key = parts[0]
        let value = parts[1]
        hash[key] = decodeURIComponent(value)
      })
      let { email, password } = hash
      console.log('email')
      console.log(email)
      console.log('password')
      console.log(password)

      let users = fs.readFileSync('./db/users', 'utf8')
      try {
        users = JSON.parse(users)
      } catch (exception) {
        users = []
      }
      let found
      for (let i = 0; i < users.length; i++) {
        if (users[i].email === email && users[i].password === password) {
          found = true
          break
        }
      }

      if (found) {
        let sessionId = Math.random() * 100000
        sessions[sessionId] = { sign_in_email: email }
        response.setHeader('Set-Cookie', `sessionId=${sessionId}`)
        response.statusCode = 200
      } else {
        response.statusCode = 401  //401就是认证失败,用户名或者密码错啦
      }

      response.end()
    })
  } else if (path === '/main.js') {//这个路径是绝对路径,HTTP里的路径都是绝对路径
    let string = fs.readFileSync('./main.js', 'utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/javascript;charset=utf-8')
    response.write(string)
    response.end()
  } else if (path === '/xxx') {
    response.statusCode = 200
    response.setHeader('Content-Type', 'application/json;charset = utf-8')
    response.setHeader('Access-Control-Allow-Origin', 'http://frank.com:8001')
    response.write(`
      {
        "node":{
          "to":"小谷",
          "from":"方方",
          "heading":"打招呼",
          "content":"hi"
        }
      }
    `)
    response.end()
  } else {
    response.statusCode = 404
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write('呜呜呜')
    response.end()
  }

  /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = [];//请求体
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      resolve(body)
    })
  })
}
