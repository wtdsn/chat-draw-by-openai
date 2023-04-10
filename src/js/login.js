window.onload = () => {
  let input = document.querySelector('input')
  let button = document.querySelector('button')

  button.addEventListener('click', () => {
    let v = input.value.trim()
    if (!v) {
      alert("请输入 key")
      return
    }
    localStorage.setItem('apiKey', v)
    location.href = 'index.html'
  })
}