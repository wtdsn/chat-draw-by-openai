import userurl from '@/assets/me.png'
import sysurl from '@/assets//gpt.png'
import { debounce } from 'utils-h'
import createFetchH from './fetch.js'

let apiKey
let fetchH

// 设置 key
function setKey() {
  apiKey = localStorage.getItem('apiKey').trim()
  if (!apiKey) {
    alert("key 错误")
    location.href = 'login.html'
  }
  fetchH = createFetchH('https://api.openai.com/v1/images/generations', {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
    body: {
      n: 1,
      size: '512x512',
      response_format: "b64_json"
    }
  })
}


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
    text.innerText = v.content
  } else {
    item.setAttribute('class', 'item sys')
    img.setAttribute('src', sysurl)
    img.setAttribute('alt', 'gpt')
    img.setAttribute('class', 'avatar')
    text.setAttribute('class', 'text text_sys')
    text.innerHTML = `
    <img src="${v.content}" class="draw_res" alt="">
    `
  }

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
  btn.innerText = '生成中'

  appendItem({
    role: 'user',
    content: msg
  })

  inp.innerText = ''

  startDraw(msg)
}

async function startDraw(msg) {
  fetchH({ prompt: msg })
    .then(res => {
      return res.json();
    })
    .then(({ data }) => {
      let url = 'data:image/png;base64,' + data[0].b64_json
      appendImg(url)
    })
    .catch(err => {
      //出错
      console.log("Err", err);
    })
    .finally(() => {
      loading = false
      btn.innerText = "发送"
    })
}

// 创建回答
function appendImg(url) {
  appendItem({
    role: "sys",
    content: url
  })
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