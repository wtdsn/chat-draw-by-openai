class FetchH {
  constructor(url, config = {}) {
    if (typeof url === 'string') {
      config.url = url
    } else if (typeof url === 'object') {
      config = url
    }
    this.config = config
  }

  request(body) {
    let d = {
      ...this.config.body,
      ...body
    }

    return fetch(this.config.url, {
      method: this.config.method,
      headers: this.config.headers,
      body: JSON.stringify(d)
    })
  }
}


function createFetchH(url, config) {
  let fh = new FetchH(url, config)
  return (fh.request).bind(fh)
}

export default createFetchH