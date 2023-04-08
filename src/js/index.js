import { Configuration, OpenAIApi } from "openai";
import userurl from '../assets/me.png'
import sysurl from '../assets/gpt.png'

console.log(userurl, sysurl);
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
  list.appendChild(createItem(v))
  scroll()
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
  if (chatStack.length >= 6) {
    chatStack.shift()
  }

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: chatStack,
      temperature: 0.5,
    });

    if (!completion.data) {
      chatHistory.push({
        role: 'sys',
        content: "出错了！"
      })
    } else {
      let { role, content } = completion.data.choices[0].message
      let ritem = {
        role, content
      }
      inp.innerText = ''
      chatHistory.push(ritem)
      chatStack.push(ritem)
    }
  }
  catch (err) {
    chatHistory.push({
      role: 'sys',
      content: "出错了！"
    })
  }
  finally {
    loading = false
    btn.innerText = "发送"
    appendItem(chatHistory[chatHistory.length - 1])
  }
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