const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.adminEmail = process.env.ADMIN_EMAIL;
        this.adminPassword = process.env.ADMIN_EMAIL_PASSWORD;
        this.smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
        this.smtpPort = process.env.SMTP_PORT || 587;

        this.initializeTransporter();
    }

    initializeTransporter() {
        if (!this.adminEmail || !this.adminPassword) {
            console.warn('Email service not configured - missing ADMIN_EMAIL or ADMIN_EMAIL_PASSWORD');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: this.smtpHost,
            port: this.smtpPort,
            secure: false, // true for 465, false for other ports
            auth: {
                user: this.adminEmail,
                pass: this.adminPassword
            }
        });

        console.log('Email service initialized with:', {
            host: this.smtpHost,
            port: this.smtpPort,
            user: this.adminEmail ? '***' : 'NOT SET'
        });
    }

    async sendOrderNotification(orderData) {
        if (!this.transporter) {
            console.error('Email service not configured');
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

            const subject = `New Order ${status.toUpperCase()} - Form ID: ${formId}`;

            const htmlContent = this.generateOrderEmailHTML(orderData);
            const textContent = this.generateOrderEmailText(orderData);

            const mailOptions = {
                from: this.adminEmail,
                to: this.adminEmail,
                subject: subject,
                text: textContent,
                html: htmlContent
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Order notification email sent successfully:', result.messageId);
            return true;

        } catch (error) {
            console.error('Failed to send order notification email:', error);
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

        const timestamp = purchaseTimestamp ? new Date(purchaseTimestamp).toLocaleString('he-IL') : new Date().toLocaleString('he-IL');

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
                            <div class="field"><strong>שם מלא:</strong> ${customerInfo.name}</div>
                            <div class="field"><strong>אימייל:</strong> ${customerInfo.email}</div>
                            <div class="field"><strong>טלפון:</strong> ${customerInfo.phone}</div>
                            <div class="field"><strong>הקדשה:</strong> ${dedication || 'לא צוין'}</div>
                        </div>

                        <div class="section">
                            <h3>פרטי משלוח</h3>
                            <div class="field"><strong>רחוב:</strong> ${customerInfo.street}</div>
                            <div class="field"><strong>מספר בית:</strong> ${customerInfo.houseNumber}</div>
                            <div class="field"><strong>מספר דירה:</strong> ${customerInfo.apartmentNumber || 'לא צוין'}</div>
                            <div class="field"><strong>קומה:</strong> ${customerInfo.floor || 'לא צוין'}</div>
                            <div class="field"><strong>עיר:</strong> ${customerInfo.city}</div>
                        </div>

                        <div class="section">
                            <h3>פריטים שהוזמנו</h3>
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
                                    ${items.map(item => `
                                        <tr>
                                            <td>${item.name_he || item.name_en || item.name}</td>
                                            <td>${item.quantity}</td>
                                            <td>₪${item.price}</td>
                                            <td>₪${(item.price * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
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

        const timestamp = purchaseTimestamp ? new Date(purchaseTimestamp).toLocaleString('he-IL') : new Date().toLocaleString('he-IL');

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
- שם מלא: ${customerInfo.name}
- אימייל: ${customerInfo.email}
- טלפון: ${customerInfo.phone}
- הקדשה: ${dedication || 'לא צוין'}

פרטי משלוח:
- רחוב: ${customerInfo.street}
- מספר בית: ${customerInfo.houseNumber}
- מספר דירה: ${customerInfo.apartmentNumber || 'לא צוין'}
- קומה: ${customerInfo.floor || 'לא צוין'}
- עיר: ${customerInfo.city}

פריטים שהוזמנו:
${items.map(item => `- ${item.name_he || item.name_en || item.name} x${item.quantity} - ₪${item.price} (סה"כ: ₪${(item.price * item.quantity).toFixed(2)})`).join('\n')}
        `;
    }
}

module.exports = EmailService;
