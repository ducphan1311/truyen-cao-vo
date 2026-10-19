function encodeFingerprint(text, identifier) {
  // Convert identifier to binary
  const binary = Array.from(new TextEncoder().encode(identifier))
    .map(b => b.toString(2).padStart(8, '0'))
    .join('');

  // Map 0 -> \u200B (ZWSP), 1 -> \u200C (ZWNJ), delimiter -> \u200D (ZWJ)
  const zwTag = '\u200D' + Array.from(binary).map(bit => bit === '1' ? '\u200C' : '\u200B').join('') + '\u200D';

  // Inject into first space of text
  return text.replace(' ', ' ' + zwTag);
}

function decodeFingerprint(text) {
  const match = text.match(/\u200D([\u200B\u200C]+)\u200D/);
  if (!match) return null;
  const binary = Array.from(match[1]).map(c => c === '\u200C' ? '1' : '0').join('');
  const bytes = [];
  for (let i = 0; i < binary.length; i += 8) {
    bytes.push(parseInt(binary.slice(i, i + 8), 2));
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

const original = "Hắn nhìn xem bốn phía, hít sâu một hơi.";
const watermarked = encodeFingerprint(original, "ducphan1311@gmail.com");
console.log("Original length:", original.length);
console.log("Watermarked length:", watermarked.length);
console.log("Visible text same?:", original === watermarked.replace(/[\u200B\u200C\u200D]/g, ''));
console.log("Decoded email:", decodeFingerprint(watermarked));
