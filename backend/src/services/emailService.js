const sgMail = require('@sendgrid/mail');

class EmailService {
    constructor() {
        this.adminEmail = (process.env.ADMIN_EMAIL || '').trim();
        this.sendFromEmail = (process.env.SENDGRID_FROM_EMAIL || '').trim();
        this.sendFromName = (process.env.SENDGRID_FROM_NAME || 'הזמנה חדשה').trim();
        this.sendGridApiKey = (process.env.SENDGRID_API_KEY || '').trim();

        this.initializeSendGrid();
    }

    initializeSendGrid() {
        if (!this.sendGridApiKey) {
            console.warn('⚠️  Email service not configured - missing SENDGRID_API_KEY');
            return;
        }

        if (!this.adminEmail) {
            console.warn('⚠️  Email service not configured - missing ADMIN_EMAIL');
            return;
        }

        if (!this.sendFromEmail) {
            console.warn('⚠️  Email service incomplete - missing SENDGRID_FROM_EMAIL (verified sender in SendGrid). Order emails will fail until set.');
            return;
        }

        sgMail.setApiKey(this.sendGridApiKey);

    }

    async sendOrderNotification(orderData) {
        if (!this.sendGridApiKey || !this.adminEmail) {
            console.error('❌ Email service not configured - missing SENDGRID_API_KEY or ADMIN_EMAIL (check Render env vars)');
            return false;
        }

        if (!this.sendFromEmail) {
            console.error('❌ Email not sent: SENDGRID_FROM_EMAIL is empty. Set it in .env to a SendGrid-verified sender (same as Single Sender or domain).');
            return false;
        }

        try {
            const {
                formId,
                status,
                documentId,
                paymentId,
                amount,
                currency,
                customerInfo,
                items,
                purchaseTimestamp,
                dedication
            } = orderData;

            const subject = `🎉 הזמנה חדשה ${status.toUpperCase()} - מספר: ${formId.slice(0, 8)}`;

            const htmlContent = this.generateOrderEmailHTML(orderData);
            const textContent = this.generateOrderEmailText(orderData);

            const msg = {
                to: this.adminEmail,
                from: {
                    email: this.sendFromEmail,
                    ...(this.sendFromName ? { name: this.sendFromName } : {})
                },
                subject: subject,
                text: textContent,
                html: htmlContent
            };

            console.log('📧 Sending email notification to:', this.adminEmail);
            const result = await sgMail.send(msg);
            console.log('✅ Order notification email sent successfully via SendGrid');
            console.log('   Response status:', result[0]?.statusCode);
            return true;

        } catch (error) {
            console.error('❌ Failed to send order notification email via SendGrid:', error);
            if (error.response) {
                console.error('   SendGrid error details:', error.response.body);
            }
            return false;
        }
    }

    generateOrderEmailHTML(orderData) {
        const {
            formId,
            status,
            documentId,
            paymentId,
            amount,
            currency,
            customerInfo,
            items,
            purchaseTimestamp,
            dedication
        } = orderData;

        // Safely handle missing items array
        const safeItems = Array.isArray(items) ? items : [];
        // purchaseTimestamp is already formatted as a string from the controller
        const timestamp = purchaseTimestamp || new Date().toLocaleString('he-IL', {
            timeZone: 'Asia/Jerusalem',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        return `
            <!DOCTYPE html>
            <html dir="rtl" lang="he">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>הזמנה חדשה</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        line-height: 1.6; 
                        color: #333; 
                        background-color: #f5f5f5;
                        margin: 0;
                        padding: 20px;
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        background-color: white;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .header { 
                        background: linear-gradient(135deg, #e55a3d 0%, #c73d22 100%);
                        color: white; 
                        padding: 30px 20px; 
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0 0 10px 0;
                        font-size: 28px;
                    }
                    .header p {
                        margin: 5px 0;
                        opacity: 0.9;
                    }
                    .content { 
                        padding: 30px 20px;
                    }
                    .section { 
                        margin-bottom: 25px; 
                        padding: 20px; 
                        background-color: #f9f9f9; 
                        border-radius: 8px;
                        border-right: 4px solid #e55a3d;
                    }
                    .section h3 { 
                        margin-top: 0; 
                        color: #e55a3d;
                        font-size: 18px;
                        border-bottom: 2px solid #e55a3d;
                        padding-bottom: 10px;
                        margin-bottom: 15px;
                        text-align: right;
                    }
                    .field { 
                        margin-bottom: 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        direction: rtl;
                        text-align: right;
                    }
                    .field strong { 
                        color: #666;
                        font-weight: 600;
                        text-align: right;
                    }
                    .field-value {
                        color: #333;
                        font-weight: 500;
                        text-align: left;
                    }
                    .items-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-top: 15px;
                        background-color: white;
                    }
                    .items-table th, .items-table td { 
                        padding: 12px; 
                        text-align: right; 
                        border-bottom: 1px solid #e0e0e0;
                    }
                    .items-table th { 
                        background-color: #e55a3d;
                        color: white;
                        font-weight: 600;
                    }
                    .items-table tr:last-child td {
                        border-bottom: none;
                    }
                    .status-approved, .status-completed { 
                        color: #28a745; 
                        font-weight: bold;
                        background-color: #d4edda;
                        padding: 4px 8px;
                        border-radius: 4px;
                    }
                    .status-failed { 
                        color: #dc3545; 
                        font-weight: bold;
                        background-color: #f8d7da;
                        padding: 4px 8px;
                        border-radius: 4px;
                    }
                    .status-pending { 
                        color: #ffc107; 
                        font-weight: bold;
                        background-color: #fff3cd;
                        padding: 4px 8px;
                        border-radius: 4px;
                    }
                    .total-amount {
                        font-size: 24px;
                        color: #e55a3d;
                        font-weight: bold;
                        text-align: center;
                        padding: 15px;
                        background-color: #fff5f3;
                        border-radius: 8px;
                        margin-top: 20px;
                    }
                    .footer {
                        text-align: center;
                        padding: 20px;
                        color: #666;
                        font-size: 14px;
                        border-top: 1px solid #e0e0e0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 הזמנה חדשה התקבלה!</h1>
                        <p>סטטוס: ${status.toUpperCase()}</p>
                        <p>מספר טופס: ${formId}</p>
                    </div>
                    
                    <div class="content">
                        <div class="section">
                            <h3>📋 פרטי ההזמנה</h3>
                            <div class="field">
                                <strong>סטטוס: </strong>
                                <span class="status-${status}">${status.toUpperCase()}</span>
                            </div>
                            <div class="field">
                                <strong>Form ID: </strong>
                                <span class="field-value">${formId}</span>
                            </div>
                            <div class="field">
                                <strong>Document ID: </strong>
                                <span class="field-value">${documentId || 'לא זמין'}</span>
                            </div>
                            <div class="field">
                                <strong>Payment ID :</strong>
                                <span class="field-value">${paymentId || 'לא זמין'}</span>
                            </div>
                            <div class="field">
                                <strong>תאריך רכישה: </strong>
                                <span class="field-value">${timestamp}</span>
                            </div>
                        </div>

                        <div class="total-amount">
                            💰 סכום כולל: ₪${amount.toFixed(2)}
                        </div>

                        <div class="section">
                            <h3>👤 פרטי הלקוח</h3>
                            <div class="field">
                                <strong>שם מלא: </strong>
                                <span class="field-value">${customerInfo?.name || 'לא זמין'}</span>
                            </div>
                            <div class="field">
                                <strong>אימייל: </strong>
                                <span class="field-value">${customerInfo?.email || 'לא זמין'}</span>
                            </div>
                            <div class="field">
                                <strong>טלפון: </strong>
                                <span class="field-value">${customerInfo?.phone || 'לא זמין'}</span>
                            </div>
                            ${dedication ? `
                            <div class="field">
                                <strong>הקדשה: </strong>
                                <span class="field-value">${dedication}</span>
                            </div>
                            ` : ''}
                        </div>

                        <div class="section">
                            <h3>📦 פרטי משלוח</h3>
                            <div class="field">
                                <strong>כתובת: </strong>
                                <span class="field-value">${customerInfo?.street || 'לא זמין'} ${customerInfo?.houseNumber || ''}</span>
                            </div>
                            <div class="field">
                                <strong>דירה: </strong>
                                <span class="field-value">${customerInfo.apartmentNumber || 'לא צוין'}</span>
                            </div>
                            <div class="field">
                                <strong>קומה: </strong>
                                <span class="field-value">${customerInfo.floor || 'לא צוין'}</span>
                            </div>
                            <div class="field">
                                <strong>עיר: </strong>
                                <span class="field-value">${customerInfo?.city || 'לא זמין'}</span>
                            </div>
                        </div>

                        <div class="section">
                            <h3>🛍️ פריטים שהוזמנו</h3>
                            ${safeItems.length > 0 ? `
                            <table class="items-table">
                                <thead>
                                    <tr>
                                        <th>שם הפריט</th>
                                        <th>כמות</th>
                                        <th>מחיר</th>
                                        <th>סה"כ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${safeItems.map(item => `
                                        <tr>
                                            <td>${item.name_he || item.name_en || item.name || 'פריט'}</td>
                                            <td>${item.quantity || 1}</td>
                                            <td>₪${(item.price || 0).toFixed(2)}</td>
                                            <td><strong>₪${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</strong></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            ` : '<p>לא זמין מידע על הפריטים</p>'}
                        </div>
                    </div>

                    <div class="footer">
                        <p>מערכת ניהול הזמנות - בית המקדש</p>
                        <p>📧 ${this.adminEmail}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateOrderEmailText(orderData) {
        const {
            formId,
            status,
            documentId,
            paymentId,
            amount,
            currency,
            customerInfo,
            items,
            purchaseTimestamp,
            dedication
        } = orderData;

        // Safely handle missing items array
        const safeItems = Array.isArray(items) ? items : [];
        // purchaseTimestamp is already formatted as a string from the controller
        const timestamp = purchaseTimestamp || new Date().toLocaleString('he-IL', {
            timeZone: 'Asia/Jerusalem',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        return `
🎉 הזמנה חדשה - ${status.toUpperCase()}
Form ID: ${formId}

📋 פרטי הזמנה:
- סטטוס: ${status.toUpperCase()}
- Form ID: ${formId}
- Document ID: ${documentId || 'לא זמין'}
- Payment ID: ${paymentId || 'לא זמין'}
- סכום: ₪${amount} ${currency}
- תאריך רכישה: ${timestamp}

👤 פרטי לקוח:
- שם מלא: ${customerInfo?.name || 'לא זמין'}
- אימייל: ${customerInfo?.email || 'לא זמין'}
- טלפון: ${customerInfo?.phone || 'לא זמין'}
- הקדשה: ${dedication || 'לא צוין'}

📦 פרטי משלוח:
- כתובת: ${customerInfo?.street || 'לא זמין'} ${customerInfo?.houseNumber || ''}
- מספר דירה: ${customerInfo?.apartmentNumber || 'לא צוין'}
- קומה: ${customerInfo?.floor || 'לא צוין'}
- עיר: ${customerInfo?.city || 'לא זמין'}

🛍️ פריטים שהוזמנו:
${safeItems.length > 0 ? safeItems.map(item => `- ${item.name_he || item.name_en || item.name || 'פריט'} x${item.quantity || 1} - ₪${(item.price || 0).toFixed(2)} (סה"כ: ₪${((item.price || 0) * (item.quantity || 1)).toFixed(2)})`).join('\n') : 'לא זמין מידע על הפריטים'}

━━━━━━━━━━━━━━━━━━━━━━
מערכת ניהול הזמנות - בית המקדש
        `;
    }
}

module.exports = EmailService;
