/* 追风的牧者 · 个人联系方式展示站
 * Cloudflare Workers 版：资料存在 KV，后台保存经服务端校验密码后写入，
 * 所有访客即时看到最新内容。管理密码只保存在 Worker 密钥中（后台 secret ADMIN_PASS）。
 */
(function () {
  'use strict';

  var SESSION_KEY = 'lanlink-admin';
  var LANG_STORE = 'lanlink-lang';

  /* ---------------- 多语言（中 / EN / ไทย） ---------------- */
  var I18N = {
    zh: {
      docTitle: '追风的牧者 · 个人联系方式', langTitle: '切换语言',
      btnVcf: '保存联系人', btnShare: '二维码', adminTitle: '管理登录',
      qrHint: '扫码添加联系人', countFmt: '联系方式 · {n} 条',
      loginTitle: '管理员登录', pwdLabel: '访问密码', pwdPh: '请输入管理密码',
      pwdErr: '密码不正确，请重试', btnLogin: '进入编辑模式',
      myQr: '我的二维码', copyTip: '复制', qrTip: '二维码', tUnnamed: '未命名',
      qrSave: '下载 PNG', editTitle: '编辑资料', btnExport: '导出 data.json', btnLogout: '退出登录',
      fName: '姓名', fTitleLb: '职位 / 头衔', fOrg: '公司 / 团队',
      fTags: '个性标签', tagsTip: '（用逗号分隔）', tagsPh: '例如：远程协作, 周末咖啡, 快速回复',
      fAvatar: '头像', avatarUpload: '上传头像', avatarChange: '更换头像', avatarClear: '移除头像', tAvatarSet: '头像已更新',
      contactItems: '联系方式条目', btnAddContact: '+ 添加', cancel: '取消', savePublish: '保存并发布',
      eLabel: '名称', eValue: '内容', eRemove: '删除条目',
      eUploadQr: '上传二维码图（可选，如微信二维码截图）', eChangeQr: '更换二维码图', eClearQr: '移除图片', eHidden: '隐藏',
      types: { phone: '电话', email: '邮箱', wechat: '微信', qq: 'QQ', whatsapp: 'WhatsApp', telegram: 'Telegram', instagram: 'Instagram', x: 'X（推特）', linkedin: 'LinkedIn', line: 'LINE', link: '网址', github: 'GitHub', address: '地址', other: '其他' },
      tCopied: '已复制：', tCopyFail: '复制失败，请手动复制', tSaved: '已保存并发布',
      tNeedOne: '至少保留一条联系方式', tImgBig: '图片请小于 20MB', tLogout: '已退出编辑模式',
      visitFmt: '本站已被访问 {n} 次',
      gbTitle: '留言板', gbNamePh: '昵称（可留空）', gbTextPh: '给站长留个言吧…', gbSubmit: '提交留言',
      gbEmpty: '你还没有留言，写下第一条吧（仅你和站长可见）', gbAnonymous: '游客', gbOk: '留言成功，仅你和站长可见',
      gbNeedText: '请输入留言内容', gbManage: '留言管理（仅站长可见）', gbDel: '删除留言', gbNoMsg: '暂无留言',
      gbNote: '留言提交后仅你自己和站长可见，其他访客无法查看',
      gbFail: '操作失败，请稍后再试', gbDelOk: '留言已删除',
      tWelcome: '欢迎回来，点击条目即可编辑',
      tQrAdded: '二维码图片已添加', tQrTooLong: '内容过长，无法生成二维码',
      tExported: '已导出 data.json，提交到仓库即可全局生效', tDataBig: '数据过大，图片请压缩后再上传',
      tPublishing: '正在保存…', tPublished: '已保存！全站即时生效',
      tPublishFail: '保存失败：'
    },
    en: {
      docTitle: 'Wind Chasing Shepherd · Contact Card', langTitle: 'Switch language',
      btnVcf: 'Save Contact', btnShare: 'QR Code', adminTitle: 'Admin login',
      qrHint: 'Scan to add contact', countFmt: 'Contacts · {n}',
      loginTitle: 'Admin Login', pwdLabel: 'Password', pwdPh: 'Enter admin password',
      pwdErr: 'Incorrect password, try again', btnLogin: 'Enter Edit Mode',
      myQr: 'My QR Code', copyTip: 'Copy', qrTip: 'QR Code', tUnnamed: 'Unnamed',
      qrSave: 'Download PNG', editTitle: 'Edit Profile', btnExport: 'Export data.json', btnLogout: 'Log Out',
      fName: 'Name', fTitleLb: 'Title / Position', fOrg: 'Company / Team',
      fTags: 'Tags', tagsTip: ' (comma separated)', tagsPh: 'e.g. Remote, Quick reply, Coffee lover',
      fAvatar: 'Avatar', avatarUpload: 'Upload avatar', avatarChange: 'Change avatar', avatarClear: 'Remove avatar', tAvatarSet: 'Avatar updated',
      contactItems: 'Contact Entries', btnAddContact: '+ Add', cancel: 'Cancel', savePublish: 'Save & Publish',
      eLabel: 'Label', eValue: 'Value', eRemove: 'Delete entry',
      eUploadQr: 'Upload QR image (optional)', eChangeQr: 'Replace QR image', eClearQr: 'Remove image', eHidden: 'Hidden',
      types: { phone: 'Phone', email: 'Email', wechat: 'WeChat', qq: 'QQ', whatsapp: 'WhatsApp', telegram: 'Telegram', instagram: 'Instagram', x: 'X (Twitter)', linkedin: 'LinkedIn', line: 'LINE', link: 'Website', github: 'GitHub', address: 'Address', other: 'Other' },
      tCopied: 'Copied: ', tCopyFail: 'Copy failed, please copy manually', tSaved: 'Saved & published',
      tNeedOne: 'Keep at least one contact entry', tImgBig: 'Image must be under 20MB', tLogout: 'Logged out of edit mode',
      visitFmt: 'Visited {n} times',
      gbTitle: 'Guestbook', gbNamePh: 'Nickname (optional)', gbTextPh: 'Leave a message…', gbSubmit: 'Post',
      gbEmpty: 'You have not posted yet. Your message stays private (visible only to you and the owner)', gbAnonymous: 'Guest', gbOk: 'Posted! Only you and the owner can see it',
      gbNeedText: 'Please enter a message', gbManage: 'Manage Messages (owner only)', gbDel: 'Delete', gbNoMsg: 'No messages',
      gbNote: 'Only you and the site owner can see your message',
      gbFail: 'Failed, please try again later', gbDelOk: 'Message deleted',
      tWelcome: 'Welcome back, click entries to edit',
      tQrAdded: 'QR image added', tQrTooLong: 'Content too long for a QR code',
      tExported: 'Exported data.json — commit it to the repo to publish', tDataBig: 'Data too large, please compress images',
      tPublishing: 'Saving…', tPublished: 'Saved! Live for all visitors instantly',
      tPublishFail: 'Save failed: '
    },
    th: {
      docTitle: 'ผู้เลี้ยงผู้ไล่ตามลม · ข้อมูลติดต่อ', langTitle: 'เปลี่ยนภาษา',
      btnVcf: 'บันทึกผู้ติดต่อ', btnShare: 'คิวอาร์โค้ด', adminTitle: 'เข้าสู่ระบบผู้ดูแล',
      qrHint: 'สแกนเพื่อเพิ่มผู้ติดต่อ', countFmt: 'ผู้ติดต่อ · {n} รายการ',
      loginTitle: 'เข้าสู่ระบบผู้ดูแล', pwdLabel: 'รหัสผ่าน', pwdPh: 'กรอกรหัสผ่านผู้ดูแล',
      pwdErr: 'รหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง', btnLogin: 'เข้าสู่โหมดแก้ไข',
      myQr: 'คิวอาร์ของฉัน', copyTip: 'คัดลอก', qrTip: 'คิวอาร์โค้ด', tUnnamed: 'ไม่มีชื่อ',
      qrSave: 'ดาวน์โหลด PNG', editTitle: 'แก้ไขโปรไฟล์', btnExport: 'ส่งออก data.json', btnLogout: 'ออกจากระบบ',
      fName: 'ชื่อ', fTitleLb: 'ตำแหน่ง', fOrg: 'บริษัท / ทีม',
      fTags: 'แท็ก', tagsTip: ' (คั่นด้วยจุลภาค)', tagsPh: 'เช่น ทำงานระยะไกล, ตอบเร็ว, ชอบกาแฟ',
      fAvatar: 'รูปโปรไฟล์', avatarUpload: 'อัปโหลดรูปโปรไฟล์', avatarChange: 'เปลี่ยนรูปโปรไฟล์', avatarClear: 'ลบรูปโปรไฟล์', tAvatarSet: 'อัปเดตรูปโปรไฟล์แล้ว',
      contactItems: 'รายการติดต่อ', btnAddContact: '+ เพิ่ม', cancel: 'ยกเลิก', savePublish: 'บันทึกและเผยแพร่',
      eLabel: 'ชื่อรายการ', eValue: 'เนื้อหา', eRemove: 'ลบรายการ',
      eUploadQr: 'อัปโหลดรูปคิวอาร์ (ไม่บังคับ)', eChangeQr: 'เปลี่ยนรูปคิวอาร์', eClearQr: 'ลบรูป', eHidden: 'ซ่อน',
      types: { phone: 'โทรศัพท์', email: 'อีเมล', wechat: 'WeChat', qq: 'QQ', whatsapp: 'WhatsApp', telegram: 'Telegram', instagram: 'Instagram', x: 'X (Twitter)', linkedin: 'LinkedIn', line: 'LINE', link: 'เว็บไซต์', github: 'GitHub', address: 'ที่อยู่', other: 'อื่น ๆ' },
      tCopied: 'คัดลอกแล้ว: ', tCopyFail: 'คัดลอกไม่สำเร็จ กรุณาคัดลอกด้วยตนเอง', tSaved: 'บันทึกและเผยแพร่แล้ว',
      tNeedOne: 'ต้องมีข้อมูลติดต่ออย่างน้อยหนึ่งรายการ', tImgBig: 'รูปภาพต้องมีขนาดไม่เกิน 20MB', tLogout: 'ออกจากโหมดแก้ไขแล้ว',
      visitFmt: 'เข้าชมแล้ว {n} ครั้ง',
      gbTitle: 'สมุดเยี่ยม', gbNamePh: 'ชื่อเล่น (ไม่บังคับ)', gbTextPh: 'ฝากข้อความถึงเจ้าของเว็บ…', gbSubmit: 'ส่ง',
      gbEmpty: 'คุณยังไม่ได้เขียนข้อความ (เฉพาะคุณและเจ้าของเว็บเท่านั้นที่เห็น)', gbAnonymous: 'ผู้เยี่ยมชม', gbOk: 'ส่งแล้ว! เฉพาะคุณและเจ้าของเว็บเท่านั้นที่เห็น',
      gbNeedText: 'กรุณาพิมพ์ข้อความ', gbManage: 'จัดการข้อความ (เจ้าของเว็บเท่านั้น)', gbDel: 'ลบ', gbNoMsg: 'ไม่มีข้อความ',
      gbNote: 'เฉพาะคุณและเจ้าของเว็บเท่านั้นที่เห็นข้อความนี้',
      gbFail: 'ดำเนินการไม่สำเร็จ ลองอีกครั้ง', gbDelOk: 'ลบข้อความแล้ว',
      tWelcome: 'ยินดีต้อนรับ คลิกรายการเพื่อแก้ไข',
      tQrAdded: 'เพิ่มรูปคิวอาร์แล้ว', tQrTooLong: 'เนื้อหายาวเกินไป สร้างคิวอาร์ไม่ได้',
      tExported: 'ส่งออก data.json แล้ว อัปโหลดไปยัง repo เพื่อให้ทุกคนเห็น', tDataBig: 'ข้อมูลใหญ่เกินไป กรุณาบีบอัดรูปภาพ',
      tPublishing: 'กำลังบันทึก…', tPublished: 'บันทึกแล้ว! ผู้เยี่ยมชมทุกคนเห็นทันที',
      tPublishFail: 'บันทึกไม่สำเร็จ: '
    }
  };
  var LANG_KEYS = ['zh', 'en', 'th'];
  var LANG_LABEL = { zh: '中', en: 'EN', th: 'ไทย' };
  var LANG_HTML = { zh: 'zh-CN', en: 'en', th: 'th' };

  function t(key) {
    var d = I18N[state.lang] || I18N.zh;
    if (d[key] !== undefined) return d[key];
    if (I18N.zh[key] !== undefined) return I18N.zh[key];
    return key;
  }
  function typeName(type) {
    var m = t('types');
    return m[type] || type;
  }

  function defaultsFor(lang) {
    var demo = {
      zh: {
        name: '林澜', title: '独立产品设计师', org: 'LANLINK 工作室',
        tags: ['远程协作', '快速回复', '周末也在线'],
        labels: ['手机', '邮箱', '微信', '个人主页']
      },
      en: {
        name: 'Lin Lan', title: 'Independent Product Designer', org: 'LANLINK Studio',
        tags: ['Remote friendly', 'Quick reply', 'Online weekends'],
        labels: ['Phone', 'Email', 'WeChat', 'Homepage']
      },
      th: {
        name: 'หลิน หลาน', title: 'นักออกแบบผลิตภัณฑ์อิสระ', org: 'สตูดิโอ LANLINK',
        tags: ['ทำงานระยะไกล', 'ตอบเร็ว', 'ออนไลน์สุดสัปดาห์'],
        labels: ['โทรศัพท์', 'อีเมล', 'WeChat', 'เว็บไซต์ส่วนตัว']
      }
    }[lang] || null;
    if (!demo) return defaultsFor('zh');
    return {
      name: demo.name,
      title: demo.title,
      org: demo.org,
      tags: demo.tags.slice(),
      avatar: null,
      contacts: [
        { type: 'phone', label: demo.labels[0], value: '138-0000-0000', qrImage: null },
        { type: 'email', label: demo.labels[1], value: 'hello@lanlink.demo', qrImage: null },
        { type: 'wechat', label: demo.labels[2], value: 'lanlink-wechat', qrImage: null },
        { type: 'whatsapp', label: 'WhatsApp', value: '+86 138 0000 0000', qrImage: null },
        { type: 'telegram', label: 'Telegram', value: '@lanlink', qrImage: null },
        { type: 'link', label: demo.labels[3], value: 'https://lanlink.demo', qrImage: null }
      ]
    };
  }

  var TYPES = {
    phone:  { name: '电话', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>', href: function (v) { return 'tel:' + v; } },
    email:  { name: '邮箱', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m3 6 9 7 9-7"/></svg>', href: function (v) { return 'mailto:' + v; } },
    wechat: { name: '微信', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 3C4.9 3 2 5.5 2 8.6c0 1.8 1 3.4 2.5 4.5L4 15l2.4-1.2c.7.2 1.4.3 2.1.3h.5a5.7 5.7 0 0 1-.2-1.5c0-3 2.9-5.4 6.4-5.4h.6C15.4 4.9 12.3 3 8.5 3z"/><path d="M22 12.6c0-2.6-2.5-4.6-5.5-4.6s-5.5 2-5.5 4.6 2.5 4.6 5.5 4.6c.6 0 1.2-.1 1.8-.3L20 18l-.4-1.5c1.4-.9 2.4-2.3 2.4-3.9z"/></svg>' },
    qq:     { name: 'QQ', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 20l3-1.6M15.5 14 17 20l-3-1.6M9.5 9h.01M14.5 9h.01"/></svg>' },
    whatsapp: { name: 'WhatsApp', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z"/><path d="M8.8 8.4c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2 0 .4-.1.6l-.4.5c-.1.2-.2.3 0 .6.5.9 1.3 1.6 2.3 2.1.3.1.4.1.6-.1l.5-.6c.2-.2.4-.2.6-.1l1.5.8c.4.2.5.4.5.6-.1.9-.9 1.7-1.8 1.7-3.1-.2-6.9-3.7-7.2-7.2 0-.4.1-.9.5-1.5z" stroke-width="1.4"/></svg>', href: function (v) { return 'https://wa.me/' + v.replace(/[^\d]/g, ''); } },
    telegram: { name: 'Telegram', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3 2.5 10.6c-.8.3-.8 1.4 0 1.7l4.6 1.5 1.7 5.2c.2.7 1.1.9 1.6.3l2.5-2.9 4.6 3.4c.6.4 1.4.1 1.6-.6L23 4.2c.2-.8-.4-1.5-1.1-1.2z"/><path d="M7.1 13.8 19 5.5l-9.4 8.2-.4 3.3z" stroke-width="1.2"/></svg>', href: function (v) { return 'https://t.me/' + v.replace(/^@/, ''); } },
    instagram: { name: 'Instagram', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg>', href: function (v) { return 'https://instagram.com/' + v.replace(/^@/, ''); } },
    x:      { name: 'X', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 4l16 16M20 4L4 20"/></svg>', href: function (v) { return 'https://x.com/' + v.replace(/^@/, ''); } },
    linkedin: { name: 'LinkedIn', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>', href: function (v) { return 'https://linkedin.com/in/' + v.replace(/^@/, ''); } },
    line:   { name: 'LINE', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.8-.4-4-1L3 20l1-5.5a8.5 8.5 0 1 1 17-3z"/><path d="M8 10h8M8 13.5h5" stroke-width="1.6"/></svg>' },
    link:   { name: '网址', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>', href: function (v) { return /^https?:\/\//i.test(v) ? v : 'https://' + v; } },
    github: { name: 'GitHub', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/></svg>', href: function (v) { return /^https?:\/\//i.test(v) ? v : 'https://github.com/' + v.replace(/^@/, ''); } },
    address:{ name: '地址', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>' },
    other:  { name: '其他', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>' }
  };

  var $ = function (id) { return document.getElementById(id); };
  var state = { data: null, isAdmin: false, editContacts: [], editAvatar: null, qrCurrent: null, lang: 'zh', source: 'default', pass: null, visits: null, messages: [], myMsgs: [] };

  function applyLang() {
    document.documentElement.lang = LANG_HTML[state.lang] || 'zh-CN';
    document.title = t('docTitle');
    $('btnLang').textContent = LANG_LABEL[state.lang] || '中';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
    if (state.source === 'default' && state.data) state.data = normalize(null);
    if (state.data) render();
    if (!$('editorDrawer').hidden) renderEditContacts();
    renderVisits();
    renderMessages();
  }

  function renderVisits() {
    var el = $('visitCount');
    if (!el) return;
    if (state.visits === null) { el.textContent = ''; return; }
    el.textContent = t('visitFmt').replace('{n}', state.visits.toLocaleString());
  }

  /* ---------------- 留言板 ---------------- */
  function fmtTime(ts) {
    try {
      return new Date(ts).toLocaleString(LANG_HTML[state.lang] || 'zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return new Date(ts).toLocaleString(); }
  }

  /* 全部留言仅管理员可读（后台抽屉用） */
  function loadAdminMessages() {
    fetch('/api/messages-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pass: state.pass })
    })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { state.messages = Array.isArray(j.messages) ? j.messages : []; renderGbAdmin(); })
      .catch(function () { /* 静默失败 */ });
  }

  /* 公开区只显示访客自己本次会话提交的留言 */
  function renderMessages() {
    var box = $('gbList');
    if (!box) return;
    box.innerHTML = '';
    if (!state.myMsgs.length) {
      box.innerHTML = '<li class="gb-empty">' + escapeHtml(t('gbEmpty')) + '</li>';
      return;
    }
    state.myMsgs.forEach(function (m) {
      var li = document.createElement('li');
      li.className = 'gb-item glass';
      li.innerHTML =
        '<div class="gb-item-head"><span class="gb-name">' + escapeHtml(m.name || t('gbAnonymous')) + '</span>' +
        '<span class="gb-time">' + escapeHtml(fmtTime(m.ts)) + '</span></div>' +
        '<div class="gb-text">' + escapeHtml(m.text) + '</div>';
      box.appendChild(li);
    });
  }

  function renderGbAdmin() {
    var box = $('gbAdminList');
    if (!box) return;
    box.innerHTML = '';
    var count = $('gbManageCount');
    if (count) count.textContent = String(state.messages.length);
    if (!state.messages.length) {
      box.innerHTML = '<p class="gb-admin-empty">' + escapeHtml(t('gbNoMsg')) + '</p>';
      return;
    }
    state.messages.forEach(function (m) {
      var row = document.createElement('div');
      row.className = 'gba-row';
      row.innerHTML =
        '<div class="gba-main"><div class="gba-head"><b>' + escapeHtml(m.name || t('gbAnonymous')) + '</b>' +
        '<span>' + escapeHtml(fmtTime(m.ts)) + '</span></div>' +
        '<div class="gba-text">' + escapeHtml(m.text) + '</div></div>' +
        '<button class="gba-del" type="button" title="' + escapeAttr(t('gbDel')) + '">×</button>';
      row.querySelector('.gba-del').addEventListener('click', function () { deleteMessage(m.id); });
      box.appendChild(row);
    });
  }

  function submitMessage() {
    var text = $('gbText').value.trim();
    if (!text) { toast(t('gbNeedText')); return; }
    var name = $('gbName').value.trim();
    fetch('/api/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, text: text })
    })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) {
        if (j.message) state.myMsgs.unshift(j.message);
        renderMessages();
        $('gbText').value = '';
        toast(t('gbOk'));
      })
      .catch(function () { toast(t('gbFail')); });
  }

  function deleteMessage(id) {
    fetch('/api/msg-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pass: state.pass, id: id })
    })
      .then(function (r) {
        if (r.status === 401) { setAdmin(false); closeEditor(); toast(t('gbFail')); return; }
        if (!r.ok) throw 0;
        return r.json();
      })
      .then(function (j) {
        if (!j) return;
        state.messages = j.messages || [];
        renderGbAdmin();
        toast(t('gbDelOk'));
      })
      .catch(function () { toast(t('gbFail')); });
  }

  /* ---------------- 数据读写 ---------------- */
  function loadData(cb) {
    fetch('/api/data', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { state.source = 'json'; cb(normalize(j)); })
      .catch(function () { state.source = 'default'; cb(normalize(null)); });
  }
  function normalize(d) {
    d = d && typeof d === 'object' ? d : {};
    var DEF = defaultsFor(state.lang);
    var out = {
      name: String(d.name || DEF.name),
      title: String(d.title || DEF.title),
      org: String(d.org || DEF.org),
      tags: Array.isArray(d.tags) ? d.tags.map(String).filter(Boolean).slice(0, 8) : DEF.tags.slice(),
      avatar: typeof d.avatar === 'string' ? d.avatar : null,
      contacts: []
    };
    (Array.isArray(d.contacts) ? d.contacts : DEF.contacts).forEach(function (c) {
      if (!c || typeof c !== 'object') return;
      var t = TYPES[c.type] ? c.type : 'other';
      if (c.value === undefined || c.value === null || String(c.value) === '') return;
      out.contacts.push({
        type: t,
        label: String(c.label || typeName(t)).slice(0, 20),
        value: String(c.value).slice(0, 200),
        qrImage: typeof c.qrImage === 'string' ? c.qrImage : null,
        hidden: !!c.hidden
      });
    });
    return out;
  }

  /* ---------------- 渲染 ---------------- */
  function render() {
    var d = state.data;
    $('pName').textContent = d.name;
    $('pTitle').textContent = [d.title, d.org].filter(Boolean).join(' · ');
    $('pTags').innerHTML = d.tags.map(function (t) {
      return '<span>' + escapeHtml(t) + '</span>';
    }).join('');
    if (d.avatar) {
      $('pAvatar').style.backgroundImage = 'url("' + d.avatar + '")';
      $('pAvatar').hidden = false;
    } else {
      $('pAvatar').hidden = true;
    }

    var list = $('contactList');
    list.innerHTML = '';
    var visible = d.contacts.filter(function (c) { return !c.hidden; });
    $('contactCount').textContent = t('countFmt').replace('{n}', visible.length);
    visible.forEach(function (c) {
      var meta = TYPES[c.type];
      var li = document.createElement('li');
      li.className = 'contact-item';
      var valueHtml;
      if (meta.href) {
        var href = meta.href(c.value);
        valueHtml = '<a href="' + escapeAttr(href) + '" target="_blank" rel="noopener">' + escapeHtml(c.value) + '</a>';
      } else {
        valueHtml = escapeHtml(c.value);
      }
      li.innerHTML =
        '<div class="ci-icon">' + meta.icon + '</div>' +
        '<div class="ci-main"><div class="ci-label">' + escapeHtml(c.label) + '</div>' +
        '<div class="ci-value">' + valueHtml + '</div></div>' +
        (c.qrImage ? '<img class="ci-qr-thumb" src="' + c.qrImage + '" alt="QR" data-act="qrimg" title="' + escapeAttr(t('qrTip')) + '">' : '') +
        '<div class="ci-ops">' +
        '<button class="ci-btn" data-act="copy" title="' + escapeAttr(t('copyTip')) + '">' +
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>' +
        '<button class="ci-btn" data-act="qr" title="' + escapeAttr(t('qrTip')) + '">' +
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/></svg></button>' +
        '</div>';
      li.querySelector('[data-act="copy"]').addEventListener('click', function () {
        copyText(c.value);
      });
      li.querySelector('[data-act="qr"]').addEventListener('click', function () {
        openQr(c.label, c);
      });
      var thumb = li.querySelector('[data-act="qrimg"]');
      if (thumb) thumb.addEventListener('click', function () {
        openQr(c.label, c);
      });
      list.appendChild(li);
    });

    renderVcfQr();
  }

  function buildVcard() {
    var d = state.data;
    var lines = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + d.name];
    if (d.org) lines.push('ORG:' + d.org);
    if (d.title) lines.push('TITLE:' + d.title);
    d.contacts.forEach(function (c) {
      if (c.hidden) return;
      if (c.type === 'phone') lines.push('TEL;TYPE=CELL:' + c.value);
      if (c.type === 'whatsapp') lines.push('TEL;TYPE=CELL:' + c.value.replace(/[^\d+]/g, ''));
      if (c.type === 'telegram') lines.push('X-SOCIALPROFILE;TYPE=telegram:' + c.value);
      if (c.type === 'email') lines.push('EMAIL;TYPE=INTERNET:' + c.value);
      if (c.type === 'link') lines.push('URL:' + c.value);
      if (c.type === 'address') lines.push('ADR;TYPE=WORK:;;' + c.value);
    });
    lines.push('END:VCARD');
    return lines.join('\n');
  }

  function renderVcfQr() {
    try { drawQr($('pQrCanvas'), buildVcard(), 336); }
    catch (e) { /* 内容过长时静默 */ }
  }

  /* ---------------- 二维码 ---------------- */
  function drawQr(canvas, text, size) {
    var qr = null;
    var levels = ['M', 'L'];
    outer:
    for (var li = 0; li < levels.length; li++) {
      for (var t = 0; t <= 40; t++) {
        try {
          var q = qrcode(t, levels[li]);
          q.addData(text);
          q.make();
          qr = q;
          break outer;
        } catch (e) { /* 尝试下一型号 */ }
      }
    }
    if (!qr) throw new Error('QR_FAIL');
    var n = qr.getModuleCount();
    var margin = 4;
    var cell = Math.floor(size / (n + margin * 2));
    var dim = cell * (n + margin * 2);
    var dpr = window.devicePixelRatio || 1;
    canvas.width = dim; canvas.height = dim;
    canvas.style.width = ''; canvas.style.height = '';
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, dim, dim);
    ctx.fillStyle = '#1b1633';
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect((c + margin) * cell, (r + margin) * cell, cell, cell);
        }
      }
    }
    return canvas;
  }

  function openQr(title, contact) {
    $('qrTitle').textContent = title || t('myQr');
    var stage = $('qrStage');
    stage.innerHTML = '';
    state.qrCurrent = null;
    if (contact && contact.qrImage) {
      var img = document.createElement('img');
      img.src = contact.qrImage;
      img.alt = '二维码图片';
      stage.appendChild(img);
      state.qrCurrent = { kind: 'img', src: contact.qrImage, name: title || 'qrcode' };
    } else {
      var text = contact ? qrPayload(contact) : buildVcard();
      try {
        var cv = document.createElement('canvas');
        drawQr(cv, text, 400);
        stage.appendChild(cv);
        state.qrCurrent = { kind: 'canvas', canvas: cv, name: title || 'vcard' };
      } catch (e) {
        stage.innerHTML = '<p style="font-size:13px;color:#5d5580">' + escapeHtml(t('tQrTooLong')) + '</p>';
      }
    }
    showModal('qrModal');
  }
  function qrPayload(c) {
    var m = TYPES[c.type];
    return m.href ? m.href(c.value) : c.value;
  }

  /* ---------------- 登录 / 抽屉 ---------------- */
  function showModal(id) { $(id).hidden = false; }
  function hideModal(id) { $(id).hidden = true; }

  function adminEntry() {
    return location.pathname === '/admin' || location.hash.indexOf('admin') >= 0;
  }

  function setAdmin(on) {
    state.isAdmin = on;
    $('btnAdmin').classList.toggle('on', on);
    $('btnAdmin').hidden = !on && !adminEntry();
    if (on) {
      if (state.pass) sessionStorage.setItem(SESSION_KEY, state.pass);
    } else {
      state.pass = null;
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  function openEditor() {
    var d = state.data;
    $('fName').value = d.name;
    $('fTitle').value = d.title;
    $('fOrg').value = d.org;
    $('fTags').value = d.tags.join(', ');
    state.editAvatar = d.avatar || null;
    updateAvatarEdit();
    state.editContacts = d.contacts.map(function (c) {
      return { type: c.type, label: c.label, value: c.value, qrImage: c.qrImage, hidden: !!c.hidden };
    });
    renderEditContacts();
    loadAdminMessages();
    $('drawerMask').hidden = false;
    $('editorDrawer').hidden = false;
  }
  function closeEditor() {
    $('drawerMask').hidden = true;
    $('editorDrawer').hidden = true;
  }

  function updateAvatarEdit() {
    var img = $('fAvatarPrev');
    if (state.editAvatar) {
      img.src = state.editAvatar;
      img.hidden = false;
    } else {
      img.removeAttribute('src');
      img.hidden = true;
    }
    $('btnUploadAvatar').textContent = state.editAvatar ? t('avatarChange') : t('avatarUpload');
    $('btnClearAvatar').hidden = !state.editAvatar;
  }

  function compressImage(dataUrl, cb, maxDim, mime) {
    mime = mime || 'image/jpeg';
    var img = new Image();
    img.onload = function () {
      var max = maxDim || 512;
      var scale = Math.min(1, max / Math.max(img.width, img.height));
      var cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(img.width * scale));
      cv.height = Math.max(1, Math.round(img.height * scale));
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      cb(cv.toDataURL(mime, mime === 'image/jpeg' ? 0.9 : undefined));
    };
    img.onerror = function () { cb(dataUrl); };
    img.src = dataUrl;
  }

  function renderEditContacts() {
    var box = $('contactEditList');
    box.innerHTML = '';
    state.editContacts.forEach(function (c, i) {
      var row = document.createElement('div');
      row.className = 'ce-row';
      var opts = Object.keys(TYPES).map(function (k) {
        return '<option value="' + k + '"' + (c.type === k ? ' selected' : '') + '>' + escapeHtml(typeName(k)) + '</option>';
      }).join('');
      row.innerHTML =
        '<div class="ce-row-top">' +
        '<select data-k="type">' + opts + '</select>' +
        '<div class="field"><label>' + escapeHtml(t('eLabel')) + '</label><input type="text" data-k="label" maxlength="20" value="' + escapeAttr(c.label) + '"></div>' +
        '<button class="ce-remove" title="' + escapeAttr(t('eRemove')) + '" type="button">×</button>' +
        '</div>' +
        '<div class="field"><label>' + escapeHtml(t('eValue')) + '</label><input type="text" data-k="value" maxlength="200" value="' + escapeAttr(c.value) + '"></div>' +
        '<div class="ce-qr-line">' +
        '<button class="link-btn" data-act="upload-qr" type="button">' + escapeHtml(c.qrImage ? t('eChangeQr') : t('eUploadQr')) + '</button>' +
        (c.qrImage ? '<img class="ce-qr-thumb" src="' + c.qrImage + '" alt="QR"><button class="link-btn" data-act="clear-qr" type="button">' + escapeHtml(t('eClearQr')) + '</button>' : '') +
        '<label class="link-btn" style="display:inline-flex;align-items:center;gap:5px;margin-left:auto;cursor:pointer"><input type="checkbox" data-k="hidden"' + (c.hidden ? ' checked' : '') + ' style="accent-color:#5b3df5">' + escapeHtml(t('eHidden')) + '</label>' +
        '</div>';
      var sel = row.querySelector('select');
      sel.addEventListener('change', function () {
        c.type = sel.value;
        if (!row.querySelector('[data-k="label"]').value) {
          row.querySelector('[data-k="label"]').value = typeName(c.type);
          c.label = typeName(c.type);
        }
      });
      row.querySelector('[data-k="label"]').addEventListener('input', function () { c.label = this.value; });
      row.querySelector('[data-k="value"]').addEventListener('input', function () { c.value = this.value; });
      row.querySelector('[data-k="hidden"]').addEventListener('change', function () { c.hidden = this.checked; });
      row.querySelector('.ce-remove').addEventListener('click', function () {
        state.editContacts.splice(i, 1);
        renderEditContacts();
      });
      row.querySelector('[data-act="upload-qr"]').addEventListener('click', function () {
        pickImage(function (dataUrl) {
          c.qrImage = dataUrl;
          renderEditContacts();
          toast(t('tQrAdded'));
        });
      });
      var clearBtn = row.querySelector('[data-act="clear-qr"]');
      if (clearBtn) clearBtn.addEventListener('click', function () {
        c.qrImage = null;
        renderEditContacts();
      });
      box.appendChild(row);
    });
  }

  function pickImage(cb, maxDim) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      if (!f) return;
      if (f.size > 20 * 1024 * 1024) { toast(t('tImgBig')); return; }
      var fr = new FileReader();
      fr.onload = function () {
        compressImage(fr.result, cb, maxDim || 1200, f.type === 'image/png' ? 'image/png' : 'image/jpeg');
      };
      fr.readAsDataURL(f);
    });
    input.click();
  }

  /* ---------------- 工具 ---------------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function escapeAttr(s) { return escapeHtml(s); }

  function copyText(text) {
    var done = function () { toast(t('tCopied') + (text.length > 18 ? text.slice(0, 18) + '…' : text)); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text, done); });
    } else { legacyCopy(text, done); }
  }
  function legacyCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast(t('tCopyFail')); }
    document.body.removeChild(ta);
  }

  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
  }

  function download(name, href) {
    var a = document.createElement('a');
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /* ---------------- 事件绑定 ---------------- */
  function bind() {
    document.querySelectorAll('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { hideModal(btn.getAttribute('data-close')); });
    });
    document.querySelectorAll('.modal-mask').forEach(function (m) {
      m.addEventListener('click', function (e) { if (e.target === m) m.hidden = true; });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        ['loginModal', 'qrModal'].forEach(function (id) { $(id).hidden = true; });
        closeEditor();
      }
    });

    $('btnAdmin').addEventListener('click', function () {
      if (state.isAdmin) { openEditor(); return; }
      $('pwdErr').hidden = true;
      $('pwdInput').value = '';
      showModal('loginModal');
      setTimeout(function () { $('pwdInput').focus(); }, 60);
    });

    $('btnLogin').addEventListener('click', doLogin);
    $('pwdInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });

    $('btnVcf').addEventListener('click', function () {
      var blob = new Blob([buildVcard()], { type: 'text/vcard;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      download((state.data.name || 'contact') + '.vcf', url);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    });

    $('btnShare').addEventListener('click', function () { openQr(t('myQr'), null); });
    $('pQrCanvas').addEventListener('click', function () { openQr(t('myQr'), null); });

    $('btnQrSave').addEventListener('click', function () {
      var q = state.qrCurrent;
      if (!q) return;
      if (q.kind === 'canvas') download(q.name + '.png', q.canvas.toDataURL('image/png'));
      else download(q.name + '.png', q.src);
    });

    $('btnLang').addEventListener('click', function () {
      var i = LANG_KEYS.indexOf(state.lang);
      state.lang = LANG_KEYS[(i + 1) % LANG_KEYS.length];
      try { localStorage.setItem(LANG_STORE, state.lang); } catch (e) { /* 忽略 */ }
      applyLang();
    });

    $('btnUploadAvatar').addEventListener('click', function () {
      pickImage(function (small) {
        state.editAvatar = small;
        updateAvatarEdit();
        toast(t('tAvatarSet'));
      }, 512);
    });
    $('btnClearAvatar').addEventListener('click', function () {
      state.editAvatar = null;
      updateAvatarEdit();
    });

    $('btnGbSubmit').addEventListener('click', submitMessage);

    $('btnAddContact').addEventListener('click', function () {
      state.editContacts.push({ type: 'other', label: typeName('other'), value: '', qrImage: null, hidden: false });
      renderEditContacts();
      var rows = $('contactEditList').querySelectorAll('.ce-row');
      var last = rows[rows.length - 1];
      if (last) last.querySelector('[data-k="value"]').focus();
    });

    $('btnSaveEdit').addEventListener('click', function () {
      var d = state.data;
      d.name = ($('fName').value || '').trim() || t('tUnnamed');
      d.title = ($('fTitle').value || '').trim();
      d.org = ($('fOrg').value || '').trim();
      d.tags = $('fTags').value.split(/[,，、]/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 8);
      d.avatar = state.editAvatar;
      d.contacts = state.editContacts.filter(function (c) { return c.value.trim() !== ''; })
        .map(function (c) { return { type: c.type, label: c.label || typeName(c.type), value: c.value.trim(), qrImage: c.qrImage, hidden: !!c.hidden }; });
      if (!d.contacts.length) { toast(t('tNeedOne')); return; }
      toast(t('tPublishing'));
      fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pass: state.pass, data: d })
      })
        .then(function (r) {
          if (r.status === 401) {
            setAdmin(false);
            closeEditor();
            toast(t('tPublishFail') + '401');
            return;
          }
          if (!r.ok) throw new Error('HTTP ' + r.status);
          state.data = d;
          render();
          closeEditor();
          toast(t('tPublished'));
        })
        .catch(function (e) { toast(t('tPublishFail') + (e && e.message ? e.message : 'ERROR')); });
    });

    $('btnCancelEdit').addEventListener('click', closeEditor);
    $('drawerMask').addEventListener('click', closeEditor);

    $('btnExport').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      download('data.json', url);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      toast(t('tExported'));
    });

    $('btnLogout').addEventListener('click', function () {
      setAdmin(false);
      closeEditor();
      toast(t('tLogout'));
    });
  }

  function doLogin() {
    var v = $('pwdInput').value;
    if (!v) { $('pwdErr').hidden = false; return; }
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pass: v })
    })
      .then(function (r) {
        if (r.ok) {
          state.pass = v;
          setAdmin(true);
          hideModal('loginModal');
          openEditor();
          toast(t('tWelcome'));
        } else {
          $('pwdErr').hidden = false;
        }
      })
      .catch(function () { $('pwdErr').hidden = false; });
  }

  /* ---------------- 启动 ---------------- */
  function init() {
    try { state.lang = localStorage.getItem(LANG_STORE) || 'zh'; } catch (e) { state.lang = 'zh'; }
    if (LANG_KEYS.indexOf(state.lang) < 0) state.lang = 'zh';
    bind();
    if (adminEntry()) $('btnAdmin').hidden = false;
    fetch('/api/visit', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { state.visits = j.visits || 0; renderVisits(); })
      .catch(function () { /* 计数失败不影响页面 */ });
    loadData(function (d) {
      state.data = d;
      applyLang();
      var savedPass = sessionStorage.getItem(SESSION_KEY);
      if (savedPass) { state.pass = savedPass; setAdmin(true); }
      if (adminEntry()) {
        $('btnAdmin').hidden = false;
        if (!state.isAdmin) {
          showModal('loginModal');
          setTimeout(function () { $('pwdInput').focus(); }, 60);
        }
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
