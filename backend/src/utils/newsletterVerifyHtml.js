/**
 * Minimal HTML responses for newsletter verify links opened from email.
 * On success: brief confirmation → try window.close() → redirect home if close is blocked.
 */

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function verifyResultHtml({ success, message, alreadyVerified, homeUrl }) {
    const safeHome = escapeHtml(homeUrl || 'https://bmikdash.com');
    const title = success
        ? alreadyVerified
            ? 'האימייל כבר אושר'
            : 'ההרשמה אושרה!'
        : 'לא ניתן לאשר';

    const bodyMessage = success
        ? escapeHtml(message || 'ההרשמה אושרה! הקוד שלכם פעיל עכשיו.')
        : escapeHtml(message || '');

    const successHint = success
        ? `<p style="color:#888;font-size:13px;margin-top:16px;">סוגרים את החלון…</p>`
        : `<p style="color:#666;font-size:14px;margin-top:16px;">אפשר לסגור חלון זה.</p>`;

    const autoCloseScript = success
        ? `
  <script>
    (function () {
      var home = ${JSON.stringify(String(homeUrl || 'https://bmikdash.com'))};
      function tryClose() {
        try { window.close(); } catch (e) {}
      }
      // Show confirmation briefly, then attempt close
      setTimeout(function () {
        tryClose();
        // If the browser blocks close (common for email tabs), go home
        setTimeout(function () {
          if (!window.closed) {
            window.location.replace(home);
          }
        }, 400);
      }, 1500);
      setTimeout(tryClose, 1600);
      setTimeout(tryClose, 1900);
    })();
  </script>`
        : '';

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
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
      background: #f5f0e3;
      color: #002144;
    }
    .card {
      background: #fff;
      border: 1px solid rgba(216, 71, 42, 0.25);
      border-radius: 16px;
      padding: 28px 24px;
      max-width: 420px;
      width: calc(100% - 32px);
      text-align: center;
      box-shadow: 0 8px 28px rgba(0, 33, 68, 0.08);
    }
    h1 { font-size: 1.5rem; margin: 0 0 8px; }
    a.home { color: #d8472a; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p style="color:#555;margin:16px 0;">${bodyMessage}</p>
    ${successHint}
    ${success ? '' : `<p style="margin-top:20px;"><a class="home" href="${safeHome}">חזרה לאתר</a></p>`}
  </div>
  ${autoCloseScript}
</body>
</html>`;
}

module.exports = {
    verifyResultHtml,
    escapeHtml
};
