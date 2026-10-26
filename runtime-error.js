(()=>{
  const records=[];let serial=0,lastFingerprint='',lastReportedAt=0;
  const ownedScripts=new Set(['runtime-error.js','dexie.min.js','protocol-data.js','features.js','app.js']);
  const sourceName=source=>{try{const url=new URL(source,location.href);return url.pathname.split('/').pop()||''}catch(_){return String(source||'').split(/[\/]/).pop()||''}};
  const isOwnedScript=source=>ownedScripts.has(sourceName(source));
  const describe=value=>{if(value instanceof Error)return value.stack||value.message||String(value);if(value&&typeof value==='object'){try{return JSON.stringify(value)}catch(_){}}const text=String(value??'未知错误').trim();return !text||text==='Script error.'||text==='Script error'?'脚本执行失败（浏览器未提供详细堆栈）':text};
  const shortSource=source=>{try{const url=new URL(source,location.href);return `${url.pathname.split('/').pop()||url.hostname}${url.search}`.slice(0,140)}catch(_){return String(source||'').slice(0,140)}};
  const paint=record=>{
    const root=document.getElementById('runtimeErrorPanel');if(!root)return;
    const title=root.querySelector('[data-runtime-error-title]'),copy=root.querySelector('[data-runtime-error-copy]'),meta=root.querySelector('[data-runtime-error-meta]');
    if(title)title.textContent=record.phase?`运行错误 · ${record.phase}`:'运行错误';
    if(copy)copy.textContent=record.message;
    if(meta)meta.textContent=`#${record.id} · ${record.time}${record.location?` · ${record.location}`:''}`;
    root.classList.add('show');root.setAttribute('aria-hidden','false');
  };
  const report=(error,phase='运行时',detail={})=>{const message=describe(error),location=detail.location||'',fingerprint=`${phase}|${message}|${location}`,now=Date.now();if(fingerprint===lastFingerprint&&now-lastReportedAt<1000)return records.at(-1)||null;lastFingerprint=fingerprint;lastReportedAt=now;const record={id:++serial,phase:String(phase||'运行时'),message,time:new Date().toLocaleTimeString(),location,error};records.push(record);if(records.length>50)records.shift();paint(record);return record};
  window.__APP_ERROR_BUS__={records,report,latest:()=>records.at(-1)||null};
  setTimeout(()=>{if(document.documentElement.dataset.appBoot!=='loading')return;document.documentElement.dataset.appBoot='error';report(new Error('启动超过 25 秒仍未完成，请检查脚本资源、网络与 IndexedDB 状态'),'启动超时')},25000);
  addEventListener('error',event=>{
    const target=event.target;
    if(target&&target!==window){
      const source=target.currentSrc||target.src||target.href||'';
      if(target.tagName==='SCRIPT'){if(source&&!isOwnedScript(source)){console.warn('[外部脚本资源错误已隔离]',shortSource(source));return}document.documentElement.dataset.appBoot='error';report(new Error(`脚本资源加载失败：${shortSource(source)||'未知脚本'}`),'脚本资源',{location:shortSource(source)});return}
      if(target.matches?.('[data-app-critical-style]')){document.documentElement.dataset.appBoot='error';report(new Error(`关键样式加载失败：${shortSource(source)||'未知样式'}`),'样式资源',{location:shortSource(source)});return}
      console.warn('[资源加载失败]',source||target.tagName);return
    }
    if(event.filename&&!isOwnedScript(event.filename)){console.warn('[外部脚本错误已隔离]',shortSource(event.filename),event.message||event.error||'未知错误');return}
    if(document.documentElement.dataset.appBoot==='loading')document.documentElement.dataset.appBoot='error';
    const location=[shortSource(event.filename),event.lineno||'',event.colno||''].filter(Boolean).join(':');
    report(event.error||event.message||new Error('脚本执行失败（浏览器未提供详细堆栈）'),'脚本',{location})
  },true);
  addEventListener('unhandledrejection',event=>{if(document.documentElement.dataset.appBoot==='loading')document.documentElement.dataset.appBoot='error';report(event.reason||'未处理的 Promise 拒绝','异步')});
  addEventListener('DOMContentLoaded',()=>{document.getElementById('runtimeErrorPanel')?.addEventListener('click',event=>{if(!event.target.closest('[data-runtime-error-close]'))return;const root=event.currentTarget;root.classList.remove('show');root.setAttribute('aria-hidden','true')});if(records.length)paint(records.at(-1))},{once:true});
})();
