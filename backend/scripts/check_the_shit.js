const axios = require('axios');

const token = 'PUT_YOUR_JWT_TOKEN_HERE'; // כאן תשים את ה-JWT שקיבלת

async function getSupportedDocumentTypes() {
    try {
        const response = await axios.get('https://api.greeninvoice.co.il/api/v1/documents/types', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Supported document types:', response.data);
    } catch (error) {
        console.error('Error fetching document types:', error.response?.data || error.message);
    }
}

getSupportedDocumentTypes();
