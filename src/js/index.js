import userurl from '@/assets/me.png'
import sysurl from '@/assets//gpt.png'
import { debounce } from 'utils-h'
import createFetchH from './fetch.js'
import { parse } from 'marked'
import { setKey, shiftToWrap, checkExit } from './mixin.js'

let apiKey
let fetchH
let inp // 输入
let btn  // 发送
let list  // 聊天 list
let scrollEl  // 聊天滚动元素
let chatStack = [] // 聊天上下文

function init() {
  // 设置 key
  apiKey = setKey()

  // 创建 fetch
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

  // 获取元素
  inp = document.querySelector('.div_input')
  btn = document.querySelector('.send_btn')
  list = document.querySelector('.list')
  scrollEl = document.querySelector('.chat_list')


  // 点击发送
  btn.addEventListener('click', send)

  /* 
     按住 shift 可换行
     仅按 enter 发送
  */
  shiftToWrap(inp, send)
}

window.onload = init


// 聊天记录插入
function appendItem(v) {
  let item = createItem(v)
  list.appendChild(item)
  scroll()
  return item
}

// 创建对话元素
function createItem(v) {
  let item = document.createElement('li'),
    img = document.createElement('img'),
    text = document.createElement('div')

  img.setAttribute('class', 'avatar')
  if (v.role == 'user') {
    item.setAttribute('class', 'item user')
    img.setAttribute('src', userurl)
    text.setAttribute('class', 'text text_user')
  } else {
    item.setAttribute('class', 'item sys')
    img.setAttribute('src', sysurl)
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

  // 清除
  if (checkClear(msg)) return

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

// 发送数据
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
        content: item.content.slice(0, 200) // 限制字数，避免发送的聊天上下文太大
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

  // 读取流数据
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

      // 逐步添加文字
      requestAnimationFrame(() => {
        textEl.innerHTML = parse(ans)
        scroll()
      })

      // 还要数据，继续读取
      return _getStream();
    })
  }
}

// 解析数据
function parseText(text) {
  let info = {
    content: ''
  }
  // 默认以 \ndata 进行分割 （可能有问题）
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


// 清除记录
function checkClear(msg) {
  if (msg === 'clear') {
    chatStack.splice(0)
    list.innerHTML = ''
    inp.innerHTML = ''
    return true
  }
}