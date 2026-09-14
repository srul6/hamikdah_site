/**
 * Builds the newsletter verification email HTML/text (shared by send + local preview).
 * Copy comes from frontend/src/translations/translations.js
 */

const {
  getNewsletterEmailCopy,
  normalizeNewsletterLanguage,
  formatCouponIntro
} = require('../translations/frontendTranslations');

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildNewsletterVerificationEmail({
  verifyUrl,
  unsubscribeUrl,
  couponCode,
  discountPercent = 5,
  language = 'he',
  products = [],
  siteOrigin: siteOriginUrl = 'https://bmikdash.com'
}) {
  const lang = normalizeNewsletterLanguage(language);
  const he = lang !== 'en';
  const t = getNewsletterEmailCopy(lang);
  const safeCode = escapeHtml(couponCode || '');

  const subject = t.subject || '';
  const heading = t.heading || '';
  const couponIntro = formatCouponIntro(t.couponIntroTemplate, discountPercent);
  const confirmHint = t.confirmHint || '';
  const confirmBtnLabel = t.confirmButton || '';
  // Arrow on the left of the label, always pointing right (LTR isolate for RTL emails)
  const confirmBtnHtml = `<span dir="ltr" style="unicode-bidi:isolate;">&rarr;&nbsp;${escapeHtml(confirmBtnLabel)}</span>`;
  const validityNote = t.validityNote || '';
  const purchaseLabel = t.purchaseButton || '';
  const unsubscribeLabel = t.unsubscribe || '';

  const productGap = 8; // equal gap between frames (horizontal + vertical)
  const productCardHeight = 148;

  const productCards = (Array.isArray(products) ? products : [])
    .filter((p) => p && p.url)
    .map((p) => {
      const name = escapeHtml(he ? p.nameHe || p.nameEn : p.nameEn || p.nameHe);
      const price =
        p.price != null && Number.isFinite(Number(p.price))
          ? `₪${Number(p.price).toFixed(0)}`
          : '';
      return `
              <td width="50%" align="center" valign="top" style="width:50%;padding:${productGap / 2}px;box-sizing:border-box;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d8472a;border-radius:8px;border-collapse:separate;width:100%;height:${productCardHeight}px;">
                  <tr>
                    <td align="center" valign="middle" height="${productCardHeight}" style="padding:14px 12px;height:${productCardHeight}px;">
                      <a href="${escapeHtml(p.url)}" style="text-decoration:none;color:#002144;">
                        <div style="font-weight:800;font-size:17px;line-height:1.25;margin:0 0 6px;color:#002144;">${name}</div>
                        ${price ? `<div style="color:#d8472a;font-weight:700;font-size:15px;margin:0 0 10px;">${price}</div>` : '<div style="height:15px;line-height:15px;margin:0 0 10px;">&nbsp;</div>'}
                      </a>
                      <a href="${escapeHtml(p.url)}" style="display:inline-block;background:#d8472a;color:#f5f0e3;padding:7px 12px;border-radius:6px;text-decoration:none;font-weight:700;font-size:12px;">
                        ${escapeHtml(purchaseLabel)}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>`;
    });

  let productsHtml = '';
  if (productCards.length > 0) {
    const emptyCell = `
              <td width="50%" align="center" valign="top" style="width:50%;padding:${productGap / 2}px;box-sizing:border-box;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;height:${productCardHeight}px;">
                  <tr><td height="${productCardHeight}" style="height:${productCardHeight}px;font-size:0;line-height:0;">&nbsp;</td></tr>
                </table>
              </td>`;
    const rows = [];
    for (let i = 0; i < productCards.length; i += 2) {
      const a = productCards[i];
      const b = productCards[i + 1] || emptyCell;
      rows.push(`<tr>${a}${b}</tr>`);
    }
    productsHtml = `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-collapse:separate;border-spacing:0;">
              ${rows.join('')}
            </table>`;
  }

  const dir = he ? 'rtl' : 'ltr';
  const langAttr = he ? 'he' : 'en';
  const htmlBody = `
            <div dir="${dir}" lang="${langAttr}" style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #002144; text-align: center;">
              <h1 style="color: #d8472a; font-size: 28px; line-height: 1.3; margin: 0 0 18px; font-weight: 800;">
                ${escapeHtml(heading)}
              </h1>
              <p style="font-size:16px; line-height:1.5; margin: 0 0 14px;">
                ${escapeHtml(couponIntro)}
              </p>
              <p style="font-size:32px;font-weight:800;letter-spacing:2px;background:#f5f0e3;padding:16px 12px;border-radius:10px;margin:0 auto 18px;display:inline-block;min-width:200px;">
                ${safeCode}
              </p>
              <p style="font-size:15px;color:#555;line-height:1.5;margin:0 0 22px;">
                ${escapeHtml(confirmHint)}
              </p>
              <p style="margin: 0 0 22px; text-align: center;">
                <a href="${escapeHtml(verifyUrl)}" style="display:inline-block;background:#d8472a;color:#f5f0e3;padding:14px 26px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
                  ${confirmBtnHtml}
                </a>
              </p>
              <p style="font-size:13px;color:#666;line-height:1.5;margin:0 0 8px;">
                ${escapeHtml(validityNote)}
              </p>
              ${productsHtml}
              <p style="font-size:12px;color:#999;margin-top:28px;">
                <a href="${escapeHtml(unsubscribeUrl)}" style="color:#999;">${escapeHtml(unsubscribeLabel)}</a>
              </p>
              <p style="font-size:11px;color:#bbb;margin-top:8px;">
                <a href="${escapeHtml(siteOriginUrl)}" style="color:#bbb;text-decoration:none;">${escapeHtml(String(siteOriginUrl).replace(/^https?:\/\//, ''))}</a>
              </p>
            </div>`;

  const textConfirm = `→ ${confirmBtnLabel}`;
  const text = `${heading}\n\n${couponIntro}\n${couponCode || ''}\n\n${confirmHint}\n${textConfirm}\n${verifyUrl}\n\n${validityNote}\n\n${unsubscribeLabel}: ${unsubscribeUrl}`;

  return { subject, html: htmlBody, text };
}

function wrapEmailDocument(bodyHtml, title = 'Newsletter preview', language = 'he') {
  const lang = normalizeNewsletterLanguage(language) === 'en' ? 'en' : 'he';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 24px 12px; background: #ebe4d4; }
  </style>
</head>
<body>
  <div style="background:#fff;max-width:600px;margin:0 auto;padding:28px 20px;border-radius:12px;box-shadow:0 8px 28px rgba(0,33,68,0.08);">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

module.exports = {
  buildNewsletterVerificationEmail,
  wrapEmailDocument,
  escapeHtml
};
