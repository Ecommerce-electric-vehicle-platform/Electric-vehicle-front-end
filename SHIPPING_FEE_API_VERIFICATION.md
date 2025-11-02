# Kiểm Tra API Shipping Fee - Verification

## 📋 API Endpoint

**Endpoint:** `POST /api/v1/shipping/shipping-fee`

**Request Body:**
```json
{
  "postId": 0,
  "provinceName": "string",
  "districtName": "string",
  "wardName": "string",
  "paymentId": 0
}
```

## 📊 Response Structure

### 1. Swagger Response Format (Generic):

```json
{
  "success": true,
  "message": "string",
  "data": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  },
  "error": {}
}
```

### 2. Actual Response Format (Từ Logs):

```json
{
  "success": true,
  "message": "FETCH SHIPPING FEE SUCCESSFULLY",
  "data": {
    "message": "Success",
    "total": "561000",
    "service_fee": "550000",
    "cod_fee": "0",
    "insurance_fee": "0",
    "pick_station_fee": "0",
    "pick_remote_areas_fee": "11000",
    "deliver_remote_areas_fee": "0",
    "r2s_fee": "0",
    "coupon_value": "0",
    "cod_failed_fee": "0"
  },
  "error": null
}
```

## ✅ Frontend Handling

### Current Implementation:

**File:** `src/api/orderApi.js`

```javascript
export const getShippingFee = async ({ postId, provinceName, districtName, wardName, provinceId, districtId, wardId, paymentId }) => {
    const payload = { postId, provinceName, districtName, wardName, provinceId, districtId, wardId, paymentId };
    try {
        console.log('📦 Shipping fee payload:', payload);
        const res = await axiosInstance.post('/api/v1/shipping/shipping-fee', payload);
        console.log('🚀 Shipping fee response:', res.data);
        return res.data;  // → { success, message, data: { total, service_fee, ... }, error }
    } catch (error) {
        console.error('Error fetching shipping fee:', error);
        throw error;
    }
};
```

### Extraction Logic:

**File:** `src/pages/PlaceOrder/PlaceOrder.jsx`

**Current logic handles multiple response structures:**

1. **Primary (Actual):** `res.data.total` → `"561000"`
2. **Alternative:** `res.data.shippingFee`
3. **Nested:** `res.data.data.total`
4. **Direct:** `res.total` or `res.shippingFee`
5. **Fallback:** Try various field combinations

## 🔍 Verification

### Response Structure Analysis:

| Field Path | Expected | Actual | Status |
|------------|----------|--------|--------|
| `success` | `true` | `true` | ✅ |
| `message` | `"string"` | `"FETCH SHIPPING FEE SUCCESSFULLY"` | ✅ |
| `data.total` | `string` | `"561000"` | ✅ |
| `data.service_fee` | `string` | `"550000"` | ✅ |
| `data.cod_fee` | `string` | `"0"` | ✅ |
| `error` | `{}` or `null` | `null` | ✅ |

### Current Extraction Priority:

1. ✅ `res.data.total` (Primary - matches actual response)
2. `res.data.shippingFee` (Fallback)
3. `res.data.data.total` (Nested structure)
4. `res.data.fee` (Alternative field)
5. `res.total` (Direct field)
6. `res.shippingFee` (Alternative)
7. Fallback logic

## ✅ Verification Results

### Frontend Code Analysis:

1. **API Call:** ✅ Correct
   - Endpoint: `/api/v1/shipping/shipping-fee`
   - Method: `POST`
   - Payload: `{ postId, provinceName, districtName, wardName, provinceId, districtId, wardId, paymentId }`

2. **Response Handling:** ✅ Correct
   - Primary extraction: `res.data.total` → `"561000"`
   - Converts to number: `Number("561000")` → `561000`
   - Handles multiple response structures

3. **Logging:** ✅ Comprehensive
   - Logs full response structure
   - Logs extraction details
   - Logs verification (matches breakdown)

4. **Value Usage:** ✅ Correct
   - Extracted value: `561000`
   - Used in `orderData.shippingFee`
   - Sent to backend in `placeOrder` request

## 🎯 Conclusion

**Frontend is correctly handling the API response:**

1. ✅ Calls API with correct payload
2. ✅ Extracts `total` from `data.total` (primary path)
3. ✅ Converts string to number
4. ✅ Handles edge cases with fallback logic
5. ✅ Sends correct value to backend

**Response format matches:**
- Swagger: Generic structure `{ success, message, data, error }`
- Actual: `data.total = "561000"` (string, needs conversion)

**No changes needed in Frontend!** ✅

