import { Hono } from 'hono'
import { html } from 'hono/html'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.get('/', (c) => {
  return c.html(html`
    <!doctype html>
    <html lang="ja">
      <body>
        <h1>Todoリスト</h1>

        <form method="post" action="/todos">
          <input type="text" name="title" required maxlength="200">
          <button type="submit">追加</button>
        </form>

        <p>Todoはまだありません。</p>
      </body>
    </html>
  `)
})

app.post('/todos', async (c) => {
  return c.redirect('/', 303);
})

app.post('/todos/:id/toggle', async (c) => {
  return c.redirect('/');
})

app.post('/todos/:id/delete', async (c) => {
  return c.redirect('/')
})

export default app
