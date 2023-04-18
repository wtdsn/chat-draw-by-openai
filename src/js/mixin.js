// 设置 key
export function setKey() {
  let apiKey = localStorage.getItem('apiKey').trim()
  if (!apiKey) {
    alert("key 错误")
    location.href = 'login.html'
  }
  return apiKey
}


// shift 换行
export function shiftToWrap(inp, send) {
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


// 退出
export function checkExit(msg) {
  if (msg === 'exit') {
    location.href = '/login.html'
  }
}