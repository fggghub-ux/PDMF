// No packages required. Tests actual app modules with a transactional memory DB.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
global.window=new EventTarget();global.location={href:'http://localhost/'};
global.CustomEvent=class extends Event{constructor(name,options){super(name);this.detail=options.detail}};
vm.runInThisContext(fs.readFileSync(path.join(root,'protocol-data.js'),'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(root,'features.js'),'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(root,'communication.js'),'utf8'));
const appCode=fs.readFileSync(path.join(root,'app.js'),'utf8').replace('await APP.init()','globalThis.TEST_APP=APP');
vm.runInThisContext(appCode);
(async()=>{
 const A=global.TEST_APP;assert.ok(A);A.config=window.__APP_PROTOCOL_DATA__.protocol.config;
 let rows=new Map(),queue=Promise.resolve();
 A.store.db={settings:{get:async key=>structuredClone(rows.get(key)),put:async row=>rows.set(row.key,structuredClone(row)),toArray:async()=>structuredClone([...rows.values()])},transaction:(_mode,_table,fn)=>{const operation=queue.then(async()=>{const snapshot=structuredClone(rows);try{return await fn()}catch(e){rows=snapshot;throw e}});queue=operation.catch(()=>{});return operation}};
 const banners=[];A.guide.show=message=>banners.push(message);
 const U='userid0000000000000001',U2='userid0000000000000002',C='char0000000000000001';
 A.state.runtime.ready=true;A.state.communication.ownerId=U;
 A.state.roster.items=[{id:U,type:'userid',nickname:'阿林',setting:'用户是摄影师',password:'SECRET'},{id:U2,type:'userid',nickname:'阿林',setting:'用户是医生'},{id:C,type:'char',nickname:'阿林',setting:'修车师。称呼{{user}}为老林',language:'中文'}];
 A.state.roster.relations=[{type:'relation',id:'rel-user-char',sourceId:U,targetId:C,sourceToTarget:'老朋友',targetToSource:'老朋友',note:'认识多年，平时直呼昵称',createdAt:1,updatedAt:1}];
 A.messagePage.currentThreadId=C;
 const tests=[];const check=(value,name)=>{assert.ok(value,name);tests.push(name)};
 const form={elements:{message:{value:'车修好了吗？'}}};
 await A.messagePage.send(form);check(form.elements.message.value==='','successful user send clears input');
 check((await A.conversationStore.history(U,C))[0].senderId===U,'user sender persists');
 check((await A.conversationStore.history(U2,C)).length===0,'owner isolation');
 const config={provider:'compatible',url:'https://mock.test/v1',apiKey:'test-key',model:'mock',contextCount:20,temperature:.7};A.state.api.config=config;
 const reply={type:'reply',version:1,messages:[{type:'message',senderId:C,recipientId:U,content:'还差个零件。\n明天给你。'}]};
 const payload=()=>new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(reply)}}]}));
 let requests=0,body;global.fetch=async(url,options)=>{requests++;body=JSON.parse(options.body);return payload()};
 await A.messagePage.send(form);let history=await A.conversationStore.history(U,C);
 check(requests===1&&history.length===2,'empty send generates once without fake user');
 check(history[1].senderId===C&&!('text' in history[1])&&history[1].content.includes('\n'),'typed content preserved');
 check(!JSON.stringify(body).includes('SECRET'),'private credentials excluded');
 const ctx=JSON.parse(body.messages[1].content);check(ctx.segments.find(s=>s.type==='history_message').speakerKind==='user','speaker explicitly labeled');
 check(ctx.segments.find(s=>s.type==='identity'&&s.id===C).setting.includes('阿林'),'identity macros resolved');
 const relationship=ctx.segments.find(s=>s.type==='relationship'&&s.id==='rel-user-char');check(relationship?.sourceToTarget==='老朋友'&&relationship?.targetToSource==='老朋友','relationship map injected as typed context');
 check(A.rosterPage.relationSummaryBetween(U,C)==='老朋友'&&A.communicationDirectory.messageDetail(A.state.roster.items.find(x=>x.id===C)).includes('老朋友'),'relationship summary shared with Messages');
 const graphList={innerHTML:'',querySelector:()=>null,querySelectorAll:()=>[]},graphPlus={hidden:false,setAttribute(name,value){this[name]=value}};A.rosterPage.renderRelations(graphList,graphPlus);check(graphList.innerHTML.includes('roster-relation-stage')&&graphList.innerHTML.includes('roster-relation-world')&&graphList.innerHTML.includes('data-relation-person-id')&&!graphList.innerHTML.includes('roster-relation-toolbar')&&!graphList.innerHTML.includes('roster-relation-list'),'relationship graph renders as view-only infinite canvas');
 const cleaned=A.rosterPage.normalizeRelations([...A.state.roster.relations,{type:'relation',id:'dangling',sourceId:U,targetId:'char9999999999999999',sourceToTarget:'无效',updatedAt:2},{type:'relation',id:'self',sourceId:U,targetId:U,sourceToTarget:'自己',updatedAt:3}],A.state.roster.items);check(cleaned.length===1&&cleaned[0].id==='rel-user-char','relationship normalization prunes dangling and self links');
 const priorRelations=A.state.roster.relations;A.state.roster.relations=[{type:'relation',id:'directional',sourceId:U,targetId:C,sourceToTarget:'',targetToSource:'女儿',createdAt:1,updatedAt:1}];check(A.rosterPage.relationSummaryBetween(U,C)==='反向：女儿','one-sided relationship never inferred in the opposite direction');A.state.roster.relations=priorRelations;
 function allTyped(value){if(!value||typeof value!=='object')return true;if(Array.isArray(value))return value.every(allTyped);return typeof value.type==='string'&&Object.values(value).every(allTyped)}
 check(allTyped(ctx)&&allTyped(reply),'every business protocol object has type');
 A.auth.sessions.chat={id:U};check((await A.store.getChatConversations())[0].messages.length===2,'Chat reads SMS history');
 await A.store.appendChatMessage(C,{type:'message',senderId:U,recipientId:C,content:'聊天中补充'});check((await A.conversationStore.history(U,C)).length===3,'SMS reads Chat history');
 for(const invalid of [
 {type:'reply',version:1,messages:[{type:'message',senderId:U,recipientId:C,content:'替用户发言'}]},
 {type:'reply',version:1,messages:[{senderId:C,recipientId:U,content:'漏type'}]},
 {type:'reply',version:1,messages:[{type:'text',senderId:C,recipientId:U,text:'旧消息'}]},
 {type:'reply',version:1,messages:[reply.messages[0],{type:'message',senderId:U2,recipientId:U,content:'串号'}]},
 {type:'reply',version:1,messages:[{...reply.messages[0],text:'额外字段'}]},
 {type:'reply',version:1,messages:[]}
 ]){assert.throws(()=>A.conversationAI.parse(JSON.stringify(invalid),U,C));tests.push('reject malformed/spoofed batch')}
 assert.throws(()=>A.conversationAI.parse('```json\n'+JSON.stringify(reply)+'\n```',U,C));tests.push('no prose/fence repair fallback');
 const e={id:'1',enabled:true,content:'修理厂周一休息',strategy:'keyword',keys:['车'],filters:['好'],selectiveLogic:'and_all',probability:100,order:100,position:'depth',depth:1,role:'assistant',scanDepth:'',wholeWords:false};
 A.state.worldbook.items=[{id:'book',scope:'global',records:[e,{...e,id:'off',enabled:false},{...e,id:'zero',probability:0},{...e,id:'vector',strategy:'vector'}]},{id:'other',scope:'extension',records:[e]}];
 const prompt=A.conversationPrompt.build(U,C,history,config),data=JSON.parse(prompt.input);
 check(prompt.lore.length===1&&data.segments.some(s=>s.type==='worldbook_entry'&&s.declaredRole==='assistant'),'lore filters, disabled, probability, scope and role');
 check(A.conversationPrompt.build(U,C,history,{...config,contextCount:0}).recent.length===0,'zero context excludes all history');
 check(A.conversationPrompt.match('cat!','cat',{wholeWords:true})&&!A.conversationPrompt.match('cats','cat',{wholeWords:true}),'whole word matching');
 check(A.conversationPrompt.match('A+B','a+b',{wholeWords:true}),'keyword regex escaped');
 for(const [logic,filters,expected] of [['and_any',['好','未知'],true],['and_all',['好','未知'],false],['not_any',['未知'],true],['not_all',['好','未知'],true]]){
  A.state.worldbook.items=[{id:'b',scope:'global',records:[{...e,selectiveLogic:logic,filters}]}];check((A.conversationPrompt.lore(history,A.state.roster.items[0],A.state.roster.items[2]).length>0)===expected,'lore '+logic)
 }
 let resolveFetch;global.fetch=()=>{requests++;return new Promise(r=>resolveFetch=r)};
 let pending=A.messagePage.send(form);await new Promise(r=>setImmediate(r));const before=requests;await A.messagePage.send(form);check(requests===before,'rapid duplicate empty send suppressed');
 A.state.communication.ownerId=U2;resolveFetch(payload());await pending;
 check((await A.conversationStore.history(U2,C)).length===0&&(await A.conversationStore.history(U,C)).length===4,'pending reply bound to original owner');
 A.state.communication.ownerId=U;pending=A.messagePage.send(form);await new Promise(r=>setImmediate(r));
 await A.store.appendChatMessage(C,{type:'message',senderId:U,recipientId:C,content:'改天再说'});resolveFetch(payload());await pending;
 check((await A.conversationStore.history(U,C)).length===5,'stale response rejected on changed tail');
 // Cancel even when a provider/mock ignores AbortSignal.
 pending=A.messagePage.send(form);await new Promise(r=>setImmediate(r));A.conversationAI.cancel(U,C);resolveFetch(payload());await pending;
 check((await A.conversationStore.history(U,C)).length===5&&!A.conversationAI.pending.size,'cancel prevents commit and releases lock');
 const key=`account:chat:${U}:chatConversations`;
 await A.store.rawSet(key,[{profileId:C,messages:[{id:'old1',direction:'incoming',text:'旧记录',at:1},{id:'unknown',text:'不知道谁说的'},{id:'conflict',senderId:C,role:'user',text:'身份冲突'}]}]);
 await A.conversationStore.migrate();await A.conversationStore.migrate();
 check((await A.conversationStore.history(U,C)).filter(x=>x.content==='旧记录').length===1,'legacy migration idempotent');
 check((await A.store.rawGet(key))[0].messages.length===3,'ambiguous legacy originals preserved');
 for(const provider of ['compatible','openai','anthropic','gemini','deepseek']){const req=A.conversationAI.request({...config,provider},prompt);check(req.endpoint.startsWith('https://mock.test/')&&req.body,'provider request '+provider)}
 check(A.conversationAI.request({...config,provider:'openai'},prompt).body.text.format.schema.properties.messages.items.properties.senderId.enum[0]===C,'schema constrains sender before generation');
 check(A.conversationAI.extract({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(reply)}]}]},'openai')===JSON.stringify(reply),'OpenAI response extraction');
 check(A.conversationAI.extract({content:[{type:'thinking',thinking:'omit'},{type:'text',text:JSON.stringify(reply)}]},'anthropic')===JSON.stringify(reply),'Anthropic response extraction');
 check(A.conversationAI.extract({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'omit'},{text:JSON.stringify(reply)}]}}]},'gemini')===JSON.stringify(reply),'Gemini ignores thought parts');
 for(const provider of ['openai','anthropic','gemini','compatible']){const truncated={openai:{status:'incomplete'},anthropic:{stop_reason:'max_tokens'},gemini:{candidates:[{finishReason:'MAX_TOKENS'}]},compatible:{choices:[{finish_reason:'length'}]}};assert.throws(()=>A.conversationAI.extract(truncated[provider],provider));tests.push('reject truncation '+provider)}
 const prior=(await A.conversationStore.history(U,C)).length;global.fetch=async()=>new Response('{}',{status:500});await A.messagePage.send(form);
 check((await A.conversationStore.history(U,C)).length===prior&&banners.at(-1).includes('HTTP 500'),'HTTP failure never enters memory');
 // Storage/read failures must use the existing global guide and preserve the draft.
 const append=A.conversationStore.append;A.conversationStore.append=async()=>{throw new Error('模拟存储失败')};
 form.elements.message.value='保留这份草稿';await A.messagePage.send(form);
 check(form.elements.message.value==='保留这份草稿'&&banners.at(-1)==='发送失败：模拟存储失败','send failure uses global banner and preserves draft');A.conversationStore.append=append;
 const readHistory=A.conversationStore.history,paintStatus=A.messagePage.paintStatus;
 A.conversationStore.history=async()=>{throw new Error('模拟读取失败')};
 const list={textContent:'已有消息'};A.messagePage.root={querySelector:()=>list};A.messagePage.paintStatus=()=>{};
 await A.messagePage.renderConversation();check(list.textContent==='已有消息'&&banners.at(-1)==='读取消息失败：模拟读取失败','read failure uses global banner without replacing conversation');
 A.conversationStore.history=readHistory;A.messagePage.root=null;A.messagePage.paintStatus=paintStatus;
 check(!('errors' in A.messagePage),'local error cache removed');
 // Reinstall modules to represent memory loss while keeping durable DB bytes.
 const db=A.store.db;window.__APP_INSTALL_COMMUNICATION__(A);A.store.db=db;
 check((await A.conversationStore.history(U,C)).length===prior,'module reload reads persisted history');
 check(A.config.database.persistentKeys.includes('sharedConversationStore'),'shared key registered for cleanup retention');
 check(A.config.database.persistentKeys.includes('rosterRelations')&&A.config.roster.relationSettingKey==='rosterRelations','relationship store registered for cleanup retention');
 // 0.0.29 client-side staged delivery: first message is immediate, later messages use a fixed 1800ms gate.
 await A.conversationStore.clear(U,C);
 const originalWait=A.conversationAI.waitForDelivery,deliverySnapshots=[];
 A.conversationAI.waitForDelivery=async signal=>{deliverySnapshots.push((await A.conversationStore.history(U,C)).map(x=>x.content));check(!signal.aborted,'delivery wait receives live abort signal')};
 const stagedRows=[{type:'message',senderId:C,recipientId:U,content:'立即首条'},{type:'message',senderId:C,recipientId:U,content:'延迟第二条'},{type:'message',senderId:C,recipientId:U,content:'延迟第三条'}];
 await A.conversationAI.deliver(U,C,stagedRows,{requestId:'unit-staged-delivery',expectedTail:null,signal:new AbortController().signal});
 const stagedHistory=await A.conversationStore.history(U,C);
 check(A.conversationAI.deliveryDelayMs===1800,'later character messages use fixed 1800ms client delay');
 check(deliverySnapshots.length===2&&deliverySnapshots[0].length===1&&deliverySnapshots[0][0]==='立即首条'&&deliverySnapshots[1].length===2,'first character message commits immediately before any delivery wait');
 check(stagedHistory.length===3&&new Set(stagedHistory.map(x=>x.requestId)).size===1,'staged character batch keeps one requestId across delayed commits');
 A.conversationAI.waitForDelivery=originalWait;
 const stagedRewound=await A.conversationStore.rewindLastCharacterTurn(U,C);check(stagedRewound.length===3&&(await A.conversationStore.history(U,C)).length===0,'reroll removes the whole staged character batch');
 // 0.0.28 message mutation + memory archive + local icon subset invariants.
 const rerollBefore=(await A.conversationStore.history(U,C)).length;
 const rerollBatch=await A.conversationStore.append(U,C,[{type:'message',senderId:C,recipientId:U,content:'重回批次一'},{type:'message',senderId:C,recipientId:U,content:'重回批次二'}],{channel:'message',requestId:'unit-reroll'});
 const rewound=await A.conversationStore.rewindLastCharacterTurn(U,C);check(rewound.length===2&&rewound[0]===rerollBatch[0].id&&(await A.conversationStore.history(U,C)).length===rerollBefore,'reroll removes the whole latest character request batch');
 const mutable=(await A.conversationStore.append(U,C,[{type:'message',senderId:U,recipientId:C,content:'待编辑'}],{channel:'message'}))[0];
 await A.conversationStore.updateMessage(U,C,mutable.id,'编辑完成');check((await A.conversationStore.history(U,C)).at(-1).content==='编辑完成','edit mutates shared context ledger');
 await A.conversationStore.deleteMessages(U,C,[mutable.id]);check(!(await A.conversationStore.history(U,C)).some(x=>x.id===mutable.id),'delete removes message from shared context ledger');
 await A.conversationStore.clear(U,C);
 await A.conversationStore.append(U,C,[{type:'message',senderId:U,recipientId:C,content:'用户连续一'},{type:'message',senderId:U,recipientId:C,content:'用户连续二'}],{channel:'message'});
 await A.conversationStore.append(U,C,[{type:'message',senderId:C,recipientId:U,content:'角色同批一'},{type:'message',senderId:C,recipientId:U,content:'角色同批二'}],{channel:'message',requestId:'unit-summary-round'});
 const memoryReply={type:'conversation_memory',version:1,title:'一轮测试',retelling:'双方围绕同一事项交换了消息。',smsContext:'仍需继续当前事项。',facts:[],events:[],commitments:[],openLoops:['待继续'],relationshipUpdates:[],styleCues:['角色短句']};
 global.fetch=async()=>new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(memoryReply)}}]}),{status:200});
 const chatCountBeforeArchive=(await A.conversationStore.history(U,C)).length,archive=await A.memoryAI.summarize(U,C,1);
 check(archive.source.roundCount===1&&archive.source.messageCount===4,'summary round groups consecutive user messages with one character reply batch');
 check((await A.conversationStore.history(U,C)).length===chatCountBeforeArchive,'summary archive never inserts into raw chat history');
 check((await A.memoryStore.recalled(U,C)).length===0&&!archive.recall,'new archive is not recalled by default');
 await A.memoryStore.setRecall(U,archive.id,true);const recalled=await A.memoryStore.recalled(U,C),memoryPrompt=A.conversationPrompt.build(U,C,await A.conversationStore.history(U,C),config,recalled),memoryContext=JSON.parse(memoryPrompt.input);
 check(recalled.length===1&&memoryContext.segments.some(x=>x.type==='memory_archive'&&x.id===archive.id),'only explicitly recalled archive enters generation context');
 await A.conversationStore.clear(U,C);check((await A.memoryStore.list(U)).some(x=>x.id===archive.id),'clearing raw chat preserves Memory App archive');
 check(A.config.database.persistentKeys.includes('conversationMemoryStore')&&A.config.database.persistentKeys.includes('memoryQuickOwnerId'),'memory store and quick-login keys registered for cleanup retention');
 // Validate archive resource/version links and parse all JS without executing UI.
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(root,'core.css'),'utf8');
 const fonts=fs.readFileSync(path.join(root,'fonts.css'),'utf8');
 const communication=fs.readFileSync(path.join(root,'communication.js'),'utf8');
 const popoverIcons=[...communication.matchAll(/data-message-(?:action|bubble-action)=\"[^\"]+\"[^>]*><i class=\"fa-solid (fa-[a-z0-9-]+)\"/g)].map(match=>match[1]);
 check(popoverIcons.length===8&&popoverIcons.every(icon=>fonts.includes('.'+icon+'{--fa:')),'all message popover icons exist in bundled Font Awesome Classic Solid subset');
 check((html.match(/placeholder=\"message\.\.\.\"/g)||[]).length>=2,'message composer placeholder remains message... on message compose surfaces');
 check(html.includes('<button class="message-thread-avatar" type="button" data-message-thread-avatar data-message-info')&&!html.includes('class="message-info-action"'),'thread navbar right action is the current contact circular avatar');
 check(css.includes('.message-thread-avatar{appearance:none')&&css.includes('width:var(--global-page-action-size);height:var(--global-page-action-size)')&&css.includes('border-radius:50%')&&css.includes('background-color:var(--social-placeholder)'),'thread navbar avatar reuses global action sizing and existing circular placeholder');
 check(!css.includes('.message-generation-status')&&!css.includes('.has-message-status'),'legacy always-on generation status layer removed');
 check(communication.includes('data-message-action="reroll"')&&communication.includes('data-message-action="pause" hidden')&&communication.includes('data-message-action="summary"')&&communication.includes('data-message-action="clear"'),'plus popover exposes reroll, conditional pause, summary and clear');
 check(communication.includes("pending?'对方正在输入...':person"),'pending thread title renders 对方正在输入... instead of punctuation');
 check(css.includes('.global-popover.message-action-menu,.global-popover.message-bubble-menu{border:0;box-shadow:none}'),'both message popover shells have no border or shadow');
 check(communication.includes('M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337'),'multi-select uses Font Awesome Classic Solid circle-check SVG path');
 check(css.includes('.message-bubble{')&&css.includes('border-radius:calc(15 * var(--editor-u));display:flex'),'message bubble uses fixed-length capsule radius derived from global editor-u');
  check(!/\.message-bubble\{[^}]*border-radius\s*:\s*(?:[^;]*%|999(?:px)?)/.test(css),'message bubble must not use percentage or 999-style radius');
 check(css.includes('.roster-relations-mode .roster-main{')&&css.includes('overflow:hidden')&&css.includes('touch-action:none')&&css.includes('scrollbar-width:none'),'relationship canvas is drag/zoom view with hidden scrollbars');
 for(const match of html.matchAll(/(?:src|href)="\.\/([^"?]+)\?v=([^"]+)"/g)){assert.equal(match[2],A.config.product.version);assert.ok(fs.existsSync(path.join(root,match[1])))}tests.push('versioned resources exist and agree');
 console.log(JSON.stringify({passed:tests.length,checks:tests,scope:'Node integration with transactional in-memory database; browser suite requires Playwright + Chromium; external model requests mocked'},null,2));
})().catch(error=>{console.error(error);process.exit(1)});
