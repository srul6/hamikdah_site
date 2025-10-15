const sgMail = require('@sendgrid/mail');

class EmailService {
    constructor() {
        this.adminEmail = process.env.ADMIN_EMAIL || 'gilmanor8@gmail.com';
        this.sendgridApiKey = process.env.SENDGRID_API_KEY;
        // Use SendGrid verified sender, NOT Gmail - Gmail has DMARC and will reject
        this.fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SENDGRID_VERIFIED_EMAIL;
        this.fromName = process.env.SENDGRID_FROM_NAME || 'Hamikdash Website';

        this.initializeSendGrid();
    }

    initializeSendGrid() {
        if (!this.sendgridApiKey) {
            console.error('❌ SendGrid API key not configured - Set SENDGRID_API_KEY in environment variables');
            console.warn('⚠️  Email notifications will NOT be sent until configured!');
            return;
        }

        sgMail.setApiKey(this.sendgridApiKey);
        console.log('✅ SendGrid email service initialized');
        console.log('📧 Sending emails from:', this.fromEmail);
        console.log('📬 Admin notifications will be sent to:', this.adminEmail);
    }

    async sendOrderNotification(orderData) {
        if (!this.sendgridApiKey) {
            console.error('❌ SendGrid not configured - Email NOT sent');
            console.error('⚠️  Please set SENDGRID_API_KEY environment variable');
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

            const subject = `🛍️ הזמנה חדשה - New Order ${status.toUpperCase()} - #${formId.substring(0, 8)}`;

            const htmlContent = this.generateOrderEmailHTML(orderData);
            const textContent = this.generateOrderEmailText(orderData);

            const msg = {
                to: this.adminEmail,
                from: {
                    email: this.fromEmail,
                    name: this.fromName
                },
                subject: subject,
                text: textContent,
                html: htmlContent,
                replyTo: this.adminEmail, // Replies will go to your Gmail
                // Improve deliverability
                categories: ['order-notification', 'transactional'],
                customArgs: {
                    order_type: 'purchase',
                    notification_type: 'admin'
                },
                trackingSettings: {
                    clickTracking: { enable: false },
                    openTracking: { enable: false }
                }
            };

            console.log('📧 Sending order notification email via SendGrid...');
            console.log('📬 To:', this.adminEmail);
            console.log('📝 Subject:', subject);

            const result = await sgMail.send(msg);

            console.log('✅ Order notification email sent successfully!');
            console.log('📊 SendGrid Response Status:', result[0]?.statusCode);
            return true;

        } catch (error) {
            console.error('❌ Failed to send order notification email:', error);

            if (error.response) {
                console.error('SendGrid Error Details:', error.response.body);
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
        // purchaseTimestamp is already a formatted string from the webhook
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
                <title>New Order Notification</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #e55a3d; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                    .section { margin-bottom: 20px; padding: 15px; background-color: white; border-radius: 5px; border-left: 4px solid #e55a3d; }
                    .section h3 { margin-top: 0; color: #e55a3d; }
                    .field { margin-bottom: 10px; }
                    .field strong { display: inline-block; width: 120px; }
                    .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    .items-table th, .items-table td { padding: 8px; text-align: right; border-bottom: 1px solid #ddd; }
                    .items-table th { background-color: #f5f5f5; }
                    .status-approved { color: #28a745; font-weight: bold; }
                    .status-failed { color: #dc3545; font-weight: bold; }
                    .status-pending { color: #ffc107; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>הזמנה חדשה - ${status.toUpperCase()}</h1>
                        <p>Form ID: ${formId}</p>
                    </div>
                    
                    <div class="content">
                        <div class="section">
                            <h3>פרטי הזמנה</h3>
                            <div class="field"><strong>סטטוס:</strong> <span class="status-${status}">${status.toUpperCase()}</span></div>
                            <div class="field"><strong>Form ID:</strong> ${formId}</div>
                            <div class="field"><strong>Document ID:</strong> ${documentId || 'לא זמין'}</div>
                            <div class="field"><strong>Payment ID:</strong> ${paymentId || 'לא זמין'}</div>
                            <div class="field"><strong>סכום:</strong> ${amount} ${currency}</div>
                            <div class="field"><strong>תאריך רכישה:</strong> ${timestamp}</div>
                        </div>

                        <div class="section">
                            <h3>פרטי לקוח</h3>
                            <div class="field"><strong>שם מלא:</strong> ${customerInfo?.name || 'לא זמין'}</div>
                            <div class="field"><strong>אימייל:</strong> ${customerInfo?.email || 'לא זמין'}</div>
                            <div class="field"><strong>טלפון:</strong> ${customerInfo?.phone || 'לא זמין'}</div>
                            <div class="field"><strong>הקדשה:</strong> ${dedication || 'לא צוין'}</div>
                        </div>

                        <div class="section">
                            <h3>פרטי משלוח</h3>
                            <div class="field"><strong>רחוב:</strong> ${customerInfo?.street || 'לא זמין'}</div>
                            <div class="field"><strong>מספר בית:</strong> ${customerInfo?.houseNumber || 'לא זמין'}</div>
                            <div class="field"><strong>מספר דירה:</strong> ${customerInfo?.apartmentNumber || 'לא צוין'}</div>
                            <div class="field"><strong>קומה:</strong> ${customerInfo?.floor || 'לא צוין'}</div>
                            <div class="field"><strong>עיר:</strong> ${customerInfo?.city || 'לא זמין'}</div>
                        </div>

                                                    <div class="section">
                            <h3>פריטים שהוזמנו</h3>
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
                                            <td>₪${item.price || 0}</td>
                                            <td>₪${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            ` : '<p>לא זמין מידע על הפריטים</p>'}
                        </div>
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
        // purchaseTimestamp is already a formatted string from the webhook
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
הזמנה חדשה - ${status.toUpperCase()}
Form ID: ${formId}

פרטי הזמנה:
- סטטוס: ${status.toUpperCase()}
- Form ID: ${formId}
- Document ID: ${documentId || 'לא זמין'}
- Payment ID: ${paymentId || 'לא זמין'}
- סכום: ${amount} ${currency}
- תאריך רכישה: ${timestamp}

פרטי לקוח:
- שם מלא: ${customerInfo?.name || 'לא זמין'}
- אימייל: ${customerInfo?.email || 'לא זמין'}
- טלפון: ${customerInfo?.phone || 'לא זמין'}
- הקדשה: ${dedication || 'לא צוין'}

פרטי משלוח:
- רחוב: ${customerInfo?.street || 'לא זמין'}
- מספר בית: ${customerInfo?.houseNumber || 'לא זמין'}
- מספר דירה: ${customerInfo?.apartmentNumber || 'לא צוין'}
- קומה: ${customerInfo?.floor || 'לא צוין'}
- עיר: ${customerInfo?.city || 'לא זמין'}

פריטים שהוזמנו:
${safeItems.length > 0 ? safeItems.map(item => `- ${item.name_he || item.name_en || item.name || 'פריט'} x${item.quantity || 1} - ₪${item.price || 0} (סה"כ: ₪${((item.price || 0) * (item.quantity || 1)).toFixed(2)})`).join('\n') : 'לא זמין מידע על הפריטים'}
        `;
    }
}

module.exports = EmailService;
