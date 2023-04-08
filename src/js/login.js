window.onload = () => {
  let input = document.querySelector('input')
  let button = document.querySelector('button')

  button.addEventListener('click', () => {
    let v = input.value
    if (v.length < 40) {
      alert("格式错误")
      return
    }
    localStorage.setItem('apiKey', v)
    location.href = 'index.html'
  })
}