import { Configuration, OpenAIApi } from "openai";
import './marked.min'
import userurl from '../assets/me.png'
import sysurl from '../assets/gpt.png'
import { debounce } from 'utils-h'

let openai
let apiKey


// 设置 key
function setKey() {
  apiKey = localStorage.getItem('apiKey')
  if (!apiKey || !apiKey.trim()) {
    alert("key 错误")
    location.href = 'login.html'
  }
  openai = new OpenAIApi(new Configuration({
    apiKey: apiKey,
  }));
}


// 聊天上下文
let chatStack = []

//  聊天历史
// let chatHistory = []
/* function initChatList() {
  if (!chatHistory.length) return

  let domF = new DocumentFragment()
  chatHistory.forEach(v => {
    domF.appendChild(createItem(v))
  })
  list.appendChild(domF)
  scroll()
} */

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

// 滚动到底部
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

  if (!msg) {
    alert("请输入有效内容！")
    return
  }

  checkExit(msg)

  loading = true
  btn.innerText = '接收中'

  let item = {
    role: 'user',
    content: msg
  }

  chatStack.push(item)
  // chatHistory.push(item)

  appendItem(item)
  inp.innerText = ''

  // 删除过多的历史记录
  if (chatStack.length >= 6) {
    chatStack.shift()
  }

  sendMsg()
}

async function sendMsg() {
  let textEl
  try {
    await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: chatStack,
        temperature: 0.3,
        stream: true,
        max_tokens: 1000
      })
    }).then(res => {
      return res.body.getReader()
    }).then(reader => {
      return getStream(reader)
    }).then(item => {
      // chatHistory.push(item)
      chatStack.push(item)
    })
  }
  catch (err) {
    if (textEl) {
      textEl.innerText += '\nerror'
    }
    /*     else {
          chatHistory.push({
            role: 'sys',
            content: "出错了！"
          })
        } */
  }
  finally {
    loading = false
    btn.innerText = "发送"
    if (!textEl) {
      appendItem({
        role: "sys",
        content: "error"
      })
    }
  }
}

function getStream(reader) {
  let ans = '', _role = ''
  const utf8Decoder = new TextDecoder("utf-8");
  _getStream()

  function _getStream() {
    return reader.read().then(function (result) {
      // 如果数据已经读取完毕，直接返回
      if (result.done) {
        return {
          role: _role,
          content: ans
        }
      }

      parseText(utf8Decoder.decode(result.value))
      return _getStream();
    })
  }
}

function parseText(text) {
  text.split(/\n(?=data:)/).forEach(v => {
    if (v === 'data: [DONE]\n\n') {
      return ''
    }
    /*     if (!textEl) {
          textEl = appendAns()
        } */
    let { role, content } = JSON.parse(v.slice(6)).choices[0].delta
    /*     if (role) {
          _role = role
        } */
    if (content) {
      ans += content
      // textEl.innerText = ans
      textEl.innerHTML = marked.parse(ans)
      requestAnimationFrame(scroll)
    }
  })
}

// 
function appendAns() {
  let item = appendItem({
    role: "sys",
    content: ""
  })
  return item.querySelector('.text')
}

// 删除 key
function checkExit(msg) {
  if (msg === 'exit') {
    location.href = '/login.html'
    localStorage.removeItem('apiKey')
  }
}


let inp // 输入
let btn  // 发送
let list  // 聊天 list
let scrollEl  // 聊天滚动元素
function init() {
  setKey()

  inp = document.querySelector('.input')
  btn = document.querySelector('.send_btn')
  list = document.querySelector('.list')
  scrollEl = document.querySelector('.chat_list')

  btn.addEventListener('click', send)
  // initChatList()
}
window.onload = init