let input
let bns
window.onload = () => {
  input = document.querySelector('input')
  bns = document.querySelector('.btns')
  setKey()

  bns.onclick = dandleClickBtn
}

function setKey() {
  let k = localStorage.getItem('apiKey')
  input.value = k
}

function dandleClickBtn(e) {
  if (e.target === bns) return
  let id = e.target.getAttribute('id')

  if (id === 'del') {
    localStorage.removeItem('apiKey')
    input.value = ''
  } else {
    let v = input.value.trim()
    if (!v) {
      alert("请输入 key")
      return
    }
    localStorage.setItem('apiKey', v)
    if (id === 'chat')
      location.href = 'index.html'
    else location.href = 'draw.html'
  }
}