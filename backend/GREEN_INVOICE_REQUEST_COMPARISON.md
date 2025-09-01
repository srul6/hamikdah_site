# Green Invoice Request Structure Comparison

## Green Invoice API Example vs Our Implementation

### Green Invoice API Example
```json
{
  "description": "Just an order",
  "type": 320,
  "date": "2017-12-27",
  "dueDate": "2018-01-27",
  "lang": "en",
  "currency": "USD",
  "vatType": 0,
  "amount": 30,
  "maxPayments": 1,
  "pluginId": "87903a3c-cc68-447f-95a6-f0292a9f5b69",
  "client": {
    "name": "name",
    "emails": [
      "client@example.com"
    ],
    "taxId": "123456789",
    "address": "1 Luria st",
    "city": "Tel Aviv",
    "zip": "1234567",
    "country": "IL",
    "phone": "+972-54-1234567",
    "fax": "+972-54-1234567",
    "mobile": "+972-54-1234567",
    "add": true
  },
  "successUrl": "https://www.your-site-here.com",
  "failureUrl": "https://www.your-site-here.com",
  "notifyUrl": "https://www.your-site-here.com",
  "custom": "12345"
}
```

### Our Current Implementation (Updated)
```json
{
  "description": "תשלום על הזמנה #1703123456789",
  "type": 320,
  "date": "2023-12-21",
  "dueDate": "2024-01-20",
  "lang": "he",
  "currency": "ILS",
  "vatType": 1,
  "amount": 100,
  "maxPayments": 1,
  "pluginId": "your-cardcom-plugin-id",
  "client": {
    "name": "ישראל מנור",
    "emails": ["test@example.com"],
    "phone": "050-1234567",
    "address": "רחוב הרצל 1",
    "city": "תל אביב",
    "zip": "12345",
    "country": "IL",
    "add": true
  },
  "income": [
    {
      "description": "מוצר לדוגמה",
      "quantity": 1,
      "price": 100,
      "vatType": 1
    }
  ],
  "remarks": "תודה על הזמנתך",
  "successUrl": "http://localhost:3000/payment/success",
  "failureUrl": "http://localhost:3000/payment/failure",
  "notifyUrl": "http://localhost:5001/api/greeninvoice/webhook",
  "custom": "{\"orderId\":1703123456789,\"customerId\":\"test@example.com\",\"items\":\"item1,item2\"}"
}
```

## Key Differences and Improvements

### ✅ **What We Added/Improved:**

1. **Date Fields** (Added):
   - `date`: Current date in YYYY-MM-DD format
   - `dueDate`: 30 days from current date

2. **Income Items** (Added):
   - Detailed line items with description, quantity, price, and VAT type
   - More detailed than the basic example

3. **Enhanced Client Information**:
   - More comprehensive client data structure
   - Hebrew language support

4. **Custom Data** (Enhanced):
   - JSON string with order details instead of simple string
   - Includes orderId, customerId, and items list

5. **Remarks** (Added):
   - Hebrew thank you message

### ❌ **What We Removed:**

1. **Group Field**:
   - Removed `group: 100` as it's not in the official example
   - May not be required for payment forms

### 🔄 **What We Kept Different:**

1. **Language**: Using "he" (Hebrew) instead of "en" (English)
2. **Currency**: Using "ILS" instead of "USD"
3. **VAT Type**: Using 1 instead of 0 (may depend on your business type)
4. **Client Fields**: 
   - Added `phone` instead of separate `phone`, `fax`, `mobile`
   - Removed `taxId` (may not be required for all cases)

## Recommendations

### Optional Fields to Consider Adding:

1. **Tax ID** (if required for your business):
```javascript
client: {
    // ... existing fields
    taxId: customerInfo.taxId || '', // Add if you collect tax ID
}
```

2. **Additional Client Fields** (if needed):
```javascript
client: {
    // ... existing fields
    fax: customerInfo.fax || '',
    mobile: customerInfo.mobile || customerInfo.phone,
}
```

3. **Group Field** (if required by your Green Invoice setup):
```javascript
{
    // ... existing fields
    group: 100, // Add back if required
}
```

## Testing the Updated Request

The updated request structure should now be more compliant with the Green Invoice API. You can test it using:

```bash
node test-error-handling.js
```

## Environment Variables Required

Make sure these environment variables are set:

```bash
GREENINVOICE_API_KEY_ID=your_api_key_id
GREENINVOICE_API_KEY_SECRET=your_api_key_secret
CARDCOM_PLUGIN_ID=your_cardcom_plugin_id
BASE_URL=your_frontend_url
BACKEND_URL=your_backend_url
```
