import fs from 'fs/promises'
import { JSDOM } from 'jsdom'
import fetch from 'node-fetch'

const args = process.argv.slice(2)

const saveDir = './books'
const baseUrl = 'https://www.ituring.com.cn'
const cookie = `.AspNet.ApplicationCookie=${args[0]}`

const writeFile = async (name, data) => {
  const path = `${saveDir}/${name}`
  try {
    await fs.mkdir(saveDir, { recursive: true })
    await fs.writeFile(path, data)
    console.log('write to', path)
  } catch (ex) {
    console.error(ex.message)
  }
}

const loadHtml = async (path) => {
  try {
    const response = await fetch(baseUrl + path, {
      method: 'GET',
      headers: {
        'Accept-Encoding': 'gzip',
        Cookie: cookie,
      },
      compress: true,
    })
    const html = await response.text()
    const dom = new JSDOM(html)
    const document = dom.window.document
    console.log(path, 'loaded')
    return document
  } catch (ex) {
    console.error(ex.message)
  }
}

const getSection = (document) => {
  const section = document.createElement('section')
  section.innerHTML = document.getElementById('article').innerHTML
  section.querySelectorAll('*').forEach((element) => {
    for (let i = element.attributes.length - 1; i >= 0; --i) {
      const attrName = element.attributes[i].name
      if (!element.tagName.match(/^(IMG)$/) || !attrName.match(/^(style)$/)) {
        if (!attrName.match(/^(href|src|rowspan|colspan)$/)) {
          element.removeAttribute(attrName)
        }
      }
    }
  })
  section.querySelectorAll('h1,h2,h3').forEach((element) => {
    element.id = element.textContent.trim().replace(/\s+|\./g, '-')
  })
  section
    .querySelectorAll('img')
    .forEach((element) => element.setAttribute('loading', 'lazy'))
  return section.outerHTML
}

const getCatalog = (document) => {
  console.log('getting catalog...')
  const catalog = []
  document.querySelectorAll('.bookmenu td:first-child a').forEach((element) => {
    const href = element.href
    const path = href.slice(0, href.lastIndexOf('/') + 1)
    const subsection = element.nextElementSibling
    if (subsection && subsection.className === 'sub') {
      const length = subsection.children.length
      for (let i = 0; i <= length; ++i) {
        catalog.push(path + (parseInt(href.slice(path.length)) + i))
      }
    } else catalog.push(href)
  })
  console.log('done')
  return catalog
}

const getBookshelf = (document) => {
  console.log('getting book list...')
  const bookshelf = []
  const books = document.querySelector('.block-items').children
  for (const book of books) {
    const author = []
    book.querySelectorAll('.book-info .author span').forEach((element) => {
      author.push(element.textContent.trim().replace(/\s+/g, ' '))
    })
    const bookInfo = {
      title: book.querySelector('.book-info .name').textContent,
      author: author,
      cover: book.querySelector('.book-img img').src,
      path: book.querySelector('.book-info .name a').href,
    }
    bookshelf.push(bookInfo)
  }
  console.log('done')
  return bookshelf
}

const getBooks = async () => {
  const bookshelf = getBookshelf(await loadHtml('/user/shelf'))
  let total = 0
  for (const bookInfo of bookshelf.reverse()) {
    const catalog = getCatalog(await loadHtml(bookInfo.path))
    let article = ''
    for (const href of catalog) {
      const section = await loadHtml(href)
      article += getSection(section)
    }
    const author = bookInfo.author
      .map((item) => `<span>${item}</span>`)
      .join('')
    article = `
        <article>
          <header>
            <img src="${bookInfo.cover}" />
            <a href="${baseUrl}${bookInfo.path}">
              <h1>${bookInfo.title}</h1>
            </a>
          </header>
          ${article}
          <footer>${author}</footer>
        </article>
      `
    ++total
    await writeFile(`${bookInfo.title}.html`, article)
  }
  return total
}

if (!args[0]) {
  console.log('invalid cookie')
  process.exit()
} else {
  getBooks().then((total) =>
    console.log(`completed ${total} ${total < 2 ? 'book' : 'books'} in total`)
  )
}
