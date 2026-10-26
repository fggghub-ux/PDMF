/* Local-only text extraction for the roster setting field. No file bytes are persisted. */
(()=>{
  'use strict';
  const fail=message=>{throw new Error(message)};
  const bounds=(bytes,offset,length)=>{if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||offset<0||length<0||offset+length>bytes.length)fail('文档结构不完整，无法读取正文')};
  const view=bytes=>new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const cleaned=text=>String(text).replace(/\r\n?/g,'\n').replace(/\u0000/g,'');
  const finish=text=>{const value=cleaned(text);if(!value.trim())fail('文档没有可导入的正文');return value};
  async function txt(buffer){
    const bytes=new Uint8Array(buffer);let encoding='utf-8',start=0;
    if(bytes[0]===0xef&&bytes[1]===0xbb&&bytes[2]===0xbf)start=3;
    else if(bytes[0]===0xff&&bytes[1]===0xfe){encoding='utf-16le';start=2}
    else if(bytes[0]===0xfe&&bytes[1]===0xff){encoding='utf-16be';start=2}
    else if(bytes.length>=4&&bytes[1]===0&&bytes[3]===0)encoding='utf-16le';
    let text;
    try{text=new TextDecoder(encoding,{fatal:true}).decode(bytes.subarray(start))}
    catch{try{text=new TextDecoder('gb18030',{fatal:true}).decode(bytes)}catch{fail('TXT 编码无法识别，请另存为 UTF-8')}}
    if(/[\u0001-\u0008\u000e-\u001f]/.test(text))fail('TXT 含有非文本内容');
    return finish(text)
  }
  async function docx(buffer){
    if(!globalThis.JSZip)fail('DOCX 解析组件未加载');
    let zip;try{zip=await JSZip.loadAsync(buffer)}catch{fail('DOCX 文件损坏或格式不正确')}
    const entry=zip.file('word/document.xml');if(!entry)fail('DOCX 缺少正文');
    const xml=await entry.async('string');
    const doc=new DOMParser().parseFromString(xml,'application/xml');
    if(doc.querySelector('parsererror'))fail('DOCX 正文 XML 无法解析');
    const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main',body=doc.getElementsByTagNameNS(ns,'body')[0];
    if(!body)fail('DOCX 缺少正文');
    const paragraphs=[];
    for(const p of body.getElementsByTagNameNS(ns,'p')){
      let line='';const walk=node=>{for(const child of node.childNodes){if(child.nodeType!==1)continue;if(child.namespaceURI===ns){if(child.localName==='t')line+=child.textContent||'';else if(child.localName==='tab')line+='\t';else if(child.localName==='br'||child.localName==='cr')line+='\n';else if(child.localName==='del'||child.localName==='instrText')continue;else walk(child)}else walk(child)}};walk(p);paragraphs.push(line)
    }
    return finish(paragraphs.join('\n'))
  }
  function cfb(buffer){
    const bytes=new Uint8Array(buffer),dv=view(bytes),u16=o=>(bounds(bytes,o,2),dv.getUint16(o,true)),u32=o=>(bounds(bytes,o,4),dv.getUint32(o,true));
    if(bytes.length<512||[0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1].some((b,i)=>bytes[i]!==b))fail('DOC 文件格式不正确');
    const sector=2**u16(30),mini=2**u16(32),cutoff=u32(56),END=0xfffffffe,FREE=0xffffffff;
    if(![512,4096].includes(sector)||mini!==64)fail('不支持此 DOC 复合文档版本');
    const sectorAt=id=>{if(id>=0xfffffffa)fail('DOC 扇区链无效');const start=(id+1)*sector;bounds(bytes,start,sector);return start};
    const fatIds=[];for(let i=0;i<109;i++){const id=u32(76+4*i);if(id!==FREE)fatIds.push(id)}
    let dif=u32(68);for(let j=0;j<u32(72);j++){const off=sectorAt(dif);for(let i=0;i<sector/4-1;i++){const id=u32(off+i*4);if(id!==FREE)fatIds.push(id)}dif=u32(off+sector-4)}
    if(fatIds.length<u32(44))fail('DOC FAT 缺失');
    const fat=[];for(const id of fatIds.slice(0,u32(44))){const off=sectorAt(id);for(let i=0;i<sector/4;i++)fat.push(u32(off+i*4))}
    const chain=(first,table,max)=>{const ids=[],seen=new Set();for(let id=first;id!==END;id=table[id]){if(id===FREE||id===undefined||seen.has(id)||ids.length>=max)fail('DOC 扇区链损坏');seen.add(id);ids.push(id)}return ids};
    const readNormal=(first,size)=>{if(size>bytes.length||size<0)fail('DOC 数据流长度无效');const ids=chain(first,fat,Math.ceil(size/sector)+1),out=new Uint8Array(size);let pos=0;for(const id of ids){if(pos>=size)break;const count=Math.min(sector,size-pos);out.set(bytes.subarray(sectorAt(id),sectorAt(id)+count),pos);pos+=count}if(pos<size)fail('DOC 数据流截断');return out};
    const directoryIds=chain(u32(48),fat,Math.ceil(bytes.length/sector)),directory=new Uint8Array(directoryIds.length*sector);directoryIds.forEach((id,i)=>directory.set(bytes.subarray(sectorAt(id),sectorAt(id)+sector),i*sector));const dd=view(directory),entry=[];
    for(let off=0;off+128<=directory.length;off+=128){const len=dd.getUint16(off+64,true),type=directory[off+66];if(!type||len<2||len>64)continue;const name=new TextDecoder('utf-16le').decode(directory.subarray(off,off+len-2));entry.push({name,type,start:dd.getUint32(off+116,true),size:dd.getUint32(off+120,true)})}
    const root=entry.find(row=>row.type===5),word=entry.find(row=>row.name==='WordDocument');if(!root||!word)fail('DOC 缺少 WordDocument 正文');
    let miniFat=[],miniStream=null;
    const stream=row=>{if(row.size>=cutoff||row.type===5)return readNormal(row.start,row.size);if(!miniStream){miniStream=readNormal(root.start,root.size);const ids=chain(u32(60),fat,Math.ceil(u32(64)*sector/sector)+1);for(const id of ids.slice(0,u32(64))){const off=sectorAt(id);for(let i=0;i<sector/4;i++)miniFat.push(u32(off+i*4))}}const ids=chain(row.start,miniFat,Math.ceil(row.size/mini)+1),out=new Uint8Array(row.size);let pos=0;for(const id of ids){if(pos>=row.size)break;const count=Math.min(mini,row.size-pos),off=id*mini;bounds(miniStream,off,count);out.set(miniStream.subarray(off,off+count),pos);pos+=count}if(pos<row.size)fail('DOC 小数据流截断');return out};
    return {word:stream(word),getTable:flag=>{const row=entry.find(item=>item.name===(flag?'1Table':'0Table'));if(!row)fail('DOC 缺少文本表');return stream(row)}}
  }
  function doc(buffer){
    const {word,getTable}=cfb(buffer),wv=view(word),w16=o=>(bounds(word,o,2),wv.getUint16(o,true)),w32=o=>(bounds(word,o,4),wv.getUint32(o,true));
    if(w16(0)!==0xa5ec)fail('DOC 文件头无效');const flags=w16(10);if(flags&0x0100)fail('加密 DOC 暂不支持导入');
    const table=getTable(Boolean(flags&0x0200)),tv=view(table),t32=o=>(bounds(table,o,4),tv.getUint32(o,true));
    const csw=w16(32),lwAt=34+csw*2,cslw=w16(lwAt),fcAt=lwAt+2+cslw*4,entries=w16(fcAt),pair=fcAt+2;
    if(cslw<4||entries<=33)fail('DOC 缺少文本片段索引');
    const mainLength=w32(lwAt+2+3*4),clxAt=w32(pair+33*8),clxSize=w32(pair+33*8+4);
    bounds(table,clxAt,clxSize);let at=clxAt,limit=clxAt+clxSize;
    while(at<limit&&table[at]===1){bounds(table,at+1,2);at+=3+tv.getUint16(at+1,true)}
    if(at+5>limit||table[at]!==2)fail('DOC 文本片段表无效');const length=t32(at+1),start=at+5;
    if(start+length>limit||length<16||(length-4)%12!==0)fail('DOC 文本片段表损坏');
    const count=(length-4)/12,pcdAt=start+(count+1)*4,fragments=[];
    for(let i=0;i<count;i++){
      const cp=t32(start+i*4),next=t32(start+(i+1)*4);if(next<=cp)fail('DOC 文本位置无效');if(cp>=mainLength)break;
      const chars=Math.min(next,mainLength)-cp,fc=t32(pcdAt+i*8+2),compressed=Boolean(fc&0x40000000),offset=compressed?(fc&0x3fffffff)/2:fc&0x3fffffff,size=chars*(compressed?1:2);
      bounds(word,offset,size);fragments.push(new TextDecoder(compressed?'windows-1252':'utf-16le').decode(word.subarray(offset,offset+size)))
    }
    return finish(fragments.join('').replace(/\r/g,'\n').replace(/\u0007/g,'\t').replace(/[\u000b\u000c]/g,'\n').replace(/[\u0013-\u0015]/g,''))
  }
  async function parse(file){
    if(!file)fail('请选择 DOCX、DOC 或 TXT 文件');
    const ext=file.name?.split('.').pop()?.toLowerCase();if(!['docx','doc','txt'].includes(ext))fail('仅支持 DOCX、DOC、TXT 文件');
    const buffer=await file.arrayBuffer();return ext==='docx'?docx(buffer):ext==='doc'?doc(buffer):txt(buffer)
  }
  Object.defineProperty(window,'APP_DocumentImport',{value:Object.freeze({parse}),writable:false,configurable:false});
})();
