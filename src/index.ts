import { Hono } from 'hono'
import { html } from 'hono/html'

const app = new Hono<{ Bindings: CloudflareBindings }>()

type Todo = {
  id: number
  title: string
  completed: 0 | 1
  created_at: string
}

app.get('/', async (c) => {
  const { results: todos } = await c.env.DB
    .prepare(`
      SELECT id, title, completed, created_at
      FROM todos
      ORDER BY id DESC
    `)
    .all<Todo>()

  const error =
    c.req.query('error') === 'invalid'
      ? '1〜200文字で入力してください'
      : null

  return c.html(html`
    <!doctype html>
    <html lang="ja">
      <body>
        <h1>Todoリスト</h1>

        <form method="post" action="/todos">
          <input
            type="text"
            name="title"
            required
            maxlength="200"
          >
          <button type="submit">追加</button>
        </form>

        ${error
          ? html`
              <p
                role="alert"
                style="color: #dc2626; font-weight: bold;"
              >
                ${error}
              </p>
            `
          : null}

        ${todos.length === 0
          ? html`<p>Todoはまだありません。</p>`
          : html`
              <ul>
                ${todos.map(
                  (todo) => html`
                    <li>
                      <span>
                        ${todo.completed === 1 ? '✅' : '⬜'}
                        ${todo.title}
                      </span>

                      <form
                        method="post"
                        action="/todos/${todo.id}/toggle"
                      >
                        <button type="submit">
                          ${todo.completed === 1
                            ? '未完了に戻す'
                            : '完了'}
                        </button>
                      </form>

                      <form
                        method="post"
                        action="/todos/${todo.id}/delete"
                      >
                        <button type="submit">削除</button>
                      </form>
                    </li>
                  `
                )}
              </ul>
            `}
      </body>
    </html>
  `)
})

app.post('/todos', async (c) => {
  const body = await c.req.parseBody()

  if (typeof body.title !== 'string') {
    return c.redirect('/?error=invalid', 303)
  }

  const title = body.title.trim()

  if (title.length === 0 || title.length > 200) {
    return c.redirect('/?error=invalid', 303)
  }

  await c.env.DB
    .prepare('INSERT INTO todos (title) VALUES (?)')
    .bind(title)
    .run()

  return c.redirect('/', 303)
})

app.post('/todos/:id/toggle', async (c) => {
  const id = Number(c.req.param('id'))

  if (!Number.isInteger(id) || id <= 0) {
    return c.text('不正なTodo IDです', 400)
  }

  const result = await c.env.DB
    .prepare(`
      UPDATE todos
      SET completed = CASE completed
        WHEN 0 THEN 1
        ELSE 0
      END
      WHERE id = ?1
    `)
    .bind(id)
    .run()

  if (result.meta.changes === 0) {
    return c.text('Todoが見つかりません', 404)
  }
  return c.redirect('/', 303)
})

app.post('/todos/:id/delete', async (c) => {
  const id = Number(c.req.param('id'))

  if (!Number.isInteger(id) || id <= 0) {
    return c.text('不正なTodo IDです', 400)
  }

  const result = await c.env.DB
    .prepare('DELETE FROM todos WHERE id = ?1')
    .bind(id)
    .run()

  if (result.meta.changes === 0) {
    return c.text('Todoが見つかりません', 404)
  }

  return c.redirect('/', 303)
})

export default app
