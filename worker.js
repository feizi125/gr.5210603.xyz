/* 追风的牧者 · 联系方式展示站 API
 * GET  /api/data   公开读取站点资料（KV: site）
 * POST /api/login  校验管理密码 {pass}
 * POST /api/save   保存资料 {pass, data}，密码由服务端校验
 * 其余请求交给静态资源（public/）
 */
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

    if (url.pathname === '/api/data' && request.method === 'GET') {
      const raw = await env.DATA.get('site');
      return new Response(raw === null ? 'null' : raw, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      });
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
