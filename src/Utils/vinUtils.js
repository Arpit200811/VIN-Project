// VIN validation with ISO 3779 checksum

export const isLikelyVIN = (s) => /^[A-HJ-NPR-Z0-9]{17}$/.test(s); // I,O,Q प्रतिबंध

export const isValidVINChecksum = (vin) => {
  if (!isLikelyVIN(vin)) return false;

  const map = {
    A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,
    J:1,K:2,L:3,M:4,N:5,P:7,R:9,
    S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9
  };
  const weights = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];
  const tr = (ch) => (/[0-9]/.test(ch) ? parseInt(ch,10) : map[ch] || 0);

  const arr = vin.split("");
  let sum = 0;
  for (let i=0;i<17;i++) sum += tr(arr[i]) * weights[i];
  const rem = sum % 11;
  const check = rem === 10 ? "X" : String(rem);
  return arr[8] === check;
};

// OCR raw text -> best VIN candidate
export const extractBestVIN = (raw) => {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  // स्लाइडिंग 17-char windows
  for (let i=0; i<=cleaned.length-17; i++) {
    const seg = cleaned.slice(i, i+17);
    if (isValidVINChecksum(seg)) return seg;
  }
  // fallback: कोई valid checksum नहीं मिला तो first regex hit
  const m = cleaned.match(/[A-HJ-NPR-Z0-9]{17}/);
  return m ? m[0] : "";
};
