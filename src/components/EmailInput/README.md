# Email Input Component

Component React để kiểm tra email với validation đầy đủ và có thể tái sử dụng.

## Tính năng

- ✅ Kiểm tra email không được để trống (Required)
- ✅ Kiểm tra định dạng email bằng Regex
- ✅ Không cho phép khoảng trắng ở đầu/cuối
- ✅ Kiểm tra độ dài không vượt quá 254 ký tự
- ✅ Hiển thị thông báo lỗi rõ ràng, dễ hiểu
- ✅ Validation chạy khi onBlur hoặc Submit form
- ✅ Real-time validation (tùy chọn)
- ✅ UI gọn gàng, chuyên nghiệp
- ✅ Dễ tái sử dụng
- ✅ Responsive design
- ✅ Dark mode support

## Cách sử dụng

### 1. Import component

```jsx
import { EmailInput } from './components/EmailInput';
```

### 2. Sử dụng cơ bản

```jsx
import React, { useState } from 'react';
import { EmailInput } from './components/EmailInput';

const MyForm = () => {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleEmailChange = (value) => {
    setEmail(value);
  };

  const handleValidation = (validation) => {
    setIsValid(validation.isValid);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      console.log('Email hợp lệ:', email);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <EmailInput
        value={email}
        onChange={handleEmailChange}
        onValidation={handleValidation}
        placeholder="Nhập email của bạn"
        required={true}
        realTimeValidation={true}
      />
      <button type="submit" disabled={!isValid}>
        Gửi
      </button>
    </form>
  );
};
```

### 3. Sử dụng nâng cao

```jsx
<EmailInput
  value={email}
  onChange={handleEmailChange}
  onBlur={handleEmailBlur}
  onValidation={handleValidation}
  placeholder="Nhập email của bạn"
  required={true}
  realTimeValidation={true}
  className="custom-email-input"
  inputProps={{
    id: 'email-input',
    'data-testid': 'email-input',
    autoComplete: 'email'
  }}
/>
```

## Props

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `value` | string | `''` | Giá trị email |
| `onChange` | function | - | Callback khi email thay đổi |
| `onBlur` | function | - | Callback khi blur khỏi input |
| `onValidation` | function | - | Callback khi validation thay đổi |
| `placeholder` | string | `'Nhập email của bạn'` | Placeholder text |
| `required` | boolean | `true` | Email có bắt buộc không |
| `realTimeValidation` | boolean | `true` | Bật real-time validation |
| `className` | string | `''` | CSS class bổ sung |
| `inputProps` | object | `{}` | Props bổ sung cho input |

## Validation Rules

### 1. Required (Bắt buộc)
- Kiểm tra email không được để trống
- Chỉ hiển thị khi field đã được focus

### 2. Format (Định dạng)
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Phải có @ và dấu chấm
- Không có khoảng trắng

### 3. Length (Độ dài)
- Tối đa 254 ký tự
- Hiển thị lỗi khi vượt quá

### 4. Whitespace (Khoảng trắng)
- Không có khoảng trắng ở đầu/cuối
- Hiển thị lỗi ngay lập tức

### 5. Additional Checks
- Không có hai dấu chấm liên tiếp
- Không bắt đầu/kết thúc bằng dấu chấm
- Chỉ có một ký tự @

## Error Messages

| Lỗi | Thông báo |
|-----|-----------|
| Empty | "Email là bắt buộc." |
| Whitespace | "Email không được có khoảng trắng ở đầu hoặc cuối." |
| Too long | "Email không được vượt quá 254 ký tự." |
| Invalid format | "Email không đúng định dạng. Ví dụ: user@example.com" |
| Double dots | "Email không được chứa hai dấu chấm liên tiếp." |
| Dot start/end | "Email không được bắt đầu hoặc kết thúc bằng dấu chấm." |
| Multiple @ | "Email chỉ được có một ký tự @." |

## Utility Functions

### validateEmail(email)
Validation đầy đủ cho email.

```jsx
import { validateEmail } from './utils/emailValidation';

const result = validateEmail('user@example.com');
// { isValid: true, error: '' }
```

### validateEmailRealTime(email, isRequired)
Validation real-time cho input field.

```jsx
import { validateEmailRealTime } from './utils/emailValidation';

const result = validateEmailRealTime('user@', true);
// { isValid: false, error: 'Email phải chứa dấu chấm.' }
```

### isValidEmailFormat(email)
Kiểm tra format email bằng regex.

```jsx
import { isValidEmailFormat } from './utils/emailValidation';

const isValid = isValidEmailFormat('user@example.com');
// true
```

## Styling

Component sử dụng CSS modules với các class:

- `.email-input-container` - Container chính
- `.email-input-wrapper` - Wrapper cho input
- `.email-input` - Input element
- `.email-input--error` - Input có lỗi
- `.email-input--focused` - Input đang focus
- `.email-input-icon` - Icon email
- `.email-input-error` - Thông báo lỗi

## Responsive Design

- Mobile-first approach
- Font size 16px để tránh zoom trên iOS
- Breakpoints: 768px, 480px
- Touch-friendly interface

## Dark Mode

Component tự động hỗ trợ dark mode thông qua `prefers-color-scheme: dark`.

## Accessibility

- Proper ARIA labels
- Keyboard navigation
- Screen reader support
- Focus management
- Color contrast compliance

## Testing

Component có thể test với các test cases:

```jsx
// Test cases
const testCases = [
  { input: '', expected: 'Email là bắt buộc.' },
  { input: ' ', expected: 'Email không được có khoảng trắng ở đầu hoặc cuối.' },
  { input: 'user@', expected: 'Email phải chứa dấu chấm.' },
  { input: 'user@domain.com', expected: '' }, // Valid
  { input: 'a'.repeat(255), expected: 'Email không được vượt quá 254 ký tự.' },
  { input: 'user..name@domain.com', expected: 'Email không được chứa hai dấu chấm liên tiếp.' }
];
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- IE 11+ (với polyfills)

## Dependencies

- React 16.8+
- Font Awesome (cho icons)
- CSS3 features

## License

MIT License
