// Run: NODE_PATH=<directory containing playwright> node tests/communication.spec.cjs
// Serve the project first (default http://127.0.0.1:8765).
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app.js?*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('installFeatures(APP);','window.TEST_APP=APP;installFeatures(APP);')})});
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:8765');
 await page.waitForFunction(()=>document.documentElement.dataset.appBoot==='ready');
 const result=await page.evaluate(async()=>{
  const A=window.TEST_APP,checks=[];
  const check=(value,label)=>{if(!value)throw new Error(label);checks.push(label)};
  const U='userid0000000000000001',U2='userid0000000000000002',C='char0000000000000001';
  A.state.roster.items=[{id:U,type:'userid',nickname:'小林',setting:'摄影师',password:'PRIVATE'},{id:U2,type:'userid',nickname:'小林',setting:'医生'},{id:C,type:'char',nickname:'小林',setting:'修车师，句子简短；称呼{{user}}为老林'}];
  A.state.roster.relations=[{type:'relation',id:'rel-user-char',sourceId:U,targetId:C,sourceToTarget:'老朋友',targetToSource:'老朋友',note:'认识多年',createdAt:1,updatedAt:1}];
  await A.store.rawSet('rosterProfiles',A.state.roster.items);await A.store.rawSet('rosterRelations',A.state.roster.relations);await A.communicationDirectory.selectOwner(U);A.featureRuntime.ensure('message');A.messagePage.openThreadById(C);
  const form=A.messagePage.root.querySelector('[data-message-send-form]');
  form.elements.message.value='车修好了吗？';await A.messagePage.send(form);
  check((await A.conversationStore.history(U,C))[0].senderId===U,'user sender persisted');
  check((await A.conversationStore.history(U2,C)).length===0,'owner isolation');
  const config={provider:'compatible',url:'https://mock.test/v1',apiKey:'test-key',model:'mock',contextCount:20,temperature:.7};A.state.api.config=config;
  const response={type:'reply',version:1,messages:[{type:'message',senderId:C,recipientId:U,content:'还差个零件。\n明天给你。'}]};
  let requests=0,lastBody;window.fetch=async(url,options)=>{requests++;lastBody=JSON.parse(options.body);return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(response)}}]}),{status:200})};
  await A.messagePage.send(form);let history=await A.conversationStore.history(U,C);
  check(requests===1&&history.length===2,'empty send generates one reply without fake user');
  check(history[1].senderId===C&&history[1].content.includes('\n')&&!('text' in history[1]),'typed reply with preserved content');
  check(!JSON.stringify(lastBody).includes('PRIVATE'),'credentials excluded from prompt');
  const context=JSON.parse(lastBody.messages[1].content);check(context.segments.find(x=>x.type==='history_message').speakerKind==='user','explicit speaker in context');
  check(context.segments.some(x=>x.type==='relationship'&&x.id==='rel-user-char'),'relationship map injected in browser prompt');
  check(A.communicationDirectory.messageDetail(A.state.roster.items.find(x=>x.id===C)).includes('老朋友'),'Messages directory reads relationship summary');
  A.auth.sessions.chat={id:U};check((await A.store.getChatConversations())[0].messages.length===2,'chat reads SMS memory');
  await A.store.appendChatMessage(C,{type:'message',senderId:U,recipientId:C,content:'聊天中补充'});check((await A.conversationStore.history(U,C)).length===3,'SMS reads chat memory');
  for(const invalid of [
    {type:'reply',version:1,messages:[{type:'message',senderId:U,recipientId:C,content:'冒充用户'}]},
    {type:'reply',version:1,messages:[{senderId:C,recipientId:U,content:'缺 type'}]},
    {type:'reply',version:1,messages:[{type:'text',senderId:C,recipientId:U,text:'旧格式'}]},
    {type:'reply',version:1,messages:[response.messages[0],{type:'message',senderId:U2,recipientId:U,content:'串号'}]}
  ]){let rejected=false;try{A.conversationAI.parse(JSON.stringify(invalid),U,C)}catch{rejected=true}check(rejected,'invalid protocol rejected')}
  const e={id:'1',enabled:true,content:'修理厂周一休息',strategy:'keyword',keys:['车'],filters:['好'],selectiveLogic:'and_all',probability:100,order:100,position:'depth',depth:1,role:'assistant',scanDepth:'',wholeWords:false};
  A.state.worldbook.items=[{id:'book',scope:'global',records:[e,{...e,id:'off',enabled:false},{...e,id:'zero',probability:0}]},{id:'other',scope:'extension',records:[e]}];
  const prompt=A.conversationPrompt.build(U,C,history,config),ctx=JSON.parse(prompt.input);
  check(prompt.lore.length===1&&ctx.segments.some(s=>s.type==='worldbook_entry'&&s.declaredRole==='assistant'),'lore filtered and not treated as actual speech');
  check(A.conversationPrompt.build(U,C,history,{...config,contextCount:0}).recent.length===0,'zero context respected');
  check(A.conversationPrompt.match('cat!','cat',{wholeWords:true})&&!A.conversationPrompt.match('cats','cat',{wholeWords:true}),'whole word matching');
  // Delayed response, repeated submits and switching owner.
  let resolveFetch;window.fetch=()=>{requests++;return new Promise(resolve=>resolveFetch=resolve)};
  const pending=A.messagePage.send(form);await new Promise(r=>setTimeout(r,20));const before=requests;
  await A.messagePage.send(form);check(requests===before,'duplicate generate suppressed');
  await A.communicationDirectory.selectOwner(U2);
  resolveFetch(new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(response)}}]})));await pending;
  check((await A.conversationStore.history(U2,C)).length===0,'delayed reply cannot leak into switched owner');
  check((await A.conversationStore.history(U,C)).length===4,'reply persisted to original conversation');
  // A newly appended cross-app message makes an in-flight response stale.
  await A.communicationDirectory.selectOwner(U);const stale=A.messagePage.send(form);await new Promise(r=>setTimeout(r,20));
  await A.store.appendChatMessage(C,{type:'message',senderId:U,recipientId:C,content:'改天再说'});
  resolveFetch(new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(response)}}]})));await stale;
  check((await A.conversationStore.history(U,C)).length===5,'stale response discarded atomically');
  // Legacy history: migrate once, preserve ambiguous originals.
  const legacyKey=`account:chat:${U}:chatConversations`;
  await A.store.rawSet(legacyKey,[{profileId:C,messages:[{id:'old1',direction:'incoming',text:'旧记录',at:1},{id:'ambiguous',text:'不知道谁说的'}]}]);
  await A.conversationStore.migrate();await A.conversationStore.migrate();
  check((await A.conversationStore.history(U,C)).filter(x=>x.content==='旧记录').length===1,'migration idempotent');
  check((await A.store.rawGet(legacyKey))[0].messages.length===2,'legacy originals preserved');
  for(const provider of ['compatible','openai','anthropic','gemini','deepseek']){const req=A.conversationAI.request({...config,provider},prompt);check(req.endpoint.startsWith('https://mock.test/')&&req.body,'provider adapter '+provider)}
  // Request failure leaves history unchanged and exposes retry status.
  const prior=(await A.conversationStore.history(U,C)).length;window.fetch=async()=>new Response('{}',{status:500});await A.messagePage.send(form);
  check((await A.conversationStore.history(U,C)).length===prior&&A.refs.systemGuide.querySelector('[data-system-guide-copy]').textContent.includes('HTTP 500'),'failed response never enters memory');
  const event=new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true,cancelable:true});form.elements.message.dispatchEvent(event);check(event.defaultPrevented,'IME enter prevented');
  await A.store.reconcileCurrentData();check((await A.store.rawGet('sharedConversationStore')).conversations.length>0,'database cleanup retains shared ledger');
  return checks;
 });
 await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.appBoot==='ready');
 const persisted=await page.evaluate(async()=>{const A=window.TEST_APP;return (await A.conversationStore.history('userid0000000000000001','char0000000000000001')).length});assert.equal(persisted,6);result.push('reload preserves history');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:result.length,checks:result},null,2));
 await page.evaluate(()=>{const A=window.TEST_APP;A.lockScreen.unlock?.();A.openApp('message');A.messagePage.openThreadById('char0000000000000001')});
 await page.screenshot({path:process.env.SCREENSHOT||'/tmp/iuna-messages.png'});
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
