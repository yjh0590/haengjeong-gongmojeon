// Read image headers only; original pixels are never modified.
const fs = require('node:fs');
module.exports = function imageMetadata(file) {
  const b = fs.readFileSync(file);
  if (b.subarray(0,8).toString('hex') === '89504e470d0a1a0a') return {width:b.readUInt32BE(16),height:b.readUInt32BE(20),format:'png'};
  if (b.subarray(0,3).toString('hex') === 'ffd8ff') {
    let offset=2;
    while(offset+8<b.length){
      if(b[offset++]!==255)continue;
      while(b[offset]===255)offset++;
      const marker=b[offset++];
      if(marker===0xd9 || marker===0xda)break;
      if(marker===0x01 || marker>=0xd0 && marker<=0xd7)continue;
      const size=b.readUInt16BE(offset);
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return {width:b.readUInt16BE(offset+5),height:b.readUInt16BE(offset+3),format:'jpeg'};
      if(size<2)break;
      offset+=size;
    }
  }
  if(b.toString('ascii',0,4)==='RIFF' && b.toString('ascii',8,12)==='WEBP'){
    for(let offset=12;offset+8<b.length;){
      const chunk=b.toString('ascii',offset,offset+4),size=b.readUInt32LE(offset+4),start=offset+8;
      if(chunk==='VP8X')return {width:1+b.readUIntLE(start+4,3),height:1+b.readUIntLE(start+7,3),format:'webp'};
      if(chunk==='VP8 ')return {width:b.readUInt16LE(start+6)&0x3fff,height:b.readUInt16LE(start+8)&0x3fff,format:'webp'};
      if(chunk==='VP8L') {const bits=b.readUInt32LE(start+1);return {width:1+(bits&0x3fff),height:1+((bits>>>14)&0x3fff),format:'webp'};}
      offset=start+size+(size%2);
    }
  }
  throw Error(`Unsupported or invalid image: ${file}`);
};
