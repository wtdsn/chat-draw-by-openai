import userurl from '@/assets/me.png'
import sysurl from '@/assets//gpt.png'
import { debounce } from 'utils-h'
import createFetchH from './fetch.js'
import { parse } from 'marked'
let apiKey
let fetchH

// 设置 key
function setKey() {
  apiKey = localStorage.getItem('apiKey').trim()
  if (!apiKey) {
    alert("key 错误")
    location.href = 'login.html'
  }
  fetchH = createFetchH('https://api.openai.com/v1/chat/completions', {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
    body: {
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      stream: true,
      max_tokens: 1000
    }
  })
}


// 聊天上下文
let chatStack = []


// 聊天记录插入
function appendItem(v) {
  let item = createItem(v)
  list.appendChild(item)
  scroll()
  return item
}

// 创建对话
function createItem(v) {
  let item = document.createElement('li'),
    img = document.createElement('img'),
    text = document.createElement('div')

  img.setAttribute('class', 'avatar')
  if (v.role == 'user') {
    item.setAttribute('class', 'item user')
    img.setAttribute('src', userurl)
    img.setAttribute('alt', 'me')
    text.setAttribute('class', 'text text_user')
  } else {
    item.setAttribute('class', 'item sys')
    img.setAttribute('src', sysurl)
    img.setAttribute('alt', 'gpt')
    text.setAttribute('class', 'text text_sys')
  }
  text.innerText = v.content
  item.append(img, text)
  return item
}

// 滚动到底部 , 设置防抖
let scroll = debounce(50, () => {
  scrollEl.scrollTo({
    top: list.scrollHeight - list.clientHeight,
    left: 0,
    behavior: 'smooth'
  })
})

// 发送消息
let loading = false
function send() {
  if (loading) return

  let msg = inp.innerText.trim()

  // 退出
  checkExit(msg)

  if (!msg) {
    alert("请输入有效内容！")
    return
  }

  loading = true
  btn.innerText = '接收中'

  let item = {
    role: 'user',
    content: msg
  }

  chatStack.push(item)

  appendItem(item)
  inp.innerText = ''

  // 删除过多的历史记录
  if (chatStack.length >= 4) {
    chatStack.shift()
  }

  sendMsg()
}

async function sendMsg() {
  let textEl
  fetchH({ messages: chatStack })
    .then(res => {
      // 获取 reader
      return res.body.getReader()
    })
    .then(reader => {
      // 读取内容
      textEl = appendAns()
      return getStream(reader, textEl)
    })
    .then(item => {
      // 写入记录
      chatStack.push({
        role: item.role,
        content: item.content.slice(0, 200)
      })
    })
    .catch(err => {
      //出错
      console.log("Err", err);
      if (textEl) {
        textEl.innerText += '\nerror'
      }
    })
    .finally(() => {
      loading = false
      btn.innerText = "发送"
      if (!textEl) {
        appendItem({
          role: "sys",
          content: "error"
        })
      }
    })
}

// 读取 stream 数据
function getStream(reader, textEl) {
  let ans = '', _role = ''
  const utf8Decoder = new TextDecoder("utf-8");

  return _getStream()

  function _getStream() {
    return reader.read().then(function (result) {
      // 如果数据已经读取完毕，直接返回
      if (result.done) {
        return {
          role: _role,
          content: ans
        }
      }

      let { role, content } = parseText(utf8Decoder.decode(result.value))
      if (role) {
        _role = role
      }
      if (content) {
        ans += content
      }

      requestAnimationFrame(() => {
        textEl.innerHTML = parse(ans)
        scroll()
      })

      return _getStream();
    })
  }
}

// 解析数据
function parseText(text) {
  let info = {
    content: ''
  }
  text.split(/\n(?=data:)/).forEach(v => {
    if (v === 'data: [DONE]\n\n') {
      return ''
    }

    let { role, content } = JSON.parse(v.slice(6)).choices[0].delta
    if (role) {
      info.role = role
    }

    if (content) {
      info.content += content
    }
  })
  return info
}

// 创建回答
function appendAns() {
  let item = appendItem({
    role: "sys",
    content: ""
  })
  return item.querySelector('.text')
}

// 退出
function checkExit(msg) {
  if (msg === 'exit') {
    location.href = '/login.html'
  }
}


let inp // 输入
let btn  // 发送
let list  // 聊天 list
let scrollEl  // 聊天滚动元素
function init() {
  // 设置 key
  setKey()

  inp = document.querySelector('.input')
  btn = document.querySelector('.send_btn')
  list = document.querySelector('.list')
  scrollEl = document.querySelector('.chat_list')


  // 点击发送
  btn.addEventListener('click', send)


  /* 
     按住 shift 可换行
     仅按 enter 发送
  */
  let stopSend = false
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') {
      stopSend = true
    }

    if (e.key === 'Enter' && !stopSend) {
      e.preventDefault()
      send()
    }
  })

  inp.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') {
      stopSend = false
    }
  })
}

window.onload = init