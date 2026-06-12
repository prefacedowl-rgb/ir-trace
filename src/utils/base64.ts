// Base64 encoding/decoding helper for React Native
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64Encode(str: string): string {
  let result = '';
  let i = 0;
  while (i < str.length) {
    const c1 = str.charCodeAt(i++);
    const c2 = i < str.length ? str.charCodeAt(i++) : NaN;
    const c3 = i < str.length ? str.charCodeAt(i++) : NaN;

    const byte1 = c1 >> 2;
    const byte2 = ((c1 & 3) << 4) | (isNaN(c2) ? 0 : c2 >> 4);
    const byte3 = isNaN(c2) ? 64 : (((c2 & 15) << 2) | (isNaN(c3) ? 0 : c3 >> 6));
    const byte4 = isNaN(c3) ? 64 : c3 & 63;

    result += chars.charAt(byte1) + chars.charAt(byte2) + chars.charAt(byte3) + chars.charAt(byte4);
  }
  return result;
}

export function base64Decode(str: string): string {
  let result = '';
  let i = 0;
  // clean up padding
  const cleaned = str.replace(/[^A-Za-z0-9+/]/g, '');
  while (i < cleaned.length) {
    const enc1 = chars.indexOf(cleaned.charAt(i++));
    const enc2 = chars.indexOf(cleaned.charAt(i++));
    const enc3 = i < cleaned.length ? chars.indexOf(cleaned.charAt(i++)) : -1;
    const enc4 = i < cleaned.length ? chars.indexOf(cleaned.charAt(i++)) : -1;

    const c1 = (enc1 << 2) | (enc2 >> 4);
    result += String.fromCharCode(c1);

    if (enc3 !== -1 && enc3 !== 64) {
      const c2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      result += String.fromCharCode(c2);
      if (enc4 !== -1 && enc4 !== 64) {
        const c3 = ((enc3 & 3) << 6) | enc4;
        result += String.fromCharCode(c3);
      }
    }
  }
  return result;
}
