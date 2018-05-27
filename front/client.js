import { Todo } from './Todo.js'

const form = document.forms.namedItem('create')
const list = document.getElementsByTagName('ul')[0]

form.onsubmit = e => {
  e.preventDefault()
  form.button.disabled = true
  Todo.create(form.descr.value).then(todo => {
    form.button.disabled = false
    form.descr.value = ''
    list.appendChild(todo.dom)
  }).catch(err => {
    console.error(err)
    form.button.disabled = false
  })
}

Todo.fetchAll().then(async todos => {
  for await (const todo of todos) list.appendChild(todo.dom)
})

list.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target instanceof HTMLLIElement) {
    e.stopPropagation()
    e.preventDefault()
    const text = e.target.textContent
    if (text) Todo.get(e.target.id).save(text)
    else Todo.get(e.target.id).delete()
  }
}, {capture: true})
