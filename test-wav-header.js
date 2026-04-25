function getWavHeader(dataLen, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(dataLen + 36, 4); // File size - 8
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // Byte rate
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // Block align
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLen, 40);
  return header;
}
const pcmBuffer = Buffer.from('AQID', 'base64'); // Mock 3-byte base64 (wait AQID is 3 bytes)
const wav = Buffer.concat([getWavHeader(pcmBuffer.length), pcmBuffer]);
console.log(wav.toString('base64').substring(0, 100));
