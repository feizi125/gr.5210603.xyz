/* 追风的牧者 · 联系方式展示站 API
 * GET  /api/data       公开读取站点资料（KV: site）
 * GET  /api/visit      访客计数自增并返回总数（KV: visits）
 * GET  /api/messages   公开读取留言列表（Durable Object，全球即时一致）
 * POST /api/message    访客提交留言 {name, text}
 * POST /api/msg-delete 管理员删除留言 {pass, id}
 * POST /api/login      校验管理密码 {pass}
 * POST /api/save       保存资料 {pass, data}，密码由服务端校验
 * 其余请求交给静态资源（public/）
 */
import { DurableObject } from 'cloudflare:workers';

/* 留言板：Durable Object 强一致性存储，写入后全球所有访客立即可见 */
export class Guestbook extends DurableObject {
  async list() {
    let v = await this.ctx.storage.get('messages');
    if (v === undefined) {
      // 一次性迁移旧 KV 数据
      const raw = await this.env.DATA.get('messages');
      try { v = raw ? JSON.parse(raw) : []; } catch (e) { v = []; }
      if (!Array.isArray(v)) v = [];
      await this.ctx.storage.put('messages', v);
    }
    return Array.isArray(v) ? v : [];
  }
  async add(name, text) {
    const list = await this.list();
    list.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name,
      text: text,
      ts: Date.now()
    });
    if (list.length > 200) list.length = 200;
    await this.ctx.storage.put('messages', list);
    return list;
  }
  async remove(id) {
    const list = (await this.list()).filter(function (m) { return !m || m.id !== id; });
    await this.ctx.storage.put('messages', list);
    return list;
  }
}

function jsonRes(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const gb = () => env.GUESTBOOK.get(env.GUESTBOOK.idFromName('main'));

    if (url.pathname === '/api/data' && request.method === 'GET') {
      const raw = await env.DATA.get('site');
      return new Response(raw === null ? 'null' : raw, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      });
    }

    if (url.pathname === '/api/visit' && request.method === 'GET') {
      const prev = parseInt((await env.DATA.get('visits')) || '0', 10);
      const next = prev + 1;
      await env.DATA.put('visits', String(next));
      return jsonRes({ visits: next });
    }

    if (url.pathname === '/api/messages' && request.method === 'GET') {
      return jsonRes(await gb().list());
    }

    if (url.pathname === '/api/message' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      const name = String((body && body.name) || '').trim().slice(0, 20);
      const text = String((body && body.text) || '').trim().slice(0, 300);
      if (!text) return jsonRes({ ok: false, error: 'empty' }, 400);
      return jsonRes({ ok: true, messages: await gb().add(name, text) });
    }

    if (url.pathname === '/api/msg-delete' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      if (!body || body.pass !== env.ADMIN_PASS) {
        return jsonRes({ ok: false, error: 'unauthorized' }, 401);
      }
      return jsonRes({ ok: true, messages: await gb().remove(String(body.id || '')) });
    }

    if (url.pathname === '/api/login' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      if (body && body.pass && body.pass === env.ADMIN_PASS) {
        return jsonRes({ ok: true });
      }
      return jsonRes({ ok: false, error: 'unauthorized' }, 401);
    }

    if (url.pathname === '/api/save' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      if (!body || body.pass !== env.ADMIN_PASS) {
        return jsonRes({ ok: false, error: 'unauthorized' }, 401);
      }
      const d = body.data;
      if (!d || typeof d !== 'object' || !d.name || !Array.isArray(d.contacts)) {
        return jsonRes({ ok: false, error: 'bad data' }, 400);
      }
      const raw = JSON.stringify(d);
      if (raw.length > 20 * 1024 * 1024) {
        return jsonRes({ ok: false, error: 'too large' }, 413);
      }
      await env.DATA.put('site', raw);
      return jsonRes({ ok: true });
    }

    if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/admin') {
      return env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
    }

    return env.ASSETS.fetch(request);
  }
};
