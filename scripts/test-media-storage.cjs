/** Standalone logic tests; no React or network dependencies required. */
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const assert=require('assert/strict');
const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const code=fs.readFileSync(path.join(__dirname,'../src/data/mediaStorage.ts'),'utf8');
const compiled=ts.transpileModule(code.replaceAll('import.meta.env','__env'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2023}}).outputText;
const db=new Map();
const context={
  exports:{}, module:{exports:{}},
  require(module){ if(module==='react')return {useState:()=>{},useEffect:()=>{}}; throw Error(`unexpected import ${module}`);},
  __env:{VITE_SUPABASE_URL:'https://demo-project.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'},
  localStorage:{getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,v)},
  window:{dispatchEvent(){}}, Event:class Event{},
  crypto:require('crypto').webcrypto, File:globalThis.File,
  fetch:async (url,opts)=>{ context.last={url,opts}; return {ok:true,status:200}; },
  Date,Blob,JSON,Object,Array,RegExp,encodeURIComponent,
};
vm.createContext(context);vm.runInContext(compiled,context);
const m=context.exports;
assert.equal(m.validPublishedMedia({photos:{}}),true);
assert.equal(m.validPublishedMedia({map:'maps/111-abc.jpg',photos:{'point1:forward':'street/point1/forward/111-abc.webp'}}),true);
assert.equal(m.validPublishedMedia({map:'https://evil.com/hack.jpg',photos:{}}),false);
assert.equal(m.validPublishedMedia({photos:{'../abc:forward':'street/point1/forward/test.webp'}}),false);
assert.equal(m.validPublishedMedia({photos:{'point1:forward':'street/point2/forward/test.webp'}}),false);
assert.equal(m.publicMediaUrl('maps/abc.jpg'),'https://demo-project.supabase.co/storage/v1/object/public/itda-media/maps/abc.jpg');
m.saveMediaDraft({photos:{'point1:forward':'street/point1/forward/1.webp'}});
assert.equal(m.readMediaDraft().photos['point1:forward'],'street/point1/forward/1.webp');
m.setPhotoMediaPath('point1','forward',null);assert.equal(Object.keys(m.readMediaDraft().photos).length,0);
(async()=>{
 const file=new File([Uint8Array.of(0xff,0xd8,0xff,0x00)],'test.jpg',{type:'image/jpeg'});
 const p=await m.uploadStreetPhoto(file,'point2','right',{token:'ACCESS_TEST'});
 assert.match(p,/^street\/point2\/right\/[\w-]+\.jpg$/);
 assert.match(context.last.url,/\/storage\/v1\/object\/itda-media\/street\/point2\/right\//);
 assert.equal(context.last.opts.headers.Authorization,'Bearer ACCESS_TEST');
 assert.equal(m.readMediaDraft().photos['point2:right'],p);
 console.log('Media manifest / URL / authenticated upload tests: PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
