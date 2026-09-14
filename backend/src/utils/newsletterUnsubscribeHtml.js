/**
 * HTML pages for newsletter unsubscribe links opened from email.
 * GET shows confirm UI (banner-style); POST form actually removes the subscriber.
 */

const { escapeHtml } = require('./newsletterVerifyHtml');
const {
    getFrontendTranslations,
    normalizeNewsletterLanguage
} = require('../translations/frontendTranslations');

function unsubscribeCopy(language) {
    const all = getFrontendTranslations();
    const lang = normalizeNewsletterLanguage(language);
    const t = all[lang === 'en' ? 'EN' : 'HE'] || all.HE || {};
    return {
        title: t.newsletterUnsubscribeTitle || '',
        body: t.newsletterUnsubscribeBody || '',
        submit: t.newsletterUnsubscribeSubmit || 'Unsubscribe',
        done: t.newsletterUnsubscribed || '',
        error: t.newsletterUnsubscribeError || '',
        home: t.newsletterBackHome || 'Home',
        lang: lang === 'en' ? 'en' : 'he',
        dir: lang === 'en' ? 'ltr' : 'rtl'
    };
}

function unsubscribeConfirmHtml({ token, actionUrl, homeUrl, language, imageUrl }) {
    const c = unsubscribeCopy(language);
    const safeAction = escapeHtml(actionUrl);
    const safeToken = escapeHtml(token || '');
    const safeHome = escapeHtml(homeUrl || 'https://bmikdash.com');
    const img = imageUrl
        ? `<img src="${escapeHtml(imageUrl)}" alt="" style="width:100%;height:auto;display:block;margin:0;padding:0;" />`
        : '';

    return `<!DOCTYPE html>
<html lang="${c.lang}" dir="${c.dir}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(c.title)}</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      background: #ebe4d4;
      color: #002144;
      padding: 24px 12px;
      box-sizing: border-box;
    }
    .card {
      background: #f5f0e3;
      border-radius: 16px;
      max-width: 380px;
      width: 100%;
      overflow: hidden;
      text-align: center;
      box-shadow: 0 8px 28px rgba(0, 33, 68, 0.12);
    }
    .body { padding: 24px 20px 28px; }
    h1 {
      font-size: 1.45rem;
      line-height: 1.3;
      margin: 0 0 22px;
      font-weight: 700;
      color: #002144;
    }
    button {
      appearance: none;
      border: none;
      background: #d8472a;
      color: #f5f0e3;
      font-weight: 700;
      font-size: 0.85rem;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
    }
    button:hover { background: #c03d24; }
    a.home { display: inline-block; margin-top: 16px; color: #d8472a; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    ${img}
    <div class="body">
      <h1>${escapeHtml(c.title)}</h1>
      <form method="POST" action="${safeAction}">
        <input type="hidden" name="token" value="${safeToken}" />
        <input type="hidden" name="format" value="html" />
        <button type="submit">${escapeHtml(c.submit)}</button>
      </form>
      <a class="home" href="${safeHome}">${escapeHtml(c.home)}</a>
    </div>
  </div>
</body>
</html>`;
}

function unsubscribeResultHtml({ success, message, homeUrl, language }) {
    const c = unsubscribeCopy(language);
    const safeHome = escapeHtml(homeUrl || 'https://bmikdash.com');
    const title = success ? c.done : c.error;
    const bodyMessage = escapeHtml(message || (success ? c.done : c.error));

    return `<!DOCTYPE html>
<html lang="${c.lang}" dir="${c.dir}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      background: #ebe4d4;
      color: #002144;
      padding: 24px 12px;
      box-sizing: border-box;
    }
    .card {
      background: #f5f0e3;
      border-radius: 16px;
      max-width: 380px;
      width: 100%;
      padding: 28px 24px;
      text-align: center;
      box-shadow: 0 8px 28px rgba(0, 33, 68, 0.12);
      box-sizing: border-box;
    }
    h1 {
      font-size: 1.45rem;
      margin: 0 0 12px;
      font-weight: 800;
      color: ${success ? '#d8472a' : '#002144'};
    }
    p { color: #555; margin: 0 0 20px; line-height: 1.5; }
    a.home {
      display: inline-block;
      background: #d8472a;
      color: #f5f0e3;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.85rem;
      padding: 8px 16px;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${bodyMessage}</p>
    <a class="home" href="${safeHome}">${escapeHtml(c.home)}</a>
  </div>
</body>
</html>`;
}

module.exports = {
    unsubscribeConfirmHtml,
    unsubscribeResultHtml
};
