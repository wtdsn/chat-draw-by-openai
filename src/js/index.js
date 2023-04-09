import { Configuration, OpenAIApi } from "openai";
import './marked.min'
import userurl from '../assets/me.png'
import sysurl from '../assets/gpt.png'
// console.log(marked.parse('# Marked in the browser\n\nRendered by **marked**.'));
let openai

function setKey() {
  let apiKey = localStorage.getItem('apiKey')
  if (!apiKey || apiKey.length < 40) {
    alert("key 错误")
    location.href = 'login.html'
  }
  openai = new OpenAIApi(new Configuration({
    apiKey: apiKey,
  }));
}


let chatHistory = []
let chatStack = []

function initChatList() {
  if (!chatHistory.length) return

  let domF = new DocumentFragment()
  chatHistory.forEach(v => {
    domF.appendChild(createItem(v))
  })
  list.appendChild(domF)
  scroll()
}

function appendItem(v) {
  let item = createItem(v)
  list.appendChild(item)
  scroll()
  return item
}

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

function scroll() {
  let scroll = document.querySelector('.chat_list')

  scroll.scrollTo({
    top: list.scrollHeight - list.clientHeight,
    left: 0,
    behavior: 'smooth'
  })
}

let loading = false
async function send() {
  let msg = inp.innerText
  if (!msg.length || !msg) {
    alert("请输入内容")
    return
  }

  checkExit(msg)

  if (loading) return
  loading = true
  btn.innerText = '接收中'

  let item = {
    role: 'user',
    content: msg
  }

  chatHistory.push(item)
  chatStack.push(item)

  appendItem(item)
  inp.innerText = ''
  if (chatStack.length >= 6) {
    chatStack.shift()
  }

  let textEl
  try {
    await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + openai,
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
      let ans = '', _role = ''
      const utf8Decoder = new TextDecoder("utf-8");
      function getStream(reader) {
        return reader.read().then(function (result) {
          // 如果数据已经读取完毕，直接返回
          if (result.done) {
            return {
              role: _role,
              content: ans
            }
          }

          let text = utf8Decoder.decode(result.value)

          text.split(/\n(?=data:)/).forEach(v => {
            if (v === 'data: [DONE]\n\n') {
              return
            }
            if (!textEl) {
              textEl = appendAns()
            }
            let { role, content } = JSON.parse(v.slice(6)).choices[0].delta
            if (role) {
              _role = role
            }
            if (content) {
              ans += content
              // textEl.innerText = ans
              textEl.innerHTML = marked.parse(ans)
              requestAnimationFrame(scroll)
            }
          })

          return getStream(reader);
        })
      }
      return getStream(reader)
    }).then(item => {
      chatHistory.push(item)
      chatStack.push(item)
    })
  }
  catch (err) {
    if (textEl) {
      textEl.innerText = '/n error'
    } else {
      chatHistory.push({
        role: 'sys',
        content: "出错了！"
      })
    }
  }
  finally {
    loading = false
    btn.innerText = "发送"
    if (!textEl)
      appendItem(chatHistory[chatHistory.length - 1])
  }
}

function appendAns() {
  let item = appendItem({
    role: "sys",
    content: ""
  })
  return item.querySelector('.text')
}

function checkExit(msg) {
  if (msg === 'exit') {
    location.href = '/login.html'
    localStorage.removeItem('apiKey')
  }
}

let inp
let btn
let list
function init() {
  setKey()


  inp = document.querySelector('.input')
  btn = document.querySelector('.send_btn')
  list = document.querySelector('.list')
  btn.addEventListener('click', send)

  initChatList()
}
window.onload = init