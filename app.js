(async()=>{
  /*
    APP is the only mutable application mother variable.
    Configuration is loaded once from the validated, immutable application protocol data block.
    No parallel managers, duplicate defaults, compatibility overlays or independent image channels are allowed.
  */
  const APP={
    protocol:null,
    config:null,
    protocolRuntime:{
      schemaId:'app-ui-protocol-schema',documentId:'app-ui-protocol',unsafeKeys:new Set(['__proto__','prototype','constructor']),
      fail(message){throw new Error(`应用协议：${message}`)},
      assert(condition,message){if(!condition)this.fail(message)},
      read(id){const data=window.__APP_PROTOCOL_DATA__;this.assert(data,'缺少应用协议数据');const value=id===this.schemaId?data.schema:id===this.documentId?data.protocol:null;this.assert(value,`缺少协议对象 ${id}`);return value},
      plain(value){return value!==null&&typeof value==='object'&&!Array.isArray(value)},
      scan(value,path='$'){if(Array.isArray(value)){value.forEach((item,index)=>this.scan(item,`${path}[${index}]`));return}if(!this.plain(value))return;for(const [key,item] of Object.entries(value)){this.assert(!this.unsafeKeys.has(key),`${path} 含不安全键 ${key}`);this.scan(item,`${path}.${key}`)}},
      unique(items,label){const values=items.map(String),counts=new Map();for(const value of values)counts.set(value,(counts.get(value)||0)+1);const duplicates=[...counts].filter(([,count])=>count>1).map(([value])=>value);this.assert(!duplicates.length,`${label} 存在重复值：${duplicates.join('、')}`)},
      validate(schema,protocolDoc){
        this.assert(schema?.$schema==='https://json-schema.org/draft/2020-12/schema','Schema 版本不是 Draft 2020-12');this.assert(protocolDoc?.$schema===schema.$id,'协议实例未绑定当前 Schema');this.assert(protocolDoc?.protocol==='app-ui/ui-config','协议名称不匹配');this.assert(/^\d+\.\d+\.\d+$/.test(protocolDoc.protocolVersion||''),'protocolVersion 必须使用 SemVer');this.assert(/^\d+\.\d+\.\d+$/.test(protocolDoc.appVersion||''),'appVersion 必须使用 SemVer');const versionedResources=[...document.querySelectorAll('script[src*="?v="],link[href*="?v="]')];for(const node of versionedResources){const raw=node.getAttribute(node.tagName==='SCRIPT'?'src':'href');const resourceVersion=new URL(raw,location.href).searchParams.get('v');this.assert(resourceVersion===protocolDoc.appVersion,`资源版本未与 appVersion 对齐：${raw} ≠ ${protocolDoc.appVersion}`)}this.assert(protocolDoc.encoding==='UTF-8','encoding 必须为 UTF-8');this.assert(Number.isInteger(protocolDoc.dataRevision)&&protocolDoc.dataRevision>0,'dataRevision 无效');
        this.assert(this.plain(protocolDoc.annotations)&&Array.isArray(protocolDoc.annotations.managedAttributes),'annotations 不完整');this.unique(protocolDoc.annotations.managedAttributes,'managedAttributes');for(const name of protocolDoc.annotations.managedAttributes)this.assert(/^data-[a-z0-9-]+$/.test(name),`无效标注名 ${name}`);for(const name of ['appIdentity','editorIdentity','chatPanelIdentity','chatTabIdentity','pageBackAction','settingsRoute','themeRoute'])this.assert(protocolDoc.annotations.managedAttributes.includes(protocolDoc.annotations[name]),`核心标注 ${name} 未注册`);
        const config=protocolDoc.config;this.assert(this.plain(config),'config 缺失');for(const key of ['database','api','chat','worldbook','product','apps','routes','pages','theme','image','styleControls','components','editorViews','themeImageEditor','themeImages','pager'])this.assert(Object.hasOwn(config,key),`config.${key} 缺失`);
        const auth=config.auth;this.assert(this.plain(auth)&&auth.protocol==='app-ui/roster-identity'&&auth.rosterType==='userid','账号协议缺失');this.assert(config.database.schema.accounts==='&id,&[appId+username]','旧版账号索引缺失');this.assert(config.database.persistentKeys.includes(auth.sessionKey)&&config.database.persistentKeys.includes(auth.legacyClaimKey),'账号元数据键缺失');this.assert(auth.legacyPassword?.algorithm==='PBKDF2'&&auth.legacyPassword?.hash==='SHA-256'&&auth.legacyPassword?.iterations>=600000,'旧版密码校验策略无效');this.assert(auth.scopedSettings?.chat?.includes('chatConversations')&&!auth.scopedSettings.chat.includes(config.roster.settingKey),'聊天与名册存储边界无效');for(const [appId,keys] of Object.entries(auth.scopedSettings)){this.unique(keys,`${appId} 账号数据键`);this.assert(keys.every(key=>config.database.persistentKeys.includes(key)||Object.hasOwn(config.components,key)),`${appId} 账号数据键未注册`)}
        const appIds=config.apps.map(item=>item?.id);this.unique(appIds,'app id');this.unique(Object.values(config.pages).map(page=>page?.selector),'页面 selector');const appIdSet=new Set(appIds),pageIds=new Set(Object.keys(config.pages));for(const [appId,route] of Object.entries(config.routes)){this.assert(appIdSet.has(appId),`路由 ${appId} 没有应用身份`);this.assert(pageIds.has(route?.pageId),`路由 ${appId} 指向未知页面`);if(route?.featureId!==undefined)this.assert(route.featureId===appId,`路由 ${appId} 的 featureId 必须复用稳定 appId`)}for(const launcher of document.querySelectorAll('.app-shell[data-app-id]')){const launcherId=String(launcher.dataset.appId||'');this.assert(/^[a-z0-9-]+$/.test(launcherId),`App 入口缺少稳定 ID`);this.assert(appIdSet.has(launcherId),`App 入口 ${launcherId} 未注册身份`);this.assert(!launcher.hasAttribute('data-page-id')&&!launcher.hasAttribute('onclick'),`App 入口 ${launcherId} 不得绑定页面或打开逻辑`)}const backEdges=new Map();for(const [pageId,page] of Object.entries(config.pages)){this.assert(typeof page?.selector==='string'&&page.selector.startsWith('#'),`页面 ${pageId} 的 selector 无效`);this.assert(document.querySelectorAll(page.selector).length===1,`页面 ${pageId} 必须且只能匹配一个节点`);if(page.backTarget!==undefined){this.assert(this.plain(page.backTarget),`页面 ${pageId} 的 backTarget 无效`);this.assert(pageIds.has(page.backTarget.pageId),`页面 ${pageId} 返回到未知页面 ${page.backTarget.pageId}`);this.assert(appIdSet.has(page.backTarget.appId),`页面 ${pageId} 返回使用未知应用 ${page.backTarget.appId}`);this.assert(page.backTarget.pageId!==pageId,`页面 ${pageId} 不能返回自身`);backEdges.set(pageId,page.backTarget.pageId)}}for(const start of backEdges.keys()){const seen=new Set([start]);let current=start;while(backEdges.has(current)){current=backEdges.get(current);this.assert(!seen.has(current),`页面返回链路存在循环：${[...seen,current].join(' -> ')}`);seen.add(current)}}
        this.unique(config.chat.allowedTabs,'聊天页签');const panelTabs=[...document.querySelectorAll('[data-chat-panel]')].map(node=>node.dataset.chatPanel),buttonTabs=[...document.querySelectorAll('[data-chat-tab]')].map(node=>node.dataset.chatTab);this.unique(panelTabs,'聊天面板标注');this.unique(buttonTabs,'聊天按钮标注');this.assert(config.chat.allowedTabs.every(tab=>panelTabs.includes(tab)&&buttonTabs.includes(tab)),'聊天页签协议与 DOM 标注不一致');
        this.assert(config.database.persistentKeys.includes(config.api.settingKeys.config)&&config.database.persistentKeys.includes(config.api.settingKeys.presets),'API 持久化键未注册');this.assert(config.database.persistentKeys.includes(config.worldbook.settingKey),'世界书持久化键未注册');const worldbook=config.worldbook,entry=worldbook.defaults.entry;this.assert(Object.hasOwn(worldbook.scopes,worldbook.defaults.book.scope),'世界书默认作用域无效');this.assert(Object.hasOwn(worldbook.positions,entry.position),'世界书默认位置无效');this.assert(Object.hasOwn(worldbook.strategies,entry.strategy),'世界书默认策略无效');this.assert(worldbook.selectiveLogics.includes(entry.selectiveLogic),'世界书默认逻辑无效');this.assert(worldbook.roles.includes(entry.role),'世界书默认角色无效');
        const roster=config.roster,rosterUI=roster?.ui;this.assert(this.plain(roster)&&this.plain(rosterUI),'名册单一配置缺失');this.assert(config.database.persistentKeys.includes(roster.settingKey)&&config.database.persistentKeys.includes(roster.relationSettingKey),'名册持久化键未注册');this.assert(this.plain(rosterUI.relations),'关系网配置缺失');this.unique(rosterUI.tabs.map(item=>item.id),'名册页签');this.unique(rosterUI.editor.fields.map(item=>item.key),'名册字段');this.unique(rosterUI.editor.media.map(item=>item.key),'名册媒体');const rosterTabs=new Map(rosterUI.tabs.map(item=>[item.id,item]));this.assert(rosterTabs.has(rosterUI.defaultTab)&&rosterTabs.get(rosterUI.defaultTab).editable,'名册默认页签必须是可编辑档案类型');for(const tab of rosterUI.tabs){this.assert(/^fa-[a-z0-9-]+$/.test(tab.icon||''),`名册页签 ${tab.id} 图标无效`);if(tab.editable)this.assert(typeof roster.prefixes?.[tab.id]==='string'&&roster.prefixes[tab.id],`名册档案 ${tab.id} 缺少 ID 前缀`)}for(const media of rosterUI.editor.media){this.assert(/^fa-[a-z0-9-]+$/.test(media.icon||''),`名册媒体 ${media.key} 图标无效`);this.assert(Object.hasOwn(config.image.strategies,media.strategy),`名册媒体 ${media.key} 引用了未知图片策略`)}for(const field of rosterUI.editor.fields){this.assert(['input','textarea'].includes(field.kind),`名册字段 ${field.key} 类型无效`);this.assert(!field.inputType||['text','password'].includes(field.inputType),`名册字段 ${field.key} 输入类型无效`);this.assert(field.kind==='textarea'&&field.maxLength===undefined||Number.isInteger(field.maxLength)&&field.maxLength>0,`名册字段 ${field.key} maxLength 无效`)}for(const group of ['credentials','locale','locations']){const pair=rosterUI.editor.fields.filter(field=>field.layoutGroup===group);this.assert(pair.length===2&&rosterUI.editor.fields.indexOf(pair[1])===rosterUI.editor.fields.indexOf(pair[0])+1,`名册 ${group} 双列字段缺失`)}this.assert(rosterUI.editor.fields.findIndex(field=>field.key==='phone')+1===rosterUI.editor.fields.findIndex(field=>field.key==='group'),'电话必须位于分组上方');
        for(const [type,definition] of Object.entries({...config.components,...config.editorViews})){this.assert(this.plain(definition.defaultState),`${type}.defaultState 缺失`);this.unique((definition.fields||[]).map(item=>item.key),`${type}.fields`);this.unique((definition.media||[]).map(item=>item.key),`${type}.media`);for(const control of definition.controls||[])this.assert(Object.hasOwn(config.styleControls,control),`${type} 引用了未知控件 ${control}`)}const declaredEditors=new Set([...Object.keys(config.components),...Object.keys(config.themeImages||{})]);for(const node of document.querySelectorAll('[data-editor]'))this.assert(declaredEditors.has(node.dataset.editor),`DOM 引用了未知编辑器 ${node.dataset.editor}`);APP.pageHeading.audit(document);this.scan(protocolDoc);return protocolDoc
      },
      materialize(value){if(Array.isArray(value))return value.map(item=>this.materialize(item));if(!this.plain(value))return value;const keys=Object.keys(value);if(keys.length===1&&keys[0]==='$css'){this.assert(/^--[a-z0-9-]+$/.test(value.$css||''),`无效 CSS 令牌 ${value.$css}`);const resolved=getComputedStyle(document.documentElement).getPropertyValue(value.$css).trim();this.assert(resolved,`CSS 令牌 ${value.$css} 未定义`);return resolved}return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,this.materialize(item)]))},
      freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))this.freeze(item)}return value},
      init(){const schema=this.read(this.schemaId),raw=this.read(this.documentId);this.validate(schema,raw);APP.protocol=this.freeze({...raw,config:this.materialize(raw.config)});APP.config=APP.protocol.config}
    },
    refs:{},
    state:{runtime:{shellReady:false,ready:false,error:null,phase:'boot'},page:{index:0,dragging:false,startX:0,startY:0,lastX:0,startTime:0,axis:null,tapEditorType:null},app:{activeAppId:null,activePageId:null},wallet:{view:'wallet'},chat:{activeTab:'messages'},phone:{activeTab:'calls',filter:'all',number:'',recents:[]},message:{view:'list',filter:'all'},communication:{ownerId:null},redbook:{activeTab:'home',activeHomeTab:'discover',activeSubpage:null},instagram:{activeTab:'home'},youtube:{activeTab:'home',subpage:null,channelTab:'home'},weibo:{activeTab:'home',homeTab:'following',channel:'hot'},douyin:{activeTab:'home',activeChannel:'recommend'},x:{activeTab:'home',subpage:null},api:{config:null,presets:{},selectedPreset:''},theme:{wallpaper:null,lockWallpaper:null,icons:null,lockScreen:null},worldbook:{items:[],filter:'all',activeBookId:null,activeEntryId:null,managing:false,selection:[]},roster:{items:[],relations:[],activeTab:null,editingId:null,draft:null,pendingAssets:new Set(),relationFocusId:null}},
    runtime:{
      nextPaint(){return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))},
      assertCriticalStyles(){const failed=[...document.querySelectorAll('[data-app-critical-style]')].filter(link=>!link.sheet).map(link=>link.getAttribute('href')||'未知样式');if(failed.length)throw new Error(`关键样式未就绪：${failed.join('、')}`)},
      assertCriticalRender(){
        const viewport=APP.refs.viewport,stage=APP.refs.stage,first=APP.refs.screens[0];
        if(!viewport||!stage||!first)throw new Error('首屏核心节点不完整');
        const viewportStyle=getComputedStyle(viewport),stageStyle=getComputedStyle(stage),width=Math.max(document.documentElement.clientWidth,innerWidth||0),stageWidth=stage.getBoundingClientRect().width,screenWidth=first.getBoundingClientRect().width;
        if(viewportStyle.position!=='fixed'||viewportStyle.overflow!=='hidden'||stageStyle.display!=='flex')throw new Error('首屏关键样式未生效');
        if(width<1||screenWidth<width*.95||stageWidth<width*3.8)throw new Error('首屏布局尺寸异常');
        const ytShell=document.querySelector('#youtubeApp .yt-shell'),wxShell=document.querySelector('#weatherApp .wx-shell');
        if(!ytShell||!wxShell)throw new Error('应用页面核心节点不完整');
        if(getComputedStyle(ytShell).position!=='relative'||getComputedStyle(wxShell).position!=='absolute')throw new Error('应用页面关键样式未生效');
        const auth=document.querySelector('#chatApp [data-chat-auth]'),authForm=auth?.querySelector('[data-chat-auth-form]');
        if(!auth||!authForm||getComputedStyle(auth).position!=='absolute'||getComputedStyle(authForm).display!=='flex')throw new Error('聊天登录页关键样式未生效');
      },
      async waitForFonts(){
        if(!document.fonts)return;
        await document.fonts.ready;
        if(!document.fonts.check('16px remixicon'))throw new Error('Remix Icon 字体未就绪');
        if(!document.fonts.check('900 16px "Font Awesome 6 Free"'))throw new Error('Font Awesome Classic Solid 字体未就绪');
        if(!document.fonts.check('400 16px "Font Awesome 6 Brands"'))throw new Error('Font Awesome Brands 字体未就绪');
      },
      withTimeout(promise,ms,message){let timer=0;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),ms)})]).finally(()=>clearTimeout(timer))},
      ensureDexie(){
        if(!window.Dexie)throw new Error('本地 Dexie.js 未加载');
        return Promise.resolve(window.Dexie)
      },
      report(error,phase='运行时'){APP.state.runtime.error=error;console.error(`[${phase}]`,error);window.__APP_ERROR_BUS__?.report(error,phase)}
    },
    featureRuntime:{
      initialized:new Set(),modules:new Map(),sourceVersion:'',
      register(appId,feature){const id=String(appId||'').trim();if(!id||!feature||typeof feature.init!=='function')throw new Error(`功能模块 ${id||'unknown'} 注册无效`);if(this.modules.has(id))throw new Error(`功能模块 ${id} 重复注册`);this.modules.set(id,feature);return true},
      seal(version){const next=String(version||'').trim();if(!/^\d+\.\d+\.\d+$/.test(next))throw new Error('功能模块资源版本无效');if(this.sourceVersion&&this.sourceVersion!==next)throw new Error(`功能模块资源版本冲突：${this.sourceVersion} ≠ ${next}`);this.sourceVersion=next;return true},
      assertBuild(){const expected=String(APP.protocol?.appVersion||'');if(!this.sourceVersion||this.sourceVersion!==expected)throw new Error(`功能模块资源版本不一致：features.js ${this.sourceVersion||'未注册'} ≠ ${expected||'未知 appVersion'}`);return true},
      assertRoutes(routes){for(const [appId,route] of Object.entries(routes||{})){const featureId=String(route?.featureId||'').trim();if(!featureId)continue;if(featureId!==appId)throw new Error(`功能模块路由 ${appId} 的 featureId 必须与稳定 appId 一致`);if(!this.modules.has(featureId))throw new Error(`功能模块 ${featureId} 未注册`)}return true},
      ensure(appId){const id=String(appId||'').trim();if(!this.modules.has(id)||this.initialized.has(id))return true;const feature=this.modules.get(id);if(!feature||typeof feature.init!=='function')throw new Error(`功能模块 ${id} 缺少 init()`);const started=performance.now();feature.init();this.initialized.add(id);const elapsed=performance.now()-started;if(elapsed>80)console.warn(`[启动性能] ${id} 初始化 ${elapsed.toFixed(1)}ms`);return true},
      ensureSoon(appId){const id=String(appId||'').trim();if(!this.modules.has(id))return;requestAnimationFrame(()=>{try{this.ensure(id);this.modules.get(id)?.activate?.()}catch(error){APP.runtime.report(error,`${id} 初始化`)}})},
    },

    appRegistry:{
      entries:new Map(),
      init(definitions){this.entries.clear();for(const item of definitions||[])this.register(item)},
      register(identity){if(!identity?.id)throw new Error('App 身份缺少稳定 ID');this.entries.set(identity.id,Object.freeze({id:String(identity.id)}))},
      resolve(appId){return this.entries.get(String(appId||''))||null}
    },
    appManager:{
      routes:new Map(),
      init(definitions){this.routes.clear();for(const [appId,route] of Object.entries(definitions||{}))this.routes.set(String(appId),Object.freeze({...route}))},
      resolve(appId){const id=String(appId||'');const identity=APP.appRegistry.resolve(id);const route=this.routes.get(id)||null;return identity&&route?{identity,route}:null},
      open(appId){
        const resolved=this.resolve(appId);if(!resolved?.route?.pageId)return false;const id=resolved.identity.id;
        if(new Set(['api','worldbook-settings','theme','roster','chat','wallet']).has(id)&&!APP.state.runtime.ready){APP.guide.show(APP.state.runtime.error?'数据层初始化失败，请查看错误提示':'数据层正在初始化');return false}
        const opened=APP.pageManager.open(resolved.route.pageId,{appId:id});if(opened&&resolved.route.featureId)APP.featureRuntime.ensureSoon(resolved.route.featureId);return opened
      }
    },


    pageManager:{
      pages:new Map(),
      init(definitions){
        this.pages.clear();
        for(const [pageId,definition] of Object.entries(definitions||{})){
          const node=document.querySelector(definition.selector);
          if(node)this.pages.set(pageId,{...definition,node})
        }
      },
      isOpen(){return Boolean(APP.state.app.activePageId)},
      open(pageId,context={}){
        const page=this.pages.get(pageId);if(!page)return false;
        for(const item of this.pages.values())item.node.classList.remove('active');
        APP.state.app.activeAppId=context.appId||null;APP.state.app.activePageId=pageId;
        APP.refs.appLayer.classList.add('open');APP.refs.appLayer.setAttribute('aria-hidden','false');document.body.classList.add('app-open');
        page.node.classList.add('active');return true
      },
      back(){
        const pageId=APP.state.app.activePageId,page=this.pages.get(pageId);
        if(pageId==='wallet')return APP.walletPage.back();
        if(pageId==='douyin')return APP.douyinPage.back();
        if(pageId==='x')return APP.xPage.back();
        if(pageId==='weather')return APP.weatherPage.back();
        if(pageId==='message')return APP.messagePage.back();
        if(pageId==='redbook'&&APP.state.redbook.activeSubpage)return APP.redbookPage.backSubpage();
        if(pageId==='roster-editor'){return APP.rosterPage.closeEditor()}
        if(pageId==='worldbook-entry-editor'){APP.state.worldbook.activeEntryId=null;APP.worldbookPage.renderEntryList();return this.open('worldbook-entries',{appId:'worldbook-settings'})}
        if(pageId==='worldbook-entries'){APP.state.worldbook.managing=false;APP.state.worldbook.selection=[];APP.worldbookPage.render();return this.open('worldbook',{appId:'worldbook-settings'})}
        if(page?.backTarget)return this.open(page.backTarget.pageId,{appId:page.backTarget.appId});
        return this.close()
      },
      close(){
        if(!this.isOpen())return false;
        const previousId=APP.state.app.activeAppId;for(const item of this.pages.values())item.node.classList.remove('active');
        if(previousId==='wallet')APP.walletPage?.reset?.();
        if(previousId==='douyin')APP.douyinPage.closeTransient();
        if(previousId==='redbook')APP.redbookPage.closeSubpage(true);
        if(previousId==='youtube')APP.youtubePage.toggleCreate(false);
        if(previousId==='x')APP.xPage.closeSubpage();
        if(previousId==='weather'){APP.weatherPage.stack=[];APP.weatherPage.show('forecast',false);APP.weatherPage.resetTransient()}
        if(previousId==='message')APP.messagePage.reset()
        APP.state.app.activeAppId=null;APP.state.app.activePageId=null;
        APP.refs.appLayer.classList.remove('open');APP.refs.appLayer.setAttribute('aria-hidden','true');document.body.classList.remove('app-open');
        APP.refs.viewport.querySelector(`[data-app-id="${previousId}"]`)?.focus({preventScroll:true});return true
      }
    },
    openApp(appId){return this.appManager.open(appId)},
    auth:{
      sessions:{},busy:false,
      current(appId){return this.sessions[appId]||null},
      normalizeUsername(value){return String(value||'').trim().normalize('NFKC').toLowerCase()},
      bytes(value){return [...new Uint8Array(value)].map(n=>n.toString(16).padStart(2,'0')).join('')},
      async credentialTag(profile){if(!crypto.subtle)throw new Error('账号功能需要 HTTPS 或 localhost 安全环境');const source=new TextEncoder().encode(`${this.normalizeUsername(profile.account)}\u0000${profile.password}`);return this.bytes(await crypto.subtle.digest('SHA-256',source))},
      identity(profile,appId,tag){return {id:profile.id,appId,username:String(profile.account||'').trim(),credentialTag:tag}},
      async persist(){await APP.store.rawSet(APP.config.auth.sessionKey,Object.fromEntries(Object.entries(this.sessions).map(([appId,item])=>[appId,{id:item.id,credentialTag:item.credentialTag}])))},
      async init(){
        const value=await APP.store.rawGet(APP.config.auth.sessionKey),roster=await APP.store.rawGet(APP.config.roster.settingKey);
        if(value&&typeof value==='object'&&Array.isArray(roster))for(const [appId,session] of Object.entries(value)){
          if(!APP.config.auth.scopedSettings[appId]||!session||typeof session!=='object')continue;
          const profile=roster.find(item=>item?.id===session.id&&item?.type===APP.config.auth.rosterType&&item?.account&&item?.password);
          if(profile&&roster.filter(item=>item?.account&&this.normalizeUsername(item.account)===this.normalizeUsername(profile.account)).length===1&&session.credentialTag===await this.credentialTag(profile))this.sessions[appId]=this.identity(profile,appId,session.credentialTag)
        }
        if(value&&Object.keys(value).length!==Object.keys(this.sessions).length)await this.persist()
      },
      async deriveLegacy(password,salt,iterations){
        if(!crypto.subtle)throw new Error('账号功能需要 HTTPS 或 localhost 安全环境');
        const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
        return this.bytes(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations,hash:APP.config.auth.legacyPassword.hash},key,APP.config.auth.legacyPassword.derivedBytes*8))
      },
      async matchesLegacy(account,password){
        const verifier=account?.verifier;if(!verifier?.salt||!verifier.digest)return false;
        const salt=Uint8Array.from(verifier.salt.match(/../g)||[],n=>parseInt(n,16)),digest=await this.deriveLegacy(password,salt,verifier.iterations);
        const a=Uint8Array.from(digest.match(/../g)||[],n=>parseInt(n,16)),b=Uint8Array.from(verifier.digest.match(/../g)||[],n=>parseInt(n,16));
        let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a[i]||0)^(b[i]||0);return diff===0
      },
      authResult(ok,code,message,account=null){return {ok,code,message,account}},
      async login(appId,username,password){
        if(!APP.config.auth.scopedSettings[appId])throw new Error(`未知账号作用域：${appId}`);
        const name=this.normalizeUsername(username);
        if(!name||!password)return this.authResult(false,'INVALID_CREDENTIALS','账号或密码错误');
        const matches=APP.state.roster.items.filter(item=>item.account&&this.normalizeUsername(item.account)===name);
        if(matches.length>1)return this.authResult(false,'DUPLICATE_ACCOUNT','名册账号重复，请先修正档案');
        const profile=matches.find(item=>item.type===APP.config.auth.rosterType);
        if(!profile||profile.password!==password)return this.authResult(false,'INVALID_CREDENTIALS','账号或密码错误');
        const legacy=await APP.store.db.accounts.where('[appId+username]').equals([appId,name]).first();
        await APP.store.adoptLegacyAccountData(appId,profile.id,legacy&&await this.matchesLegacy(legacy,password)?legacy.id:null);
        const latest=APP.state.roster.items.find(item=>item.id===profile.id);
        if(!latest||this.normalizeUsername(latest.account)!==name||latest.password!==password)return this.authResult(false,'CREDENTIALS_CHANGED','名册账号已变更，请重新登录');
        await this.enter(appId,latest);return this.authResult(true,'AUTHENTICATED','',this.current(appId))
      },
      async enter(appId,profile){
        const tag=await this.credentialTag(profile);this.sessions[appId]=this.identity(profile,appId,tag);await this.persist();
        if(appId==='chat')await this.refreshChat()
      },
      async revoke(appId){
        if(!this.sessions[appId])return;delete this.sessions[appId];await this.persist();if(appId==='chat')await this.refreshChat()
      },
      async reconcileRoster(){
        for(const [appId,account] of Object.entries(this.sessions)){
          const profile=APP.state.roster.items.find(item=>item.id===account.id&&item.type===APP.config.auth.rosterType);
          if(!profile||!profile.account||!profile.password||APP.state.roster.items.filter(item=>item.account&&this.normalizeUsername(item.account)===this.normalizeUsername(profile.account)).length!==1||account.credentialTag!==await this.credentialTag(profile))await this.revoke(appId)
        }
      },
      async syncRoster(previous,next){
        if(!previous)return;const affected=Object.entries(this.sessions).filter(([,session])=>session?.id===previous.id).map(([appId])=>appId);if(!affected.length)return;
        const credentialsChanged=!next||this.normalizeUsername(previous.account)!==this.normalizeUsername(next.account)||previous.password!==next.password;
        if(credentialsChanged){for(const appId of affected)await this.revoke(appId);return}
        for(const appId of affected)this.sessions[appId].username=String(next.account||'').trim();await this.persist()
      },
      async leave(appId){
        if(this.busy)return;this.busy=true;
        try{
          if(APP.editor.busy||APP.rosterPage.saving)throw new Error('请等待当前保存完成');
          if(APP.editor.active)await APP.editor.close();
          await this.revoke(appId)
        }finally{this.busy=false}
      },
      async refreshChat(){
        const names=APP.config.auth.scopedSettings.chat.filter(key=>APP.config.components[key]);
        const saved=await APP.store.getSettings(names);
        const ids=new Set();
        for(const name of names){APP.editor.values[name]=APP.editor.normalize(name,saved.get(name));APP.store.collectAssetIds(APP.editor.values[name],ids)}
        APP.images.prime(await APP.store.getAssets([...ids]));
        for(const name of names)await APP.editor.applyComponent(name,APP.editor.values[name]);
        APP.chatPage.renderAuth()
      }
    },
    pageHeading:{
      direct(heading,selector){return [...heading.children].filter(node=>node.matches?.(selector))},
      markup(title,subtitle,titleAttr='',subtitleAttr=''){
        const cleanTitle=String(title??'').trim(),cleanSubtitle=String(subtitle??'').trim();if(!cleanTitle||!cleanSubtitle)throw new Error('页面标题组件必须同时提供主标题与副标题');const esc=APP.modal.esc;
        return `<div class="global-page-heading"><div class="global-page-title"${titleAttr?` ${titleAttr}`:''}>${esc(cleanTitle)}</div><div class="global-page-subtitle"${subtitleAttr?` ${subtitleAttr}`:''}>${esc(cleanSubtitle)}</div></div>`
      },
      resolve(scope){if(!scope)return null;if(scope.matches?.('.global-page-heading'))return scope;return scope.querySelector?.('.global-page-heading')||null},
      set(scope,title,subtitle){
        const heading=this.resolve(scope),cleanTitle=String(title??'').trim(),cleanSubtitle=String(subtitle??'').trim();if(!heading||!cleanTitle||!cleanSubtitle)throw new Error('页面标题组件更新缺少主标题、副标题或标题节点');const titles=this.direct(heading,'.global-page-title'),subtitles=this.direct(heading,'.global-page-subtitle');if(titles.length!==1||subtitles.length!==1)throw new Error('页面标题组件结构必须且只能包含一个主标题和一个副标题');titles[0].textContent=cleanTitle;subtitles[0].textContent=cleanSubtitle;return heading
      },
      audit(scope=document){
        const headings=[...(scope.matches?.('.global-page-heading')?[scope]:scope.querySelectorAll?.('.global-page-heading')||[])];for(const heading of headings){const titles=this.direct(heading,'.global-page-title'),subtitles=this.direct(heading,'.global-page-subtitle');if(titles.length!==1||subtitles.length!==1)throw new Error('页面标题组件结构不完整：主标题与副标题必须一体化');if(!titles[0].textContent.trim()||!subtitles[0].textContent.trim())throw new Error('页面标题组件内容不完整：主标题与副标题均不能为空')}return true
      }
    },
    modal:{
      active:false,owner:null,resolve:null,cancelHandler:null,closeTimer:0,
      esc(value=''){return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))},
      isOpen(owner=null){return this.active&&(!owner||this.owner===owner)},
      shell({title,subtitle='',titleId='globalModalTitle',body='',bodyClass='',actions=''}){
        return `<div class="editor-scrim" aria-hidden="true"></div><section class="editor-panel" role="dialog" aria-modal="true" aria-labelledby="${this.esc(titleId)}"><header class="editor-head"><div class="editor-title" id="${this.esc(titleId)}">${this.esc(title)}</div>${subtitle?`<div class="editor-subtitle">${this.esc(subtitle)}</div>`:''}</header><div class="editor-body${bodyClass?` ${this.esc(bodyClass)}`:''}">${body}</div>${actions}</section>`
      },
      render({title,subtitle='',titleId='globalModalTitle',body='',bodyClass='modal-body',actions=null,confirmLabel='确定',cancelLabel='取消',danger=false}){
        const footer=actions??`<footer class="editor-actions"><button class="editor-action editor-cancel" type="button" data-modal-cancel>${this.esc(cancelLabel)}</button><button class="editor-action editor-confirm" type="button" data-modal-confirm${danger?' data-danger="true"':''}>${this.esc(confirmLabel)}</button></footer>`;
        APP.refs.globalPanel.innerHTML=this.shell({title,subtitle,titleId,body,bodyClass,actions:footer})
      },
      mount(options,{owner='modal',onCancel=null,reveal=true}={}){
        if(this.active)return false;
        clearTimeout(this.closeTimer);this.active=true;this.owner=owner;this.cancelHandler=onCancel;
        const active=document.activeElement;if(active instanceof HTMLElement)active.blur();
        this.render(options);if(reveal)this.reveal();
        return true
      },
      replace(options,{owner=this.owner,onCancel=this.cancelHandler}={}){
        if(!this.active)return false;this.owner=owner;this.cancelHandler=onCancel;this.render(options);return true
      },
      reveal(){
        if(!this.active)return false;const root=APP.refs.globalPanel;document.body.classList.add('editor-open');root.classList.remove('open');root.classList.add('mounted');root.setAttribute('aria-hidden','false');void root.offsetWidth;root.classList.add('open');return true
      },
      finish(value){
        if(!this.active)return;const root=APP.refs.globalPanel,resolver=this.resolve;this.resolve=null;this.cancelHandler=null;this.owner=null;this.active=false;root.classList.remove('open');root.setAttribute('aria-hidden','true');document.body.classList.remove('editor-open');clearTimeout(this.closeTimer);this.closeTimer=setTimeout(()=>{if(!root.classList.contains('open')){root.classList.remove('mounted');root.innerHTML=''}},240);resolver?.(value)
      },
      field(field){
        const key=this.esc(field.key),label=this.esc(field.label||''),value=this.esc(field.value??'');
        if(field.type==='select'){
          const options=(field.options||[]).map(option=>`<option value="${this.esc(option.value)}"${String(option.value)===String(field.value??'')?' selected':''}>${this.esc(option.label)}</option>`).join('');
          return `<label class="editor-choice-field editor-control-shell"><span class="editor-choice-label">${label}</span><span class="editor-choice-select-wrap"><select class="editor-choice-select" data-modal-field="${key}" aria-label="${label}"${field.required?' required':''}>${options}</select></span></label>`
        }
        const maximum=Number.isFinite(Number(field.maxLength))?` maxlength="${Math.max(1,Math.round(Number(field.maxLength)))}"`:'';
        if(field.type==='textarea')return `<label class="editor-field"><span class="editor-field-label">${label}</span><textarea class="editor-textarea" data-modal-field="${key}" placeholder="${this.esc(field.placeholder||'')}" spellcheck="false"${maximum}>${value}</textarea></label>`;
        return `<label class="editor-field"><span class="editor-field-label">${label}</span><input class="editor-input" data-modal-field="${key}" value="${value}" placeholder="${this.esc(field.placeholder||'')}" autocomplete="off" spellcheck="false"${maximum}></label>`
      },
      form({title,subtitle='',fields=[],confirmLabel='确定',cancelLabel='取消'},validate=null){
        return new Promise(resolve=>{
          this.resolve=resolve;const body=`<div class="modal-form">${fields.map(field=>this.field(field)).join('')}</div>`;
          if(!this.mount({title,subtitle,body,confirmLabel,cancelLabel})){this.resolve=null;resolve(null);return}
          const root=APP.refs.globalPanel,controls=()=>[...root.querySelectorAll('[data-modal-field]')],read=()=>Object.fromEntries(controls().map(element=>[element.dataset.modalField,element.value]));
          const reject=issue=>{const input=controls().find(element=>element.dataset.modalField===issue.field);if(!input)return;input.setCustomValidity(issue.message);input.reportValidity();input.addEventListener('input',()=>input.setCustomValidity(''),{once:true})};
          const submit=()=>{const values=read(),required=fields.find(field=>field.required&&!String(values[field.key]??'').trim()),issue=required?{field:required.key,message:required.requiredMessage||`请输入${required.label}`}:(validate?.(values)||null);if(issue){reject(issue);return}this.finish(values)};
          root.querySelector('[data-modal-cancel]')?.addEventListener('click',()=>this.finish(null),{once:true});
          root.querySelector('[data-modal-confirm]')?.addEventListener('click',submit);
          root.querySelectorAll('input[data-modal-field]').forEach(input=>input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();submit()}}))
        })
      },
      async prompt({title,subtitle='',label='名称',placeholder='',initial='',confirmLabel='继续'}){
        const result=await this.form({title,subtitle,confirmLabel,fields:[{key:'value',type:'text',label,placeholder,value:initial,required:true,requiredMessage:'请输入名称'}]});return result?.value?.trim()||null
      },
      confirm({title,subtitle='',text,confirmLabel='确认'}){
        return new Promise(resolve=>{
          this.resolve=resolve;const body=`<div class="modal-copy">${this.esc(text)}</div>`;
          if(!this.mount({title,subtitle,body,confirmLabel})){this.resolve=null;resolve(false);return}
          const root=APP.refs.globalPanel;root.querySelector('[data-modal-cancel]')?.addEventListener('click',()=>this.finish(false),{once:true});root.querySelector('[data-modal-confirm]')?.addEventListener('click',()=>this.finish(true),{once:true})
        })
      },
      custom(options,binder){
        return new Promise(resolve=>{
          this.resolve=resolve;if(!this.mount(options)){this.resolve=null;resolve(null);return}
          try{binder?.(APP.refs.globalPanel,value=>this.finish(value))}catch(error){console.error(error);this.finish(null)}
        })
      },
      cancel(){if(this.cancelHandler)return this.cancelHandler();this.finish(null)}
    },
    guide:{
      timer:0,
      show(message){
        const root=APP.refs.systemGuide;if(!root||!message)return;clearTimeout(this.timer);const copy=root.querySelector('[data-system-guide-copy]');copy.textContent=String(message).replace(/。+$/u,'');root.classList.remove('show');void root.offsetWidth;root.classList.add('show');this.timer=setTimeout(()=>root.classList.remove('show'),APP.config.api.guideDuration||5000)
      },
      hide(){clearTimeout(this.timer);APP.refs.systemGuide?.classList.remove('show')}
    },
    systemInfo:{
      action(label='关闭',panelAction=''){const marker=panelAction?` data-panel-action="${APP.modal.esc(panelAction)}"`:'';return `<footer class="editor-actions single"><button class="editor-action editor-confirm" type="button" data-modal-confirm${marker}>${APP.modal.esc(label)}</button></footer>`},
      show({title,subtitle,body,label='关闭',panelAction=''}){
        if(APP.modal.isOpen())return false;
        void APP.modal.custom({title,subtitle,body,actions:this.action(label,panelAction)},(root,finish)=>root.querySelector('[data-modal-confirm]')?.addEventListener('click',()=>finish(true),{once:true}));
        return true
      },
      openUpdateLog(){
        const product=APP.config.product,items=product.updateLog.map(item=>`<li>${APP.modal.esc(item)}</li>`).join('');
        const body=`<article class="modal-document"><div class="modal-document-meta"><span>${APP.modal.esc(product.releaseDate)}</span><span class="modal-document-version">${APP.modal.esc(product.version)}</span></div><section class="modal-document-section"><div class="modal-document-heading">本次更新</div><ul class="modal-document-list">${items}</ul></section></article>`;
        return this.show({title:'更新日志',subtitle:'UPDATE LOG',body})
      },
      openAbout(){
        const product=APP.config.product;
        const sections=product.aboutSections.map(section=>`<section class="modal-document-section"><div class="modal-document-heading">${APP.modal.esc(section.title)}</div>${section.paragraphs.map(copy=>`<p class="modal-document-copy">${APP.modal.esc(copy)}</p>`).join('')}</section>`).join('');
        const body=`<article class="modal-document"><div class="modal-document-meta"><span>${APP.modal.esc(product.name)}</span><span class="modal-document-version">${APP.modal.esc(product.version)}</span></div>${sections}<section class="modal-document-section"><div class="modal-document-heading">版权与许可</div><p class="modal-document-copy">${APP.modal.esc(product.copyright)}</p><p class="modal-document-copy modal-document-warning">${APP.modal.esc(product.restriction)}</p></section><section class="modal-document-section"><div class="modal-document-heading">售后处理</div><p class="modal-document-copy modal-document-warning">${APP.modal.esc(product.supportPolicy)}</p></section></article>`;
        return this.show({title:'关于本机',subtitle:'ABOUT THIS DEVICE',body,label:'我已知悉',panelAction:'about-device'})
      },
      open(type){if(type==='update-log')return this.openUpdateLog();if(type==='about-device')return this.openAbout();return false}
    },

    worldbookPage:{
      root:null,entriesRoot:null,editorRoot:null,form:null,bound:false,saving:false,
      get settingKey(){return APP.config.worldbook.settingKey},
      get scopes(){return APP.config.worldbook.scopes},
      get positions(){return APP.config.worldbook.positions},
      get strategies(){return APP.config.worldbook.strategies},
      csv(value){if(Array.isArray(value))return value.map(v=>String(v).trim()).filter(Boolean);return String(value||'').split(',').map(v=>v.trim()).filter(Boolean)},
      integer(value,fallback,min,max){const number=Number(value);return Math.max(min,Math.min(max,Number.isFinite(number)?Math.round(number):fallback))},
      randomNumericId(digits=17,used=new Set()){
        for(let attempt=0;attempt<256;attempt++){
          const bytes=new Uint8Array(digits);globalThis.crypto.getRandomValues(bytes);let id='';for(const byte of bytes)id+=String(byte%10);
          if(!used.has(id)){used.add(id);return id}
        }
        throw new Error(`无法生成不重复的 ${digits} 位数字 ID`)
      },
      normalizeEntry(item,index=0){
        const protocol=APP.config.worldbook,defaults=protocol.defaults.entry,positions=Object.keys(this.positions),strategies=Object.keys(this.strategies),logic=protocol.selectiveLogics;
        const scanRaw=item?.scanDepth;const scanDepth=scanRaw===''||scanRaw===null||scanRaw===undefined?'':this.integer(scanRaw,0,0,999);
        return {
          id:/^\d{17}$/.test(String(item?.id||''))?String(item.id):'',memo:String(item?.memo||item?.title||defaults.memo).trim().slice(0,80),strategy:strategies.includes(item?.strategy)?item.strategy:defaults.strategy,
          keys:this.csv(item?.keys??defaults.keys),filters:this.csv(item?.filters??defaults.filters),selectiveLogic:logic.includes(item?.selectiveLogic)?item.selectiveLogic:defaults.selectiveLogic,content:String(item?.content??defaults.content),
          order:this.integer(item?.order,defaults.order,0,9999),position:positions.includes(item?.position)?item.position:defaults.position,depth:this.integer(item?.depth,defaults.depth,0,99),
          role:protocol.roles.includes(item?.role)?item.role:defaults.role,probability:this.integer(item?.probability,defaults.probability,0,100),enabled:item?.enabled===undefined?defaults.enabled:item.enabled!==false,
          caseSensitive:item?.caseSensitive===undefined?Boolean(defaults.caseSensitive):Boolean(item.caseSensitive),wholeWords:item?.wholeWords===undefined?Boolean(defaults.wholeWords):Boolean(item.wholeWords),scanDepth,createdAt:Number(item?.createdAt)||Date.now(),updatedAt:Number(item?.updatedAt)||Number(item?.createdAt)||Date.now()
        }
      },
      normalize(value){
        const list=Array.isArray(value)?value:[],defaults=APP.config.worldbook.defaults.book,scopeKeys=Object.keys(this.scopes),used=new Set();
        return list.map((item,index)=>{const bookId=/^\d{17}$/.test(String(item?.id||''))&&!used.has(String(item.id))?(used.add(String(item.id)),String(item.id)):this.randomNumericId(17,used);const records=Array.isArray(item?.records)?item.records.map((entry,i)=>{const normalized=this.normalizeEntry(entry,i);normalized.id=/^\d{17}$/.test(normalized.id)&&!used.has(normalized.id)?(used.add(normalized.id),normalized.id):this.randomNumericId(17,used);return normalized}):[];return {
          id:bookId,name:String(item?.name??defaults.name).trim().slice(0,48)||defaults.name,scope:scopeKeys.includes(item?.scope)?item.scope:defaults.scope,
          entries:records.length,records,createdAt:Number(item?.createdAt)||Date.now()
        }})
      },
      filtered(){const filter=APP.state.worldbook.filter;return filter==='all'?APP.state.worldbook.items:APP.state.worldbook.items.filter(item=>item.scope===filter)},
      book(id=APP.state.worldbook.activeBookId){return APP.state.worldbook.items.find(item=>item.id===id)||null},
      entry(id=APP.state.worldbook.activeEntryId){const book=this.book();return book?.records?.find(item=>item.id===id)||null},
      render(){
        if(!this.root)return;const list=this.root.querySelector('[data-worldbook-list]'),total=this.root.querySelector('[data-worldbook-total]'),items=this.filtered();
        APP.state.worldbook.items.forEach(item=>item.entries=Array.isArray(item.records)?item.records.length:0);
        if(total)total.textContent=`${String(APP.state.worldbook.items.length).padStart(2,'0')} BOOKS`;
        this.root.querySelectorAll('[data-worldbook-filter]').forEach(button=>button.classList.toggle('active',button.dataset.worldbookFilter===APP.state.worldbook.filter));
        if(!list)return;
        if(!items.length){const filteredEmpty=APP.state.worldbook.items.length>0;list.innerHTML=`<div class="worldbook-empty"><div class="worldbook-empty-paper"><div class="worldbook-empty-index" aria-hidden="true">00</div><div class="worldbook-empty-title">${filteredEmpty?'这一页暂时是空的':'留一页给新的世界'}</div><div class="worldbook-empty-copy">${filteredEmpty?'换一个范围看看':'点击右上角 + 新建第一本世界书'}</div></div></div>`;return}
        list.innerHTML=`<div class="worldbook-cover-grid">${items.map((item,index)=>this.card(item,index)).join('')}</div>`
      },
      card(item,index){
        const label=this.scopes[item.scope]||this.scopes.global,seq=String(index+1).padStart(2,'0');
        return `<article class="worldbook-card" tabindex="0" role="button" aria-label="打开世界书 ${APP.modal.esc(item.name)}" data-worldbook-id="${APP.modal.esc(item.id)}" data-seq="${seq}"><div class="worldbook-card-head"><span class="worldbook-card-index">WORLD / ${seq}</span><span class="worldbook-scope" data-scope="${item.scope}">${label}</span></div><div class="worldbook-card-title">${APP.modal.esc(item.name)}</div><div class="worldbook-card-caption">memory archive</div><div class="worldbook-card-foot"><span class="worldbook-card-meta">${String(item.records?.length||0).padStart(2,'0')} entries</span><span class="worldbook-card-open">OPEN</span></div></article>`
      },
      closeMenu(){const menu=this.root?.querySelector('[data-worldbook-filter-menu]'),more=this.root?.querySelector('[data-worldbook-more]');if(menu)menu.hidden=true;if(more)more.setAttribute('aria-expanded','false')},
      toggleMenu(){const menu=this.root?.querySelector('[data-worldbook-filter-menu]'),more=this.root?.querySelector('[data-worldbook-more]');if(!menu||!more)return;menu.hidden=!menu.hidden;more.setAttribute('aria-expanded',String(!menu.hidden))},
      async persist(nextItems=APP.state.worldbook.items){
        const snapshot=this.normalize(structuredClone(nextItems)),stored=await APP.store.replaceSetting(this.settingKey,snapshot),committed=this.normalize(stored);
        if(JSON.stringify(committed)!==JSON.stringify(snapshot))throw new Error('世界书写入后的回读数据与提交快照不一致');
        APP.state.worldbook.items=committed;return committed
      },
      async create(){
        this.closeMenu();
        const result=await APP.modal.form({title:'新建世界书',confirmLabel:'创建',fields:[{key:'name',type:'text',label:'名称/이름',placeholder:'输入世界书名称',value:'',maxLength:48,required:true,requiredMessage:'请输入名称'},{key:'scope',type:'select',label:'作用/범위',value:'global',options:[{value:'global',label:'全局'},{value:'extension',label:'拓展'}]}]},values=>{const name=values.name.trim();return APP.state.worldbook.items.some(item=>item.name===name)?{field:'name',message:'已存在同名世界书'}:null});
        if(!result)return;const name=result.name.trim(),scope=result.scope==='extension'?'extension':'global',used=new Set(APP.state.worldbook.items.flatMap(book=>[book.id,...(book.records||[]).map(entry=>entry.id)])),id=this.randomNumericId(17,used),nextItems=structuredClone(APP.state.worldbook.items);nextItems.unshift({id,name,scope,entries:0,records:[],createdAt:Date.now()});
        try{await this.persist(nextItems);APP.state.worldbook.filter='all';this.render();APP.guide.show(`已创建「${name}」`)}catch(error){APP.runtime.report(error,'世界书新建');APP.guide.show('世界书创建失败，错误详情已显示')}
      },
      openBook(id){const book=this.book(id);if(!book)return;APP.state.worldbook.activeBookId=book.id;APP.state.worldbook.activeEntryId=null;APP.state.worldbook.managing=false;APP.state.worldbook.selection=[];this.renderEntryList();APP.pageManager.open('worldbook-entries',{appId:'worldbook-settings'})},
      strategyLabel(entry){return this.strategies[entry.strategy]||this.strategies.keyword},
      positionLabel(entry){return entry.position==='depth'?`DEPTH ${entry.depth}`:(this.positions[entry.position]||this.positions.after_char)},
      keyText(entry){if(entry.strategy==='constant')return '始终触发';if(entry.strategy==='vector'&&!entry.keys.length)return '按语义相似度匹配';return entry.keys.length?entry.keys.slice(0,4).join(' · '):'未设置关键词'},
      entryCard(entry,index,selected){
        const title=entry.memo||entry.keys[0]||'未命名条目',preview=entry.content.trim()||'还没有写入条目内容',keyText=this.keyText(entry),seq=String(index+1).padStart(2,'0'),position=this.positionLabel(entry),status=entry.enabled?this.strategyLabel(entry):'已停用';
        return `<article class="lore-entry-card${selected?' selected':''}" tabindex="0" role="button" data-lore-entry-id="${APP.modal.esc(entry.id)}" data-seq="${seq}"><span class="lore-select-mark" aria-hidden="true"><i class="fa-solid fa-check"></i></span><div class="lore-entry-top"><span class="lore-entry-icon" aria-hidden="true"><i class="fa-solid fa-bookmark"></i></span><div class="lore-entry-topcopy"><span class="lore-entry-index">ENTRY / ${seq}</span><div class="lore-entry-title">${APP.modal.esc(title)}</div></div><span class="lore-entry-status"><span class="lore-entry-enabled${entry.enabled?'':' off'}"></span>${APP.modal.esc(status)}</span></div><div class="lore-entry-preview">${APP.modal.esc(preview)}</div><div class="lore-entry-foot"><span class="lore-entry-keyicon" aria-hidden="true"><i class="fa-solid fa-key"></i></span><span class="lore-entry-keytext">${APP.modal.esc(keyText)}</span><span class="lore-entry-position">${APP.modal.esc(position)}</span></div></article>`
      },
      renderEntryList(){
        const root=this.entriesRoot,book=this.book();if(!root||!book)return;root.classList.toggle('managing',APP.state.worldbook.managing);
        const title=root.querySelector('[data-lore-book-title]'),count=root.querySelector('[data-lore-entry-count]'),scope=root.querySelector('[data-lore-book-scope]'),list=root.querySelector('[data-lore-entry-list]'),manage=root.querySelector('[data-lore-manage]'),bar=root.querySelector('[data-lore-manage-bar]'),del=root.querySelector('[data-lore-delete-selected]');
        APP.pageHeading.set(title?.parentElement||root,book.name,'월드북 항목');if(count)count.textContent=`${book.records.length} 条目`;if(scope)scope.textContent=this.scopes[book.scope]||'全局';if(manage)manage.setAttribute('aria-pressed',String(APP.state.worldbook.managing));
        const selected=new Set(APP.state.worldbook.selection);if(list){list.innerHTML=book.records.length?book.records.map((entry,index)=>this.entryCard(entry,index,selected.has(entry.id))).join(''):`<div class="lore-empty"><div class="lore-empty-sheet"><div class="lore-empty-title">还没有写下任何设定</div><div class="lore-empty-copy">从右上角 + 开始。先写内容，再决定它什么时候被想起。</div></div></div>`}
        if(bar)bar.hidden=!APP.state.worldbook.managing;if(del){del.disabled=!APP.state.worldbook.selection.length;del.textContent=APP.state.worldbook.selection.length?`删除所选 · ${APP.state.worldbook.selection.length}`:'删除所选'}
      },
      toggleManage(force){const next=typeof force==='boolean'?force:!APP.state.worldbook.managing;APP.state.worldbook.managing=next;if(!next)APP.state.worldbook.selection=[];this.renderEntryList()},
      toggleSelection(id){const set=new Set(APP.state.worldbook.selection);set.has(id)?set.delete(id):set.add(id);APP.state.worldbook.selection=[...set];this.renderEntryList()},
      async deleteSelected(){
        const book=this.book(),ids=APP.state.worldbook.selection;if(!book||!ids.length)return;const confirmed=await APP.modal.confirm({title:'删除所选条目？',text:`将永久删除 ${ids.length} 条世界书条目。`,confirmLabel:'删除'});if(!confirmed)return;
        const nextItems=structuredClone(APP.state.worldbook.items),nextBook=nextItems.find(item=>item.id===book.id),set=new Set(ids);
        try{if(!nextBook)throw new Error('待删除条目所属世界书不存在');nextBook.records=nextBook.records.filter(entry=>!set.has(entry.id));nextBook.entries=nextBook.records.length;await this.persist(nextItems);APP.state.worldbook.selection=[];APP.state.worldbook.managing=false;this.render();this.renderEntryList();APP.guide.show('已删除所选条目')}catch(error){APP.runtime.report(error,'世界书删除');APP.guide.show('世界书条目删除失败，错误详情已显示')}
      },
      blankEntry(){return this.normalizeEntry({id:'',...structuredClone(APP.config.worldbook.defaults.entry)})},
      openEditor(entryId=null){const book=this.book();if(!book)return;APP.state.worldbook.activeEntryId=entryId;this.paintEditor(entryId?this.entry(entryId):this.blankEntry());APP.pageManager.open('worldbook-entry-editor',{appId:'worldbook-settings'})},
      paintEditor(entry){
        const root=this.editorRoot,book=this.book();if(!root||!book||!entry)return;const q=s=>root.querySelector(s),editing=Boolean(APP.state.worldbook.activeEntryId);APP.pageHeading.set(q('[data-lore-editor-title]')?.parentElement||root,editing?'编辑条目':'添加条目',editing?'항목 편집':'항목 추가');
        q('[data-lore-memo]').value=entry.memo;q('[data-lore-enabled]').checked=entry.enabled;q('[data-lore-strategy]').value=entry.strategy;q('[data-lore-keys]').value=entry.keys.join(', ');q('[data-lore-filters]').value=entry.filters.join(', ');q('[data-lore-logic]').value=entry.selectiveLogic;q('[data-lore-content]').value=entry.content;q('[data-lore-position]').value=entry.position;q('[data-lore-order]').value=String(entry.order);q('[data-lore-depth]').value=String(entry.depth);q('[data-lore-role]').value=entry.role;q('[data-lore-probability]').value=String(entry.probability);q('[data-lore-case-sensitive]').checked=entry.caseSensitive;q('[data-lore-whole-words]').checked=entry.wholeWords;q('[data-lore-scan-depth]').value=entry.scanDepth===''?'':String(entry.scanDepth);this.syncEditor();q('[data-lore-memo]')?.scrollIntoView({block:'nearest'})
      },
      syncEditor(){const root=this.editorRoot;if(!root)return;const strategy=root.querySelector('[data-lore-strategy]')?.value||'constant',position=root.querySelector('[data-lore-position]')?.value||'after_char',prob=root.querySelector('[data-lore-probability]'),keyword=root.querySelector('[data-lore-keyword-fields]'),depth=root.querySelector('[data-lore-depth-fields]'),note=root.querySelector('[data-lore-trigger-note]');if(keyword)keyword.hidden=strategy==='constant';if(depth)depth.hidden=position!=='depth';if(prob){const n=Math.max(0,Math.min(100,Number(prob.value)||0));prob.style.setProperty('--range-progress',`${n}%`);const out=root.querySelector('[data-lore-probability-value]');if(out)out.textContent=`${Math.round(n)}%`}if(note)note.textContent=strategy==='constant'?'始终触发不依赖关键词，适合持续生效的短规则。':strategy==='vector'?'向量匹配依赖语义相似度；关键词可以作为额外触发线索。':'中文关键词保持短而明确即可；默认不启用整词匹配。'},
      readEditor(){const root=this.editorRoot,q=s=>root.querySelector(s),strategy=q('[data-lore-strategy]').value,scan=q('[data-lore-scan-depth]').value.trim();return this.normalizeEntry({id:APP.state.worldbook.activeEntryId||'',memo:q('[data-lore-memo]').value.trim(),enabled:q('[data-lore-enabled]').checked,strategy,keys:this.csv(q('[data-lore-keys]').value),filters:this.csv(q('[data-lore-filters]').value),selectiveLogic:q('[data-lore-logic]').value,content:q('[data-lore-content]').value.trim(),position:q('[data-lore-position]').value,order:q('[data-lore-order]').value,depth:q('[data-lore-depth]').value,role:q('[data-lore-role]').value,probability:q('[data-lore-probability]').value,caseSensitive:q('[data-lore-case-sensitive]').checked,wholeWords:q('[data-lore-whole-words]').checked,scanDepth:scan===''?'':scan,createdAt:this.entry()?.createdAt||Date.now(),updatedAt:Date.now()})},
      setEditorBusy(busy){this.saving=busy;const button=this.form?.querySelector('[data-lore-editor-save]');if(button){button.disabled=busy;button.textContent=busy?'保存中…':'保存'}},
      async saveEditor(){
        const root=this.editorRoot,book=this.book();if(!root||!book||this.saving)return;const entry=this.readEditor(),content=root.querySelector('[data-lore-content]');if(!entry.content){content?.setCustomValidity('请填写条目内容');content?.reportValidity();content?.addEventListener('input',()=>content.setCustomValidity(''),{once:true});return}
        entry.memo=entry.memo||entry.keys[0]||(entry.strategy==='constant'?'始终触发条目':'未命名条目');const nextItems=structuredClone(APP.state.worldbook.items),nextBook=nextItems.find(item=>item.id===book.id);if(!nextBook){const error=new Error('待保存条目所属世界书不存在');APP.runtime.report(error,'世界书保存');APP.guide.show('世界书条目保存失败，错误详情已显示');return}
        const editingId=APP.state.worldbook.activeEntryId,existingIndex=nextBook.records.findIndex(item=>item.id===editingId);if(existingIndex>=0){entry.id=nextBook.records[existingIndex].id;entry.createdAt=nextBook.records[existingIndex].createdAt;nextBook.records.splice(existingIndex,1,entry)}else{entry.id=this.randomNumericId(17,new Set(APP.state.worldbook.items.flatMap(item=>[item.id,...(item.records||[]).map(record=>record.id)])));entry.createdAt=Date.now();nextBook.records.unshift(entry)}nextBook.entries=nextBook.records.length;
        this.setEditorBusy(true);
        try{const committed=await this.persist(nextItems),savedBook=committed.find(item=>item.id===book.id),savedEntry=savedBook?.records.find(item=>item.id===entry.id);if(!savedEntry)throw new Error('世界书条目写入后未能回读');APP.state.worldbook.activeEntryId=null;this.render();this.renderEntryList();APP.pageManager.open('worldbook-entries',{appId:'worldbook-settings'});APP.guide.show('世界书条目已保存')}catch(error){APP.runtime.report(error,'世界书保存');APP.guide.show('世界书条目保存失败，错误详情已显示')}finally{this.setEditorBusy(false)}
      },
      bind(){
        if(this.bound||!this.root||!this.entriesRoot||!this.editorRoot)return;this.bound=true;
        this.root.addEventListener('click',event=>{const create=event.target.closest?.('[data-worldbook-create]');if(create){event.preventDefault();void this.create();return}const more=event.target.closest?.('[data-worldbook-more]');if(more){event.preventDefault();this.toggleMenu();return}const filter=event.target.closest?.('[data-worldbook-filter]');if(filter){event.preventDefault();APP.state.worldbook.filter=filter.dataset.worldbookFilter||'all';this.closeMenu();this.render();return}const card=event.target.closest?.('[data-worldbook-id]');if(card){event.preventDefault();this.closeMenu();this.openBook(card.dataset.worldbookId);return}if(!event.target.closest?.('[data-worldbook-filter-menu]'))this.closeMenu()});
        this.root.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const card=event.target.closest?.('[data-worldbook-id]');if(!card)return;event.preventDefault();this.openBook(card.dataset.worldbookId)});
        this.entriesRoot.addEventListener('click',event=>{if(event.target.closest('[data-lore-add]')){event.preventDefault();this.openEditor();return}if(event.target.closest('[data-lore-manage]')){event.preventDefault();this.toggleManage();return}if(event.target.closest('[data-lore-manage-done]')){event.preventDefault();this.toggleManage(false);return}if(event.target.closest('[data-lore-delete-selected]')){event.preventDefault();void this.deleteSelected();return}const card=event.target.closest('[data-lore-entry-id]');if(card){event.preventDefault();APP.state.worldbook.managing?this.toggleSelection(card.dataset.loreEntryId):this.openEditor(card.dataset.loreEntryId)}});
        this.entriesRoot.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const card=event.target.closest?.('[data-lore-entry-id]');if(!card)return;event.preventDefault();APP.state.worldbook.managing?this.toggleSelection(card.dataset.loreEntryId):this.openEditor(card.dataset.loreEntryId)});
        this.form?.addEventListener('submit',event=>{event.preventDefault();void this.saveEditor()});
        this.editorRoot.addEventListener('click',event=>{if(event.target.closest('[data-lore-editor-cancel]')){event.preventDefault();APP.state.worldbook.activeEntryId=null;this.renderEntryList();APP.pageManager.open('worldbook-entries',{appId:'worldbook-settings'})}});
        this.editorRoot.addEventListener('change',event=>{if(event.target.matches('[data-lore-strategy],[data-lore-position]'))this.syncEditor()});
        this.editorRoot.addEventListener('input',event=>{if(event.target.matches('[data-lore-probability]'))this.syncEditor()})
      },
      async init(prefetched=undefined){this.root=document.getElementById('worldbookApp');this.entriesRoot=document.getElementById('worldbookEntriesApp');this.editorRoot=document.getElementById('worldbookEntryEditorApp');this.form=this.editorRoot?.querySelector('[data-lore-form]')||null;if(!this.root||!this.entriesRoot||!this.editorRoot||!this.form)throw new Error('世界书页面结构不完整');const saved=prefetched===undefined?await APP.store.getSetting(this.settingKey):prefetched,normalized=this.normalize(saved);APP.state.worldbook.items=normalized;if(JSON.stringify(saved??[])!==JSON.stringify(normalized))await APP.store.replaceSetting(this.settingKey,normalized);APP.state.worldbook.filter='all';APP.state.worldbook.activeBookId=null;APP.state.worldbook.activeEntryId=null;APP.state.worldbook.managing=false;APP.state.worldbook.selection=[];this.render();this.bind()}
    },
    apiPage:{
      root:null,bound:false,busy:false,fetchingModels:false,customModels:{},fetchedModels:{},
      providers(){return APP.config.api.providers},
      settingKeys(){return APP.config.api.settingKeys},
      defaultConfig(){return structuredClone(APP.config.api.defaultState)},
      normalize(value){
        const base=this.defaultConfig(),incoming=value&&typeof value==='object'?value:{},providers=this.providers();
        const provider=providers[incoming.provider]?incoming.provider:base.provider,meta=providers[provider],model=String(incoming.model??'').trim()||meta.models?.[0]||'';
        const rawContext=Number(incoming.contextCount??base.contextCount);return {provider,url:String(incoming.url??meta.url??base.url).trim(),apiKey:String(incoming.apiKey??''),model,contextCount:Math.max(0,Math.min(999,Number.isFinite(rawContext)?Math.round(rawContext):base.contextCount)),temperature:Math.max(0,Math.min(2,Number.isFinite(Number(incoming.temperature))?Number(incoming.temperature):base.temperature))}
      },
      refs(){return {preset:this.root.querySelector('[data-api-preset]'),presetDelete:this.root.querySelector('[data-api-preset-delete]'),provider:this.root.querySelector('[data-api-provider]'),url:this.root.querySelector('[data-api-url]'),key:this.root.querySelector('[data-api-key]'),model:this.root.querySelector('[data-api-model]'),context:this.root.querySelector('[data-api-context]'),temperature:this.root.querySelector('[data-api-temperature]'),temperatureValue:this.root.querySelector('[data-api-temperature-value]'),fetchModels:this.root.querySelector('[data-api-fetch-models]'),test:this.root.querySelector('[data-api-test]'),save:this.root.querySelector('[data-api-save]')}},
      providerOptions(selected){return Object.entries(this.providers()).map(([value,item])=>`<option value="${value}"${value===selected?' selected':''}>${item.label}</option>`).join('')},
      modelOptions(provider,selected){
        const fetched=this.fetchedModels[provider],models=[...(fetched?.length?fetched:(this.providers()[provider]?.models||[]))],custom=this.customModels[provider];if(selected&&!models.includes(selected))models.push(selected);if(custom&&!models.includes(custom))models.push(custom);
        const placeholder=models.length?'':'<option value="">请选择模型</option>',items=models.map(model=>`<option value="${APP.editor.esc(model)}"${model===selected?' selected':''}>${APP.editor.esc(model)}</option>`).join('');return `${placeholder}${items}<option value="__custom__">自定义模型…</option>`
      },
      presetOptions(selected=''){
        const items=Object.keys(APP.state.api.presets||{}).sort((a,b)=>a.localeCompare(b,'zh-CN')).map(name=>`<option value="${APP.editor.esc(name)}"${name===selected?' selected':''}>${APP.editor.esc(name)}</option>`).join('');return `<option value="" hidden></option>${items}`
      },
      paintTemperature(input,value){const number=Math.max(0,Math.min(2,Number(value)||0));input.value=String(number);input.style.setProperty('--range-progress',`${number/2*100}%`);const out=this.root.querySelector('[data-api-temperature-value]');if(out)out.textContent=number.toFixed(1)},
      paint(config,{preset=APP.state.api.selectedPreset}={}){
        const r=this.refs();r.provider.innerHTML=this.providerOptions(config.provider);r.url.value=config.url;r.key.value=config.apiKey;r.model.innerHTML=this.modelOptions(config.provider,config.model);r.model.value=config.model;r.model.dataset.previous=config.model;r.context.value=String(config.contextCount);this.paintTemperature(r.temperature,config.temperature);r.preset.innerHTML=this.presetOptions(preset);r.preset.value=preset||'';r.presetDelete.disabled=!preset
      },
      read(){const r=this.refs();return this.normalize({provider:r.provider.value,url:r.url.value,apiKey:r.key.value,model:r.model.value==='__custom__'?'':r.model.value,contextCount:Number(r.context.value),temperature:Number(r.temperature.value)})},
      temperatureSupported(config){
        const model=String(config.model||'').toLowerCase();if(config.provider==='anthropic'&&(/claude-(fable|opus|sonnet)-5/.test(model)||/claude-opus-4-(7|8)/.test(model)))return false;if(config.provider==='gemini'&&/^gemini-3\./.test(model))return false;if(config.provider==='openai'&&/^gpt-5\.6/.test(model))return false;return true
      },
      modelListRequest(config){
        let base=String(config.url||'').trim().replace(/\/+$/,'');if(!/^https?:\/\//i.test(base))throw new Error('请先填写有效的接口网址');if(!config.apiKey.trim())throw new Error('请先填写 API key');
        base=base.replace(/\/(?:chat\/completions|responses|messages)$/i,'').replace(/\/models\/[^/]+:generateContent$/i,'');
        const headers={};let endpoint;
        if(config.provider==='gemini'){endpoint=/\/models$/i.test(base)?base:`${base}/models`;endpoint+=`${endpoint.includes('?')?'&':'?'}pageSize=1000`;headers['x-goog-api-key']=config.apiKey.trim()}
        else{endpoint=/\/models$/i.test(base)?base:`${base}/models`;if(config.provider==='anthropic'){headers['x-api-key']=config.apiKey.trim();headers['anthropic-version']='2023-06-01'}else headers.authorization=`Bearer ${config.apiKey.trim()}`}
        return {endpoint,headers}
      },
      extractModelIds(payload,provider){
        const list=Array.isArray(payload?.data)?payload.data:Array.isArray(payload?.models)?payload.models:Array.isArray(payload)?payload:[];const ids=[];
        for(const item of list){if(provider==='gemini'&&Array.isArray(item?.supportedGenerationMethods)&&!item.supportedGenerationMethods.includes('generateContent'))continue;const raw=typeof item==='string'?item:(item?.id??item?.name);if(!raw)continue;const id=String(raw).replace(/^models\//,'').trim();if(id&&!ids.includes(id))ids.push(id)}
        return ids
      },
      async fetchModels(){
        if(this.fetchingModels)return;const config=this.read();let request;try{request=this.modelListRequest(config)}catch(error){APP.guide.show(error.message);return}
        const r=this.refs(),button=r.fetchModels,controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);this.fetchingModels=true;button.disabled=true;button.textContent='拉取中…';
        try{
          const response=await fetch(request.endpoint,{method:'GET',headers:request.headers,mode:'cors',credentials:'omit',signal:controller.signal});let payload=null;try{payload=await response.json()}catch(_){ }
          if(!response.ok){const detail=payload?.error?.message||payload?.message||`HTTP ${response.status}`;throw new Error(detail)}
          const models=this.extractModelIds(payload,config.provider);if(!models.length)throw new Error('接口未返回可用模型');this.fetchedModels[config.provider]=models;const selected=models.includes(config.model)?config.model:models[0];r.model.innerHTML=this.modelOptions(config.provider,selected);r.model.value=selected;r.model.dataset.previous=selected;APP.guide.show(`已拉取 ${models.length} 个模型。`)
        }catch(error){const message=error?.name==='AbortError'?'拉取模型超时':error instanceof TypeError?'拉取失败：接口未开放浏览器跨域访问（CORS）':`拉取失败：${error?.message||'未知错误'}`;APP.guide.show(message)}
        finally{clearTimeout(timeout);this.fetchingModels=false;button.disabled=false;button.textContent='拉取模型'}
      },
      resolveEndpoint(config){
        const raw=String(config.url||'').trim().replace(/\/+$/,'');if(!/^https?:\/\//i.test(raw))throw new Error('接口网址必须以 http:// 或 https:// 开头');
        if(config.provider==='openai')return /\/responses$/i.test(raw)?raw:`${raw}/responses`;
        if(config.provider==='anthropic')return /\/messages$/i.test(raw)?raw:`${raw}/messages`;
        if(config.provider==='gemini')return /:generateContent$/i.test(raw)?raw:`${raw}/models/${encodeURIComponent(config.model)}:generateContent`;
        return /\/chat\/completions$/i.test(raw)?raw:`${raw}/chat/completions`
      },
      contextMessages(count){return Number(count)>0?[{role:'user',content:'Context check: remember the word iris.'},{role:'assistant',content:'Context received.'}]:[]},
      buildRequest(config){
        if(!config.apiKey.trim())throw new Error('请输入 API key');if(!config.model.trim())throw new Error('请选择或输入模型');const endpoint=this.resolveEndpoint(config),temperatureOK=this.temperatureSupported(config),headers={'content-type':'application/json'},signalText='Reply with only OK.';
        if(config.provider==='openai'){
          headers.authorization=`Bearer ${config.apiKey.trim()}`;const input=[...this.contextMessages(config.contextCount),{role:'user',content:signalText}],body={model:config.model,input,max_output_tokens:16};if(temperatureOK)body.temperature=config.temperature;return {endpoint,headers,body,temperatureOK}
        }
        if(config.provider==='anthropic'){
          headers['x-api-key']=config.apiKey.trim();headers['anthropic-version']='2023-06-01';const messages=[...this.contextMessages(config.contextCount),{role:'user',content:signalText}],body={model:config.model,max_tokens:16,messages};if(temperatureOK)body.temperature=Math.min(1,config.temperature);return {endpoint,headers,body,temperatureOK}
        }
        if(config.provider==='gemini'){
          headers['x-goog-api-key']=config.apiKey.trim();const contents=[];if(config.contextCount>0){contents.push({role:'user',parts:[{text:'Context check: remember the word iris.'}]}),contents.push({role:'model',parts:[{text:'Context received.'}]})}contents.push({role:'user',parts:[{text:signalText}]});const body={contents,generationConfig:{maxOutputTokens:16}};if(temperatureOK)body.generationConfig.temperature=config.temperature;return {endpoint,headers,body,temperatureOK}
        }
        headers.authorization=`Bearer ${config.apiKey.trim()}`;const messages=[...this.contextMessages(config.contextCount),{role:'user',content:signalText}],body={model:config.model,messages,max_tokens:16,temperature:config.temperature};return {endpoint,headers,body,temperatureOK:true}
      },
      async test(){
        if(this.busy)return;let config,request;try{config=this.read();request=this.buildRequest(config)}catch(error){APP.guide.show(error.message);return}
        const r=this.refs(),controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);this.busy=true;r.test.classList.add('api-test-busy');r.test.textContent='测试中…';
        try{
          const response=await fetch(request.endpoint,{method:'POST',headers:request.headers,body:JSON.stringify(request.body),mode:'cors',credentials:'omit',signal:controller.signal});let payload=null;try{payload=await response.json()}catch(_){ }
          if(!response.ok){const detail=payload?.error?.message||payload?.message||`HTTP ${response.status}`;throw new Error(detail)}
          APP.guide.show(`连接成功 · HTTP ${response.status}`)
        }catch(error){const message=error?.name==='AbortError'?'连接测试超时':error instanceof TypeError?'请求失败：接口未开放浏览器跨域访问（CORS）':`连接失败：${error?.message||'未知错误'}`;APP.guide.show(message)}
        finally{clearTimeout(timeout);this.busy=false;r.test.classList.remove('api-test-busy');r.test.textContent='测试连接'}
      },
      async save(){const config=this.read();if(!config.url.trim()){APP.guide.show('请输入接口网址。');return}if(!config.apiKey.trim()){APP.guide.show('请输入 API key。');return}if(!config.model.trim()){APP.guide.show('请选择或输入模型。');return}APP.state.api.config=config;await APP.store.setSetting(this.settingKeys().config,config);APP.guide.show('API 配置已保存。')},
      async savePreset(){
        const snapshot=this.read(),name=await APP.modal.prompt({title:'存为预设',subtitle:'프리셋 저장',label:'预设名称/프리셋 이름',placeholder:'输入预设名称',confirmLabel:'保存'});if(!name)return;
        APP.state.api.presets[name]=snapshot;APP.state.api.selectedPreset=name;await APP.store.setSetting(this.settingKeys().presets,APP.state.api.presets);this.paint(snapshot,{preset:name});APP.guide.show(`已保存预设「${name}」。`)
      },
      async deletePreset(){const name=this.refs().preset.value;if(!name||!APP.state.api.presets[name]){APP.guide.show('请先选择要删除的预设。');return}const confirmed=await APP.modal.confirm({title:'删除预设？',subtitle:'프리셋 삭제',text:`「${name}」将被永久删除，此操作不会删除当前已保存的 API 配置。`,confirmLabel:'删除'});if(!confirmed)return;delete APP.state.api.presets[name];APP.state.api.selectedPreset='';await APP.store.setSetting(this.settingKeys().presets,APP.state.api.presets);this.refs().preset.innerHTML=this.presetOptions('');this.refs().preset.value='';this.refs().presetDelete.disabled=true;APP.guide.show(`已删除预设「${name}」。`)},
      async chooseCustomModel(){const previous=this.refs().model.dataset.previous||'',current=this.read();current.model=previous;const name=await APP.modal.prompt({title:'自定义模型',subtitle:'사용자 지정 모델',label:'模型 ID/모델 ID',placeholder:'例如 custom-model-v1',confirmLabel:'使用'});if(!name){this.paint(current);return}this.customModels[current.provider]=name;current.model=name;this.paint(current);APP.guide.show(`已选择自定义模型「${name}」。`)},
      changeProvider(){const r=this.refs(),provider=r.provider.value,meta=this.providers()[provider],next=this.read();next.provider=provider;next.url=meta.url||'';next.model=meta.models?.[0]||'';APP.state.api.selectedPreset='';this.paint(next,{preset:''});APP.guide.show(`已切换 ${meta.label}。`)},
      loadPreset(name){if(!name||!APP.state.api.presets[name]){APP.state.api.selectedPreset='';this.refs().presetDelete.disabled=true;return}APP.state.api.selectedPreset=name;const config=this.normalize(APP.state.api.presets[name]);this.paint(config,{preset:name});APP.guide.show(`已载入预设「${name}」。`)},
      bind(){
        if(this.bound)return;this.bound=true;this.root.addEventListener('click',event=>{if(event.target.closest('[data-api-preset-save]'))return void this.savePreset();if(event.target.closest('[data-api-preset-delete]'))return void this.deletePreset();if(event.target.closest('[data-api-fetch-models]'))return void this.fetchModels();if(event.target.closest('[data-api-test]'))return void this.test();if(event.target.closest('[data-api-save]'))return void this.save()});
        this.root.addEventListener('change',event=>{const el=event.target;if(el.matches('[data-api-provider]'))return this.changeProvider();if(el.matches('[data-api-preset]'))return this.loadPreset(el.value);if(el.matches('[data-api-model]')){if(el.value==='__custom__')void this.chooseCustomModel();else el.dataset.previous=el.value;return}if(el.matches('[data-api-context]')){el.value=String(Math.max(0,Math.min(999,Math.round(Number(el.value)||0))));return}});
        this.root.addEventListener('input',event=>{const el=event.target;if(el.matches('[data-api-temperature]'))this.paintTemperature(el,el.value)})
      },
      async init(prefetched=null){this.root=document.getElementById('apiApp');if(!this.root)return;const keys=this.settingKeys();let saved,presets;if(prefetched){saved=prefetched.config;presets=prefetched.presets}else [saved,presets]=await Promise.all([APP.store.getSetting(keys.config),APP.store.getSetting(keys.presets)]);APP.state.api.config=this.normalize(saved);APP.state.api.presets=presets&&typeof presets==='object'&&!Array.isArray(presets)?presets:{};APP.state.api.selectedPreset='';this.paint(APP.state.api.config,{preset:''});this.bind()}
    },
    themePages:{
      wallpaperRoot:null,iconsRoot:null,lockRoot:null,iconDefaultMarkup:new Map(),wallpaperSaved:null,wallpaperDraft:null,wallpaperPending:new Set(),lockWallpaperSaved:null,lockWallpaperDraft:null,lockWallpaperPending:new Set(),iconsSaved:null,iconsDraft:null,iconsPending:new Set(),lockSaved:null,lockDraft:null,lockPasswordTimer:0,lockPersistQueue:Promise.resolve(),bound:false,
      clone(value){return structuredClone(value)},
      emptyMedia(){return {assetId:null,sourceType:'none',sourceValue:'',sourceLabel:''}},
      normalizeWallpaper(value){const base=this.clone(APP.config.theme.wallpaper.defaultState),incoming=value&&typeof value==='object'?value:{};if(incoming.image&&typeof incoming.image==='object')for(const key of Object.keys(base.image))if(Object.prototype.hasOwnProperty.call(incoming.image,key))base.image[key]=incoming.image[key];return base},
      normalizeLockScreen(value){
        const base=this.clone(APP.config.theme.lockScreen.defaultState),incoming=value&&typeof value==='object'?value:{};
        base.enabled=typeof incoming.enabled==='boolean'?incoming.enabled:base.enabled;base.passwordEnabled=typeof incoming.passwordEnabled==='boolean'?incoming.passwordEnabled:base.passwordEnabled;base.password=String(incoming.password??base.password).replace(/\D/g,'').slice(0,6);
        if(base.passwordEnabled&&base.password.length!==6)base.passwordEnabled=false;return base
      },
      normalizeLockWallpaper(value){const base=this.clone(APP.config.theme.lockWallpaper.defaultState),incoming=value&&typeof value==='object'?value:{};if(incoming.image&&typeof incoming.image==='object')for(const key of Object.keys(base.image))if(Object.prototype.hasOwnProperty.call(incoming.image,key))base.image[key]=incoming.image[key];return base},
      normalizeIcons(value){
        const cfg=APP.config.theme.icons,incoming=value&&typeof value==='object'?value:{},items={};
        for(const app of cfg.apps){const media=incoming.items?.[app.id];items[app.id]=this.emptyMedia();if(media&&typeof media==='object')for(const key of Object.keys(items[app.id]))if(Object.prototype.hasOwnProperty.call(media,key))items[app.id][key]=media[key]}
        const size=Math.max(cfg.sizeMin,Math.min(cfg.sizeMax,Number(incoming.size)||cfg.defaultSize)),radius=Math.max(cfg.radiusMin,Math.min(cfg.radiusMax,Number(incoming.radius)??cfg.defaultRadius));
        const iconColor=APP.editor.colorValue(incoming.iconColor,cfg.defaultIconColor),shellColor=APP.editor.colorValue(incoming.shellColor,cfg.defaultShellColor);
        return {size,radius:Number.isFinite(radius)?radius:cfg.defaultRadius,iconColor,shellColor,items}
      },
      rangeProgress(input,min,max,value){if(!input)return;input.style.setProperty('--range-progress',`${((value-min)/(max-min))*100}%`)},
      captureDefaultIcons(){for(const app of APP.config.theme.icons.apps){const source=APP.refs.viewport.querySelector(`.app-shell[data-app-id="${app.id}"]`);this.iconDefaultMarkup.set(app.id,source?.innerHTML||'')}},
      renderIconGrid(){const grid=this.iconsRoot?.querySelector('[data-theme-icon-grid]');if(!grid)return;grid.innerHTML=APP.config.theme.icons.apps.map(app=>`<button class="theme-icon-cell" type="button" data-icon-app="${app.id}" aria-label="更换${app.label}图标"><span class="theme-icon-preview-shell" data-icon-preview="${app.id}">${this.iconDefaultMarkup.get(app.id)||''}</span><span class="theme-icon-name">${app.label}</span></button>`).join('')},
      async applyWallpaper(state=this.wallpaperDraft){
        const media=state?.image||this.emptyMedia(),consumer='theme:wallpaper';
        await APP.images.present(media.assetId,consumer,url=>{const root=document.documentElement;if(url){root.style.setProperty('--wallpaper-color','var(--page)');root.style.setProperty('--wallpaper-image',`url("${url.replace(/"/g,'\\"')}")`);root.style.setProperty('--wallpaper-position','center');root.style.setProperty('--wallpaper-size','cover');root.style.setProperty('--wallpaper-repeat','no-repeat')}else for(const name of ['--wallpaper-color','--wallpaper-image','--wallpaper-position','--wallpaper-size','--wallpaper-repeat'])root.style.removeProperty(name)})
      },
      async applyLockWallpaper(state=this.lockWallpaperDraft){
        const media=state?.image||this.emptyMedia(),consumer='theme:lock-wallpaper';
        await APP.images.present(media.assetId,consumer,url=>{const root=document.documentElement;if(url){root.style.setProperty('--lock-wallpaper-color','var(--page)');root.style.setProperty('--lock-wallpaper-image',`url("${url.replace(/"/g,'\\"')}")`);root.style.setProperty('--lock-wallpaper-position','center');root.style.setProperty('--lock-wallpaper-size','cover');root.style.setProperty('--lock-wallpaper-repeat','no-repeat')}else for(const name of ['--lock-wallpaper-color','--lock-wallpaper-image','--lock-wallpaper-position','--lock-wallpaper-size','--lock-wallpaper-repeat'])root.style.removeProperty(name)})
      },
      paintLockSettings(state=this.lockDraft){
        if(!this.lockRoot||!state)return;const enabled=this.lockRoot.querySelector('[data-lock-setting="enabled"]'),passwordEnabled=this.lockRoot.querySelector('[data-lock-setting="passwordEnabled"]'),password=this.lockRoot.querySelector('[data-lock-password-input]');if(enabled)enabled.checked=state.enabled;if(passwordEnabled)passwordEnabled.checked=state.passwordEnabled;if(password&&document.activeElement!==password)password.value=state.password
      },
      persistLockState(next,{replacements=[]}={}){
        const normalized=this.normalizeLockScreen(next),key=APP.config.theme.lockScreen.settingKey,replacementSnapshot=this.clone(replacements);
        const commit=async()=>{const rollback=this.clone(this.lockSaved||APP.state.theme.lockScreen||APP.config.theme.lockScreen.defaultState);try{if(replacementSnapshot.length)await APP.images.commitState(key,normalized,replacementSnapshot);else await APP.store.replaceSetting(key,normalized);this.lockSaved=this.clone(normalized);this.lockDraft=this.clone(normalized);APP.state.theme.lockScreen=this.clone(normalized);this.paintLockSettings();APP.lockScreen.configure();return true}catch(error){APP.runtime.report(error,'锁屏设置');APP.guide.show('锁屏设置保存失败');this.lockSaved=this.normalizeLockScreen(rollback);this.lockDraft=this.clone(this.lockSaved);APP.state.theme.lockScreen=this.clone(this.lockSaved);this.paintLockSettings();APP.lockScreen.configure();return false}};
        const task=this.lockPersistQueue.then(commit,commit);this.lockPersistQueue=task.then(()=>undefined,()=>undefined);return task
      },
      schedulePasswordSave(){clearTimeout(this.lockPasswordTimer);this.lockPasswordTimer=setTimeout(()=>{if(this.lockDraft)void this.persistLockState(this.clone(this.lockDraft))},180)},
      async openLockWallpaperPanel(){
        if(APP.modal.isOpen())return;let temp=null;const current=this.lockWallpaperDraft?.image||this.emptyMedia(),previewConsumer='theme:lock-wallpaper-modal';
        const body=`<section class="editor-media"><div class="editor-media-label">锁屏壁纸/잠금 화면 배경</div><div class="editor-media-row"><div class="ui-media-surface editor-preview" data-lock-wallpaper-modal-preview aria-label="锁屏壁纸预览"></div><div class="editor-media-controls"><input class="editor-input" data-lock-wallpaper-modal-url value="" placeholder="图片 URL / 이미지 URL" inputmode="url" autocomplete="off" spellcheck="false" aria-label="锁屏壁纸 URL">${APP.editor.uploadButton('data-lock-wallpaper-modal-local')}</div></div></section>`;
        const result=await APP.modal.custom({title:'更换锁屏壁纸',subtitle:'잠금 화면 배경 변경',body,confirmLabel:'确定'},(root,finish)=>{const preview=root.querySelector('[data-lock-wallpaper-modal-preview]'),urlInput=root.querySelector('[data-lock-wallpaper-modal-url]'),confirm=root.querySelector('[data-modal-confirm]');let urlDirty=false;const paint=async media=>{await APP.images.present(media?.assetId,previewConsumer,url=>{if(preview)preview.style.backgroundImage=url?`url("${url.replace(/"/g,'\\"')}")`:'none'});if(urlInput){urlInput.value=media?.sourceType==='url'?(media.sourceValue||''):media?.sourceType==='local'?(media.sourceLabel||'本地文件'):'';urlInput.dataset.sourceMode=media?.sourceType||'none'}urlDirty=false};void paint(current);const accept=async asset=>{const previous=temp;temp=asset;await paint(temp);if(previous?.assetId&&previous.assetId!==temp?.assetId)await APP.images.discard(previous.assetId)};root.querySelector('[data-lock-wallpaper-modal-local]')?.addEventListener('click',()=>APP.images.chooseLocal({target:'themeLockWallpaperModal',strategy:APP.config.theme.lockWallpaper.strategy,onReady:asset=>void accept(asset),onError:error=>APP.guide.show(error?.message||'图片处理失败')}));urlInput?.addEventListener('input',()=>{urlDirty=true;urlInput.dataset.sourceMode='url'});root.querySelector('[data-modal-cancel]')?.addEventListener('click',()=>finish(null),{once:true});confirm?.addEventListener('click',async()=>{const value=urlInput?.value.trim()||'';if(urlDirty){if(!value){APP.guide.show('请输入图片 URL');return}try{const asset=await APP.images.ingestURL({target:'themeLockWallpaperModalURL',url:value,strategy:APP.config.theme.lockWallpaper.strategy});if(asset)await accept(asset)}catch(error){APP.guide.show(error?.message||'图片读取失败');return}}finish(temp?this.clone(temp):this.clone(current))},{once:true})});
        APP.images.releaseConsumer(previewConsumer);if(!result){if(temp?.assetId)await APP.images.discard(temp.assetId);return}const previous=this.lockWallpaperDraft?.image?.assetId,previousPending=previous&&this.lockWallpaperPending.has(previous)?previous:null;this.lockWallpaperDraft={image:this.clone(result)};if(result.assetId&&result.assetId!==this.lockWallpaperSaved?.image?.assetId)this.lockWallpaperPending.add(result.assetId);await this.applyLockWallpaper();if(previousPending&&previousPending!==result.assetId){this.lockWallpaperPending.delete(previousPending);await APP.images.discard(previousPending)}
      },
      async resetLockWallpaper(){const pending=[...this.lockWallpaperPending];this.lockWallpaperDraft=this.normalizeLockWallpaper(null);await this.applyLockWallpaper();this.lockWallpaperPending.clear();for(const id of pending)await APP.images.discard(id);APP.guide.show('锁屏壁纸已重置，保存后生效。')},
      async saveLockWallpaper(){const previous=this.lockWallpaperSaved||this.normalizeLockWallpaper(null),next=this.clone(this.lockWallpaperDraft),replacements=[{oldId:previous.image?.assetId||null,nextId:next.image?.assetId||null}];await APP.images.commitState(APP.config.theme.lockWallpaper.settingKey,next,replacements);this.lockWallpaperSaved=this.clone(next);this.lockWallpaperPending.clear();APP.state.theme.lockWallpaper=this.clone(next);await this.applyLockWallpaper(next);APP.guide.show('锁屏壁纸已保存。')},
      applyIconStyle(state=this.iconsDraft){
        if(!state)return;const root=document.documentElement;root.style.setProperty('--app-icon-size',`${state.size}px`);root.style.setProperty('--app-icon-radius',`${state.radius}px`);root.style.setProperty('--app-icon-color',state.iconColor);root.style.setProperty('--app-icon-shell-color',state.shellColor);
        const cfg=APP.config.theme.icons,size=this.iconsRoot?.querySelector('[data-icon-size]'),radius=this.iconsRoot?.querySelector('[data-icon-radius]'),iconColor=this.iconsRoot?.querySelector('[data-icon-color]'),shellColor=this.iconsRoot?.querySelector('[data-icon-shell-color]'),sizeOut=this.iconsRoot?.querySelector('[data-icon-size-value]'),radiusOut=this.iconsRoot?.querySelector('[data-icon-radius-value]');
        if(size){size.value=String(state.size);this.rangeProgress(size,cfg.sizeMin,cfg.sizeMax,state.size)}if(radius){radius.value=String(state.radius);this.rangeProgress(radius,cfg.radiusMin,cfg.radiusMax,state.radius)}if(iconColor)iconColor.value=state.iconColor;if(shellColor)shellColor.value=state.shellColor;if(sizeOut)sizeOut.textContent=`${Math.round(state.size)}px`;if(radiusOut)radiusOut.textContent=`${Math.round(state.radius)}px`
      },
      async applyIconMedia(state=this.iconsDraft){if(!state)return;await Promise.all(APP.config.theme.icons.apps.map(async app=>{const consumer=`theme:icon:${app.id}`,media=state.items?.[app.id]||this.emptyMedia();await APP.images.present(media.assetId,consumer,url=>{const css=url?`url("${url.replace(/"/g,'\\"')}")`:'';document.querySelectorAll(`.app-shell[data-app-id="${app.id}"]`).forEach(shell=>{shell.style.backgroundImage=css;shell.classList.toggle('theme-custom-icon',Boolean(url))});const preview=this.iconsRoot?.querySelector(`[data-icon-preview="${app.id}"]`);if(preview){preview.style.backgroundImage=css;preview.classList.toggle('theme-custom-icon',Boolean(url))}})}))},
      async applyIcons(state=this.iconsDraft){this.applyIconStyle(state);await this.applyIconMedia(state)},
      async openWallpaperPanel(){
        if(APP.modal.isOpen())return;let temp=null;const previewConsumer='theme:wallpaper-modal';
        const body=`<section class="editor-media"><div class="editor-media-label">壁纸/배경화면</div><div class="editor-media-row"><div class="ui-media-surface editor-preview" data-wallpaper-modal-preview aria-label="壁纸预览"></div><div class="editor-media-controls"><input class="editor-input" data-wallpaper-modal-url value="" placeholder="图片 URL / 이미지 URL" inputmode="url" autocomplete="off" spellcheck="false" aria-label="壁纸 URL">${APP.editor.uploadButton('data-wallpaper-modal-local')}</div></div></section>`;
        const result=await APP.modal.custom({title:'更换壁纸',subtitle:'배경화면 변경',body,confirmLabel:'确定'},(root,finish)=>{const preview=root.querySelector('[data-wallpaper-modal-preview]'),urlInput=root.querySelector('[data-wallpaper-modal-url]'),confirm=root.querySelector('[data-modal-confirm]');let urlDirty=false;const paint=async media=>{await APP.images.present(media?.assetId,previewConsumer,url=>{if(preview)preview.style.backgroundImage=url?`url("${url.replace(/"/g,'\\"')}")`:'none'});if(urlInput){urlInput.value=media?.sourceType==='url'?(media.sourceValue||''):media?.sourceType==='local'?(media.sourceLabel||'本地文件'):'';urlInput.dataset.sourceMode=media?.sourceType||'none'}urlDirty=false};void paint(this.wallpaperDraft?.image);const accept=async asset=>{const previous=temp;temp=asset;await paint(temp);if(previous?.assetId&&previous.assetId!==temp?.assetId)await APP.images.discard(previous.assetId)};root.querySelector('[data-wallpaper-modal-local]')?.addEventListener('click',()=>APP.images.chooseLocal({target:'themeWallpaperModal',strategy:APP.config.theme.wallpaper.strategy,onReady:asset=>void accept(asset),onError:error=>APP.guide.show(error?.message||'图片处理失败')}));urlInput?.addEventListener('input',()=>{urlDirty=true;urlInput.dataset.sourceMode='url'});root.querySelector('[data-modal-cancel]')?.addEventListener('click',()=>finish(null),{once:true});confirm?.addEventListener('click',async()=>{const value=urlInput?.value.trim()||'';if(urlDirty){if(!value){APP.guide.show('请输入图片 URL');return}try{const asset=await APP.images.ingestURL({target:'themeWallpaperModalURL',url:value,strategy:APP.config.theme.wallpaper.strategy});if(asset)await accept(asset)}catch(error){APP.guide.show(error?.message||'图片读取失败');return}}finish(temp?this.clone(temp):this.clone(this.wallpaperDraft?.image||this.emptyMedia()))},{once:true})});
        APP.images.releaseConsumer(previewConsumer);if(!result){if(temp?.assetId)await APP.images.discard(temp.assetId);return}const previous=this.wallpaperDraft?.image?.assetId,previousPending=previous&&this.wallpaperPending.has(previous)?previous:null;this.wallpaperDraft={image:this.clone(result)};if(result.assetId&&result.assetId!==this.wallpaperSaved?.image?.assetId)this.wallpaperPending.add(result.assetId);await this.applyWallpaper();if(previousPending&&previousPending!==result.assetId){this.wallpaperPending.delete(previousPending);await APP.images.discard(previousPending)}
      },
      async resetWallpaper(){const pending=[...this.wallpaperPending];this.wallpaperDraft=this.normalizeWallpaper(null);await this.applyWallpaper();this.wallpaperPending.clear();for(const id of pending)await APP.images.discard(id);APP.guide.show('壁纸已重置，保存后生效。')},
      async saveWallpaper(){const previous=this.wallpaperSaved||this.normalizeWallpaper(null),next=this.clone(this.wallpaperDraft),replacements=[{oldId:previous.image?.assetId||null,nextId:next.image?.assetId||null}];await APP.images.commitState(APP.config.theme.wallpaper.settingKey,next,replacements);this.wallpaperSaved=this.clone(next);this.wallpaperPending.clear();APP.state.theme.wallpaper=this.clone(next);await this.applyWallpaper(next);APP.guide.show('壁纸已保存。')},
      async applyIconAssets(start,assets){const cfg=APP.config.theme.icons,replacedPending=[];for(let index=0;index<assets.length;index++){const app=cfg.apps[start+index],asset=assets[index];if(!app||!asset)break;const previous=this.iconsDraft.items[app.id]?.assetId;if(previous&&this.iconsPending.has(previous)&&previous!==asset.assetId)replacedPending.push(previous);this.iconsDraft.items[app.id]=this.clone(asset);if(asset.assetId!==this.iconsSaved.items[app.id]?.assetId)this.iconsPending.add(asset.assetId)}await this.applyIconMedia();for(const id of replacedPending){this.iconsPending.delete(id);await APP.images.discard(id)}},
      async openIconPanel(initialId){
        if(APP.modal.isOpen())return;const cfg=APP.config.theme.icons,start=cfg.apps.findIndex(app=>app.id===initialId);if(start<0)return;const app=cfg.apps[start],max=cfg.apps.length-start,current=this.iconsDraft.items[app.id]||this.emptyMedia(),previewConsumer=`theme:icon-modal:${initialId}`;
        const body=`<section class="editor-media"><div class="editor-media-row"><div class="ui-media-surface editor-preview" data-icon-modal-preview aria-label="当前图标预览"><span class="theme-icon-preview-shell" data-icon-modal-shell>${this.iconDefaultMarkup.get(app.id)||''}</span></div><div class="editor-media-controls"><input class="editor-input" data-icon-modal-url value="${APP.editor.esc(current.sourceType==='url'?(current.sourceValue||''): '')}" placeholder="图片 URL / 이미지 URL" inputmode="url" autocomplete="off" spellcheck="false" aria-label="图标 URL">${APP.editor.uploadButton('data-icon-modal-local')}</div></div></section>`;
        const result=await APP.modal.custom({title:'更换图标',body,confirmLabel:'确定'},(root,finish)=>{const shell=root.querySelector('[data-icon-modal-shell]'),urlInput=root.querySelector('[data-icon-modal-url]');const paintCurrent=async()=>{await APP.images.present(current.assetId,previewConsumer,url=>{if(shell){shell.style.backgroundImage=url?`url("${url.replace(/"/g,'\\"')}")`:'';shell.classList.toggle('theme-custom-icon',Boolean(url))}})};void paintCurrent();root.querySelector('[data-modal-cancel]')?.addEventListener('click',()=>finish(null),{once:true});root.querySelector('[data-icon-modal-local]')?.addEventListener('click',()=>APP.images.chooseLocalMany({target:`themeIconBatch:${initialId}`,strategy:'squareImage',max,onReady:async assets=>{if(!assets?.length)return;await this.applyIconAssets(start,assets);finish({kind:'local'})},onError:error=>APP.guide.show(error?.message||'图片处理失败')}));root.querySelector('[data-modal-confirm]')?.addEventListener('click',async()=>{const value=urlInput?.value.trim()||'';if(!value){finish(null);return}if(current.sourceType==='url'&&current.sourceValue===value){finish(null);return}try{const asset=await APP.images.ingestURL({target:`themeIconURL:${initialId}`,url:value,strategy:'squareImage'});if(asset){await this.applyIconAssets(start,[asset]);finish({kind:'url'})}}catch(error){APP.guide.show(error?.message||'图片读取失败')}},{once:true})});APP.images.releaseConsumer(previewConsumer);return result
      },
      async resetIcons(){const pending=[...this.iconsPending];this.iconsDraft=this.normalizeIcons(null);await this.applyIcons();this.iconsPending.clear();for(const id of pending)await APP.images.discard(id);APP.guide.show('图标已重置，保存后生效。')},
      async saveIcons(){const previous=this.iconsSaved||this.normalizeIcons(null),next=this.clone(this.iconsDraft),replacements=APP.config.theme.icons.apps.map(app=>({oldId:previous.items[app.id]?.assetId||null,nextId:next.items[app.id]?.assetId||null}));await APP.images.commitState(APP.config.theme.icons.settingKey,next,replacements);this.iconsSaved=this.clone(next);this.iconsPending.clear();APP.state.theme.icons=this.clone(next);await this.applyIcons(next);APP.guide.show('图标设置已保存。')},
      bind(){
        if(this.bound)return;this.bound=true;
        this.wallpaperRoot?.addEventListener('click',event=>{if(event.target.closest('[data-wallpaper-preview],[data-wallpaper-change]'))return void this.openWallpaperPanel();if(event.target.closest('[data-wallpaper-reset]'))return void this.resetWallpaper();if(event.target.closest('[data-wallpaper-save]'))return void this.saveWallpaper()});
        this.lockRoot?.addEventListener('change',event=>{const element=event.target;if(!(element instanceof HTMLInputElement)||!this.lockDraft)return;if(element.matches('[data-lock-setting="enabled"]')){this.lockDraft.enabled=element.checked;void this.persistLockState(this.clone(this.lockDraft));return}if(element.matches('[data-lock-setting="passwordEnabled"]')){if(element.checked&&this.lockDraft.password.length!==6){element.checked=false;this.lockRoot.querySelector('[data-lock-password-input]')?.focus();APP.guide.show('请先输入 6 位数字锁屏密码');return}this.lockDraft.passwordEnabled=element.checked;void this.persistLockState(this.clone(this.lockDraft))}});
        this.lockRoot?.addEventListener('input',event=>{const element=event.target;if(!(element instanceof HTMLInputElement)||!element.matches('[data-lock-password-input]')||!this.lockDraft)return;const clean=element.value.replace(/\D/g,'').slice(0,6);if(element.value!==clean)element.value=clean;this.lockDraft.password=clean;if(this.lockDraft.passwordEnabled&&clean.length!==6)this.lockDraft.passwordEnabled=false;this.paintLockSettings(this.lockDraft);this.schedulePasswordSave()});
        this.lockRoot?.addEventListener('click',event=>{if(event.target.closest('[data-lock-wallpaper-preview],[data-lock-wallpaper-change]'))return void this.openLockWallpaperPanel();if(event.target.closest('[data-lock-wallpaper-reset]'))return void this.resetLockWallpaper();if(event.target.closest('[data-lock-wallpaper-save]'))return void this.saveLockWallpaper()});
        this.iconsRoot?.addEventListener('click',event=>{const icon=event.target.closest('[data-icon-app]');if(icon)return void this.openIconPanel(icon.dataset.iconApp);if(event.target.closest('[data-icons-reset]'))return void this.resetIcons();if(event.target.closest('[data-icons-save]'))return void this.saveIcons()});
        this.iconsRoot?.addEventListener('input',event=>{const cfg=APP.config.theme.icons,element=event.target;if(!(element instanceof HTMLInputElement)||!this.iconsDraft)return;if(element.matches('[data-icon-size]')){this.iconsDraft.size=Math.max(cfg.sizeMin,Math.min(cfg.sizeMax,Number(element.value)));this.rangeProgress(element,cfg.sizeMin,cfg.sizeMax,this.iconsDraft.size);const output=this.iconsRoot.querySelector('[data-icon-size-value]');if(output)output.textContent=`${Math.round(this.iconsDraft.size)}px`;this.applyIconStyle();return}if(element.matches('[data-icon-radius]')){this.iconsDraft.radius=Math.max(cfg.radiusMin,Math.min(cfg.radiusMax,Number(element.value)));this.rangeProgress(element,cfg.radiusMin,cfg.radiusMax,this.iconsDraft.radius);const output=this.iconsRoot.querySelector('[data-icon-radius-value]');if(output)output.textContent=`${Math.round(this.iconsDraft.radius)}px`;this.applyIconStyle();return}if(element.matches('[data-icon-color]')){this.iconsDraft.iconColor=APP.editor.colorValue(element.value,cfg.defaultIconColor);this.applyIconStyle();return}if(element.matches('[data-icon-shell-color]')){this.iconsDraft.shellColor=APP.editor.colorValue(element.value,cfg.defaultShellColor);this.applyIconStyle()}})
      },
      async init(prefetched=null){
        this.wallpaperRoot=document.getElementById('wallpaperApp');this.iconsRoot=document.getElementById('iconsApp');this.lockRoot=document.getElementById('lockSettingsApp');this.captureDefaultIcons();this.renderIconGrid();
        let wallpaper,lockWallpaper,icons,lockScreen;if(prefetched){wallpaper=prefetched.wallpaper;lockWallpaper=prefetched.lockWallpaper;icons=prefetched.icons;lockScreen=prefetched.lockScreen}else [wallpaper,lockWallpaper,icons,lockScreen]=await Promise.all([APP.store.getSetting(APP.config.theme.wallpaper.settingKey),APP.store.getSetting(APP.config.theme.lockWallpaper.settingKey),APP.store.getSetting(APP.config.theme.icons.settingKey),APP.store.getSetting(APP.config.theme.lockScreen.settingKey)]);
        const legacyLockMedia=lockScreen?.wallpaper;if(!lockWallpaper&&legacyLockMedia&&typeof legacyLockMedia==='object'&&(legacyLockMedia.assetId||legacyLockMedia.sourceType&&legacyLockMedia.sourceType!=='none')){lockWallpaper=this.normalizeLockWallpaper({image:legacyLockMedia});await APP.store.replaceSetting(APP.config.theme.lockWallpaper.settingKey,lockWallpaper)}
        this.wallpaperSaved=this.normalizeWallpaper(wallpaper);this.wallpaperDraft=this.clone(this.wallpaperSaved);this.lockWallpaperSaved=this.normalizeLockWallpaper(lockWallpaper);this.lockWallpaperDraft=this.clone(this.lockWallpaperSaved);this.iconsSaved=this.normalizeIcons(icons);this.iconsDraft=this.clone(this.iconsSaved);this.lockSaved=this.normalizeLockScreen(lockScreen);this.lockDraft=this.clone(this.lockSaved);APP.state.theme.wallpaper=this.clone(this.wallpaperSaved);APP.state.theme.lockWallpaper=this.clone(this.lockWallpaperSaved);APP.state.theme.icons=this.clone(this.iconsSaved);APP.state.theme.lockScreen=this.clone(this.lockSaved);
        await Promise.all([this.applyWallpaper(),this.applyLockWallpaper(),this.applyIcons()]);this.paintLockSettings();APP.lockScreen.configure({initial:true});this.bind()
      }
    },
    rosterPage:{
      root:null,editorRoot:null,memoryRoot:null,bound:false,saving:false,renderConsumers:new Set(),previewConsumers:new Set(),dirtyMedia:new Set(),relationView:{x:0,y:0,scale:1,pointers:new Map(),gesture:null,suppressClick:false},
      get cfg(){return APP.config.roster},get ui(){return this.cfg.ui},get settingKey(){return this.cfg.settingKey},get relationSettingKey(){return this.cfg.relationSettingKey},get relationUI(){return this.ui.relations},
      tabs(){return this.ui.tabs},profileTabs(){return this.tabs().filter(tab=>tab.editable)},tab(id){return this.tabs().find(tab=>tab.id===id)||null},fieldDefs(){return this.ui.editor.fields},mediaDefs(){return this.ui.editor.media},
      emptyMedia(){return {assetId:null,sourceType:'none',sourceValue:'',sourceLabel:''}},
      normalizeMedia(value){return value&&typeof value==='object'?{assetId:typeof value.assetId==='string'?value.assetId:null,sourceType:['local','url'].includes(value.sourceType)?value.sourceType:'none',sourceValue:String(value.sourceValue||''),sourceLabel:String(value.sourceLabel||'')}:this.emptyMedia()},
      randomDigits(count){const bytes=new Uint8Array(count);globalThis.crypto.getRandomValues(bytes);let out='';for(const byte of bytes)out+=String(byte%10);return out},
      generateId(type,used=new Set(APP.state.roster.items.map(item=>item.id))){const prefix=this.cfg.prefixes[type];if(!prefix)throw new Error('未知名册档案类型');for(let i=0;i<512;i++){const id=prefix+this.randomDigits(this.cfg.idDigits);if(!used.has(id)){used.add(id);return id}}throw new Error('名册档案 ID 生成冲突次数过多')},
      normalize(value){const list=Array.isArray(value)?value:[],validTypes=new Set(this.profileTabs().map(tab=>tab.id)),used=new Set();return list.map(raw=>{const type=validTypes.has(raw?.type)?raw.type:this.ui.defaultTab,prefix=this.cfg.prefixes[type],candidate=String(raw?.id||''),valid=new RegExp(`^${prefix}\\d{${this.cfg.idDigits}}$`).test(candidate)&&!used.has(candidate),id=valid?(used.add(candidate),candidate):this.generateId(type,used),item={id,type,createdAt:Number(raw?.createdAt)||Date.now(),updatedAt:Number(raw?.updatedAt)||Number(raw?.createdAt)||Date.now()};for(const media of this.mediaDefs())item[media.key]=this.normalizeMedia(raw?.[media.key]);for(const field of this.fieldDefs()){let text=String(raw?.[field.key]??'');if(field.kind!=='textarea'&&field.inputType!=='password')text=text.trim();if(Number.isInteger(field.maxLength)&&field.maxLength>0)text=text.slice(0,field.maxLength);item[field.key]=text}item.settingSource=this.normalizeSettingSource(raw?.settingSource,item.setting);return item})},
      normalizeSettingSource(source,setting){const allowed=new Set(this.ui.editor.importSource.types.map(option=>option.value)),type=String(source?.type||''),legacyValue=String(source?.value||'').trim().slice(0,300);return setting&&allowed.has(type)?{type,...(legacyValue?{value:legacyValue}:{}),fileName:String(source?.fileName||'').slice(0,180),importedAt:Number(source?.importedAt)||Date.now()}:null},
      label(type){return this.tab(type)?.label||'档案'},
      allProfiles(){return APP.state.roster.items||[]},
      normalizeRelations(value,profiles=APP.state.roster.items){
        const ids=new Set((profiles||[]).map(item=>item.id)),rows=Array.isArray(value)?value:[],pairs=new Map();
        for(const raw of rows){
          const sourceId=String(raw?.sourceId||''),targetId=String(raw?.targetId||'');
          if(!ids.has(sourceId)||!ids.has(targetId)||sourceId===targetId)continue;
          const sourceToTarget=String(raw?.sourceToTarget||'').trim().slice(0,48),targetToSource=String(raw?.targetToSource||'').trim().slice(0,48),note=String(raw?.note||'').trim().slice(0,360);
          if(!sourceToTarget&&!targetToSource&&!note)continue;
          const pairKey=[sourceId,targetId].sort().join('>'),createdAt=Number(raw?.createdAt)||Date.now(),updatedAt=Number(raw?.updatedAt)||createdAt,id=typeof raw?.id==='string'&&raw.id?raw.id:crypto.randomUUID(),item={type:'relation',id,sourceId,targetId,sourceToTarget,targetToSource,note,createdAt,updatedAt},prior=pairs.get(pairKey);
          if(!prior||item.updatedAt>=prior.updatedAt)pairs.set(pairKey,item)
        }
        return [...pairs.values()].sort((a,b)=>b.updatedAt-a.updatedAt||a.id.localeCompare(b.id))
      },
      relationPairKey(a,b){return [String(a||''),String(b||'')].sort().join('>')},
      relationById(id){return APP.state.roster.relations.find(item=>item.id===String(id||''))||null},
      relationBetween(a,b){const key=this.relationPairKey(a,b);return APP.state.roster.relations.find(item=>this.relationPairKey(item.sourceId,item.targetId)===key)||null},
      relationsFor(id){const target=String(id||'');return APP.state.roster.relations.filter(item=>item.sourceId===target||item.targetId===target)},
      otherId(relation,id){return relation.sourceId===id?relation.targetId:relation.targetId===id?relation.sourceId:null},
      relationTerm(relation,fromId,toId){if(!relation)return'';if(relation.sourceId===fromId&&relation.targetId===toId)return relation.sourceToTarget;if(relation.targetId===fromId&&relation.sourceId===toId)return relation.targetToSource;return''},
      relationSummaryBetween(a,b){const relation=this.relationBetween(a,b);if(!relation)return'';const forward=this.relationTerm(relation,a,b),reverse=this.relationTerm(relation,b,a);if(forward&&reverse)return forward===reverse?forward:`${forward} ${this.relationUI.pairSeparator} ${reverse}`;if(forward)return forward;if(reverse)return `${this.relationUI.reverseLabel}：${reverse}`;return this.relationUI.summaryFallback},
      relationContext(ownerId,profileId){
        const focus=new Set([String(ownerId||''),String(profileId||'')]);
        return APP.state.roster.relations.filter(item=>focus.has(item.sourceId)||focus.has(item.targetId)).map(item=>({type:'relationship',id:item.id,sourceId:item.sourceId,targetId:item.targetId,sourceToTarget:item.sourceToTarget,targetToSource:item.targetToSource,note:item.note}))
      },
      resolveRelationFocus(preferred=APP.state.roster.relationFocusId){
        const profiles=this.allProfiles(),requested=String(preferred||'');if(profiles.some(item=>item.id===requested))return requested;
        const owner=APP.state.communication.ownerId;if(owner&&profiles.some(item=>item.id===owner))return owner;
        return profiles.find(item=>item.type==='userid')?.id||profiles[0]?.id||null
      },
      setRelationFocus(id){const next=this.resolveRelationFocus(id);APP.state.roster.relationFocusId=next;if(APP.state.roster.activeTab==='relations')this.render();return next},
      relationProfileOptions(){return this.allProfiles().map(item=>({value:item.id,label:`${item.nickname||item.name||'未命名档案'} · ${this.label(item.type)}`}))},
      async persistRelations(next,message=this.relationUI.messages.saved){
        const normalized=this.normalizeRelations(next);await APP.store.replaceSetting(this.relationSettingKey,normalized);APP.state.roster.relations=normalized;if(APP.state.roster.activeTab==='relations')this.render();if(APP.featureRuntime.initialized.has('message'))APP.messagePage.renderDirectory();APP.guide.show(message);return true
      },
      async editRelation(id=null,preset={}){
        if(APP.modal.isOpen())return false;const existing=id?this.relationById(id):null,profiles=this.allProfiles();if(profiles.length<2){APP.guide.show(this.relationUI.messages.needProfiles);return false}
        const focus=this.resolveRelationFocus(preset.sourceId),sourceId=existing?.sourceId||preset.sourceId||focus||profiles[0].id,targetId=existing?.targetId||preset.targetId||profiles.find(item=>item.id!==sourceId)?.id||'',options=this.relationProfileOptions();
        const result=await APP.modal.form({title:existing?this.relationUI.editLabel:this.relationUI.addLabel,subtitle:this.relationUI.modalSubtitle,confirmLabel:this.relationUI.saveLabel,fields:[
          {key:'sourceId',type:'select',label:this.relationUI.sourceLabel,value:sourceId,options,required:true},
          {key:'targetId',type:'select',label:this.relationUI.targetLabel,value:targetId,options,required:true},
          {key:'sourceToTarget',type:'text',label:this.relationUI.sourceRelationLabel,value:existing?.sourceToTarget||'',placeholder:this.relationUI.relationPlaceholder,maxLength:48},
          {key:'targetToSource',type:'text',label:this.relationUI.targetRelationLabel,value:existing?.targetToSource||'',placeholder:this.relationUI.relationPlaceholder,maxLength:48},
          {key:'note',type:'textarea',label:this.relationUI.noteLabel,value:existing?.note||'',placeholder:this.relationUI.notePlaceholder,maxLength:360}
        ]},values=>{
          if(values.sourceId===values.targetId)return{field:'targetId',message:this.relationUI.messages.sameProfile};
          const duplicate=APP.state.roster.relations.find(row=>row.id!==existing?.id&&this.relationPairKey(row.sourceId,row.targetId)===this.relationPairKey(values.sourceId,values.targetId));if(duplicate)return{field:'targetId',message:this.relationUI.messages.duplicate};
          if(!String(values.sourceToTarget||'').trim()&&!String(values.targetToSource||'').trim()&&!String(values.note||'').trim())return{field:'sourceToTarget',message:this.relationUI.messages.empty};return null
        });
        if(!result)return false;const now=Date.now(),row={type:'relation',id:existing?.id||crypto.randomUUID(),sourceId:result.sourceId,targetId:result.targetId,sourceToTarget:String(result.sourceToTarget||'').trim().slice(0,48),targetToSource:String(result.targetToSource||'').trim().slice(0,48),note:String(result.note||'').trim().slice(0,360),createdAt:existing?.createdAt||now,updatedAt:now},next=APP.state.roster.relations.filter(item=>item.id!==row.id);next.unshift(row);APP.state.roster.relationFocusId=row.sourceId;return this.persistRelations(next)
      },
      async removeRelation(id){const relation=this.relationById(id);if(!relation)return false;const ok=await APP.modal.confirm(this.relationUI.deleteConfirm);if(!ok)return false;return this.persistRelations(APP.state.roster.relations.filter(item=>item.id!==id),this.relationUI.messages.deleted)},
      resetRelationView(){const view=this.relationView;view.x=0;view.y=0;view.scale=1;view.pointers.clear();view.gesture=null;view.suppressClick=false},
      applyRelationView(stage){
        if(!stage?.isConnected)return;const view=this.relationView,world=stage.querySelector('[data-relation-world]');if(!world)return;world.style.transform=`translate3d(${view.x}px,${view.y}px,0) scale(${view.scale})`;
        const unit=Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--editor-u'))||1,step=Math.max(4,20*unit*view.scale);stage.style.backgroundSize=`${step}px ${step}px`;stage.style.backgroundPosition=`calc(50% + ${view.x}px) calc(50% + ${view.y}px)`
      },
      bindRelationView(stage){
        if(!stage)return;const view=this.relationView,clamp=value=>Math.max(.35,Math.min(3.2,value)),point=event=>({x:event.clientX,y:event.clientY});
        const beginPinch=()=>{const values=[...view.pointers.values()];if(values.length<2)return;const a=values[0],b=values[1],rect=stage.getBoundingClientRect(),cx=(a.x+b.x)/2,cy=(a.y+b.y)/2,distance=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y));view.gesture={kind:'pinch',distance,scale:view.scale,worldX:(cx-rect.left-rect.width/2-view.x)/view.scale,worldY:(cy-rect.top-rect.height/2-view.y)/view.scale,moved:false}},apply=()=>this.applyRelationView(stage);
        stage.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'&&event.button!==0)return;stage.setPointerCapture?.(event.pointerId);view.pointers.set(event.pointerId,point(event));view.suppressClick=false;if(view.pointers.size===1)view.gesture={kind:'pan',pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,x:view.x,y:view.y,moved:false};else beginPinch()});
        stage.addEventListener('pointermove',event=>{if(!view.pointers.has(event.pointerId))return;view.pointers.set(event.pointerId,point(event));if(view.pointers.size>=2){if(view.gesture?.kind!=='pinch')beginPinch();const values=[...view.pointers.values()],a=values[0],b=values[1],rect=stage.getBoundingClientRect(),cx=(a.x+b.x)/2,cy=(a.y+b.y)/2,distance=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y)),next=clamp(view.gesture.scale*(distance/view.gesture.distance));view.x=cx-rect.left-rect.width/2-view.gesture.worldX*next;view.y=cy-rect.top-rect.height/2-view.gesture.worldY*next;view.scale=next;view.gesture.moved=true;apply();return}const gesture=view.gesture;if(!gesture||gesture.kind!=='pan'||gesture.pointerId!==event.pointerId)return;const dx=event.clientX-gesture.startX,dy=event.clientY-gesture.startY;if(Math.hypot(dx,dy)>4)gesture.moved=true;view.x=gesture.x+dx;view.y=gesture.y+dy;apply()});
        const end=event=>{if(!view.pointers.has(event.pointerId))return;const moved=Boolean(view.gesture?.moved);view.pointers.delete(event.pointerId);if(moved){view.suppressClick=true;setTimeout(()=>{view.suppressClick=false},0)}if(view.pointers.size>=2)beginPinch();else if(view.pointers.size===1){const [pointerId,p]=view.pointers.entries().next().value;view.gesture={kind:'pan',pointerId,startX:p.x,startY:p.y,x:view.x,y:view.y,moved:false}}else view.gesture=null};
        stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);stage.addEventListener('lostpointercapture',event=>{if(view.pointers.has(event.pointerId))end(event)});
        stage.addEventListener('wheel',event=>{event.preventDefault();const rect=stage.getBoundingClientRect(),old=view.scale,next=clamp(old*Math.exp(-event.deltaY*.0015));if(next===old)return;const px=event.clientX-rect.left-rect.width/2,py=event.clientY-rect.top-rect.height/2,wx=(px-view.x)/old,wy=(py-view.y)/old;view.scale=next;view.x=px-wx*next;view.y=py-wy*next;apply()},{passive:false});
        apply()
      },
      relationGraphLayout(profiles,relations,focusId){
        const ids=new Set(profiles.map(item=>item.id)),adjacency=new Map(profiles.map(item=>[item.id,new Set()]));for(const relation of relations){if(!ids.has(relation.sourceId)||!ids.has(relation.targetId))continue;adjacency.get(relation.sourceId).add(relation.targetId);adjacency.get(relation.targetId).add(relation.sourceId)}
        const distance=new Map([[focusId,0]]),queue=[focusId];for(let cursor=0;cursor<queue.length;cursor++){const id=queue[cursor],depth=distance.get(id);for(const next of adjacency.get(id)||[]){if(distance.has(next))continue;distance.set(next,depth+1);queue.push(next)}}const maxDepth=Math.max(0,...distance.values()),groups=new Map();for(const item of profiles){if(item.id===focusId)continue;const depth=distance.get(item.id)??maxDepth+1;if(!groups.has(depth))groups.set(depth,[]);groups.get(depth).push(item)}
        const positions=new Map([[focusId,{x:0,y:0}]]);let ring=0;for(const depth of [...groups.keys()].sort((a,b)=>a-b)){const items=groups.get(depth).sort((a,b)=>String(a.nickname||a.name||a.id).localeCompare(String(b.nickname||b.name||b.id),'zh-Hans-CN'));for(let start=0;start<items.length;start+=10){const chunk=items.slice(start,start+10),radius=145+ring*125,offset=-Math.PI/2+(ring%2?Math.PI/Math.max(1,chunk.length):0);chunk.forEach((item,index)=>{const angle=offset+Math.PI*2*index/Math.max(1,chunk.length);positions.set(item.id,{x:Math.cos(angle)*radius,y:Math.sin(angle)*radius})});ring++}}
        return positions
      },
      renderRelations(list,plus){
        const profiles=this.allProfiles(),relations=APP.state.roster.relations,esc=APP.modal.esc;plus.hidden=profiles.length<2;plus.setAttribute('aria-label',this.relationUI.addLabel);if(!profiles.length){list.innerHTML=`<section class="roster-relation-stage" data-relation-canvas aria-label="${esc(this.relationUI.graphAriaLabel)}"><div class="roster-relation-canvas-empty">${esc(this.relationUI.emptyProfiles)}</div></section>`;this.bindRelationView(list.querySelector('[data-relation-canvas]'));return}
        const focusId=this.resolveRelationFocus();APP.state.roster.relationFocusId=focusId;const positions=this.relationGraphLayout(profiles,relations,focusId),edges=relations.map(relation=>{const a=positions.get(relation.sourceId),b=positions.get(relation.targetId);if(!a||!b)return'';const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)*180/Math.PI;return `<span class="roster-relation-edge" aria-hidden="true" style="left:calc(${a.x.toFixed(2)} * var(--editor-u));top:calc(${a.y.toFixed(2)} * var(--editor-u));width:calc(${length.toFixed(2)} * var(--editor-u));transform:rotate(${angle.toFixed(2)}deg)"></span>`}).join(''),nodes=profiles.map(item=>{const pos=positions.get(item.id)||{x:0,y:0},isFocus=item.id===focusId,relation=isFocus?null:this.relationBetween(focusId,item.id),caption=isFocus?this.relationUI.centerLabel:(relation?(this.relationTerm(relation,focusId,item.id)||this.relationUI.unknownLabel):this.label(item.type));return `<button class="roster-relation-node${isFocus?' is-focus':''}" type="button" data-relation-person-id="${esc(item.id)}" style="left:calc(${pos.x.toFixed(2)} * var(--editor-u));top:calc(${pos.y.toFixed(2)} * var(--editor-u))"><span class="roster-relation-node-avatar" data-roster-avatar-id="${esc(item.id)}"><i class="fa-solid fa-user" aria-hidden="true"></i></span><strong>${esc(item.nickname||item.name||'未命名')}</strong><small>${esc(caption)}</small></button>`}).join('');
        list.innerHTML=`<section class="roster-relation-stage" data-relation-canvas aria-label="${esc(this.relationUI.graphAriaLabel)}"><div class="roster-relation-world" data-relation-world>${edges}${nodes}</div></section>`;const stage=list.querySelector('[data-relation-canvas]');this.bindRelationView(stage);[...list.querySelectorAll('[data-roster-avatar-id]')].forEach((node,index)=>{const item=profiles.find(row=>row.id===node.dataset.rosterAvatarId);if(item)void this.paintAvatar(item,node,`roster:relations:${item.id}:${index}`)})
      },
      renderFields(){
        const esc=APP.modal.esc,fields=this.fieldDefs();
        const render=field=>{
          const req=field.required?' required':'',mode=field.inputMode?` inputmode="${esc(field.inputMode)}"`:'',ph=field.placeholder?` placeholder="${esc(field.placeholder)}"`:'',mark=field.required?` <em class="roster-required">${esc(this.ui.editor.requiredMark)}</em>`:'';
          if(field.kind==='textarea')return `<div class="editor-field roster-setting-field"><div class="roster-setting-head"><label class="editor-field-label" for="rosterSettingText">${esc(field.label)}${mark}</label><button class="roster-import-button" data-roster-import type="button">导入/가져오기</button></div><textarea id="rosterSettingText" class="editor-textarea roster-setting-input" data-roster-field="${esc(field.key)}"${Number.isInteger(field.maxLength)?` maxlength="${field.maxLength}"`:``}${req}${ph}></textarea><span class="roster-source-note" data-roster-source-note hidden></span><input class="roster-import-input" data-roster-import-input type="file" accept=".docx,.doc,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain" aria-label="导入设定内容文档" hidden></div>`;
          const inputType=field.inputType||'text';
          return `<label class="editor-field"><span class="editor-field-label">${esc(field.label)}${mark}</span><input class="editor-input" type="${esc(inputType)}" data-roster-field="${esc(field.key)}" maxlength="${field.maxLength}"${req}${mode}${ph} autocomplete="off" spellcheck="false"></label>`
        };
        const parts=[];
        for(let index=0;index<fields.length;index++){
          const field=fields[index];
          if(field.layoutGroup){parts.push(`<div class="roster-field-row" data-roster-field-row="${esc(field.layoutGroup)}">${render(field)}${render(fields[++index])}</div>`)}
          else parts.push(render(field))
        }
        return parts.join('')
      },
      mount(){
        const esc=APP.modal.esc,solid=icon=>`<i class="fa-solid ${esc(icon)}" aria-hidden="true"></i>`,back=(label,attribute)=>`<button ${attribute} aria-label="${esc(label)}" class="global-page-back" type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M11 7l-5 5 5 5"></path><path d="M18 7l-5 5 5 5"></path></svg></button>`,mainTabs=this.tabs().filter(tab=>!tab.detached),detached=this.tabs().filter(tab=>tab.detached),editor=this.ui.editor,defaultTab=this.tab(this.ui.defaultTab);
        this.root.setAttribute('aria-label',this.ui.title);this.editorRoot.setAttribute('aria-label',`${this.ui.editor.editVerb}${this.ui.title}档案`);if(this.memoryRoot)this.memoryRoot.setAttribute('aria-label',this.ui.memoryTitle);
        this.root.querySelector('[data-roster-mount]').innerHTML=`<header class="global-page-nav">${back(this.ui.backAriaLabel,'data-page-back')}${APP.pageHeading.markup(this.ui.title,this.ui.subtitle)}<button class="roster-plus" data-roster-add type="button" aria-label="${esc(this.ui.addAriaLabel)}">${solid('fa-plus')}</button></header><main class="roster-main"><div class="roster-deco" aria-hidden="true"><span>${esc(this.ui.decoration.left)}</span><b></b><span data-roster-deco-label></span></div><section class="roster-list" data-roster-list aria-live="polite"></section></main><nav class="roster-dock" aria-label="${esc(this.ui.title)}底部导航"><div class="roster-dock-main">${mainTabs.map(tab=>`<button class="roster-tab" data-roster-tab="${esc(tab.id)}" aria-selected="false" type="button" aria-label="${esc(tab.label)}">${solid(tab.icon)}<span>${esc(tab.label)}</span></button>`).join('')}</div>${detached.map(tab=>`<button class="roster-tab roster-tab-user" data-roster-tab="${esc(tab.id)}" aria-selected="false" type="button" aria-label="${esc(tab.label)}">${solid(tab.icon)}<span>${esc(tab.label)}</span></button>`).join('')}</nav>`;
        this.editorRoot.querySelector('[data-roster-editor-mount]').innerHTML=`<header class="global-page-nav">${back(this.ui.backAriaLabel,'data-roster-editor-back')}${APP.pageHeading.markup(`${editor.addVerb}${defaultTab?.label||'档案'}`,`${defaultTab?.subtitle||defaultTab?.label||'档案'} ${editor.addSubtitleVerb}`,'data-roster-editor-title','data-roster-editor-subtitle')}<button class="roster-save" data-roster-save type="button">${esc(editor.saveLabel)}</button></header><main class="roster-editor-scroll"><div class="roster-deco" aria-hidden="true"><span>${esc(this.ui.decoration.left)}</span><b></b><span>${esc(this.ui.decoration.editor)}</span></div>${this.mediaDefs().map(media=>`<section class="editor-media" data-roster-media-section="${esc(media.key)}"><div class="editor-media-label">${esc(media.label)}</div><div class="editor-media-row"><div class="ui-media-surface editor-preview" data-roster-preview="${esc(media.key)}" aria-label="${esc(media.label)}预览"></div><div class="editor-media-controls"><input class="editor-input" data-roster-media-url="${esc(media.key)}" value="" placeholder="图片 URL / 이미지 URL" inputmode="url" autocomplete="off" spellcheck="false" aria-label="${esc(media.label)} URL">${APP.editor.uploadButton(`data-roster-media="${esc(media.key)}"`)}</div></div></section>`).join('')}<form class="editor-fields" data-roster-form>${this.renderFields()}</form><footer class="roster-editor-footer" data-roster-editor-footer hidden><button class="editor-action roster-delete" data-roster-delete type="button">${esc(editor.deleteLabel)}</button></footer></main>`;
        if(this.memoryRoot)APP.memoryPage.mount(this.memoryRoot);APP.pageHeading.audit(this.root);APP.pageHeading.audit(this.editorRoot);APP.pageHeading.audit(this.memoryRoot)
      },
      releaseRender(){for(const consumer of this.renderConsumers)APP.images.releaseConsumer(consumer);this.renderConsumers.clear()},
      releasePreview(){for(const consumer of this.previewConsumers)APP.images.releaseConsumer(consumer);this.previewConsumers.clear()},
      async paintAvatar(item,node,consumer=`roster:list:${item.id}`){this.renderConsumers.add(consumer);await APP.images.present(item.avatar?.assetId,consumer,url=>{if(!node.isConnected)return;node.style.backgroundImage=url?`url("${url.replace(/"/g,'\\"')}")`:'';node.innerHTML=url?'':'<i class="fa-solid fa-user"></i>'})},
      render(){if(!this.root)return;const tab=APP.state.roster.activeTab,definition=this.tab(tab),list=this.root.querySelector('[data-roster-list]'),plus=this.root.querySelector('[data-roster-add]'),deco=this.root.querySelector('[data-roster-deco-label]'),relationMode=tab==='relations';this.root.classList.toggle('roster-relations-mode',relationMode);this.root.querySelectorAll('[data-roster-tab]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.rosterTab===tab)));plus.hidden=!(definition?.editable||relationMode);plus.setAttribute('aria-label',relationMode?this.relationUI.addLabel:this.ui.addAriaLabel);if(deco)deco.textContent=definition?.fileLabel||this.ui.decoration.relations;this.releaseRender();if(relationMode){this.renderRelations(list,plus);return}if(!definition?.editable){list.innerHTML=`<div class="roster-empty">${APP.modal.esc(this.ui.emptyLabel)}</div>`;return}const items=APP.state.roster.items.filter(item=>item.type===tab);if(!items.length){list.innerHTML=`<div class="roster-empty">${APP.modal.esc(this.ui.emptyLabel)}</div>`;return}const groups=new Map();for(const item of items){const key=item.group||this.ui.ungroupedLabel;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item)}list.innerHTML=[...groups].map(([group,rows])=>`<section class="roster-group"><div class="roster-group-title">${APP.modal.esc(group)}</div>${rows.map(item=>{const date=new Date(item.createdAt),md=`${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`;return `<button class="roster-card" data-roster-id="${APP.modal.esc(item.id)}" type="button"><span class="ui-media-surface roster-avatar" data-roster-avatar="${APP.modal.esc(item.id)}"><i class="fa-solid fa-user"></i></span><span class="roster-copy"><span class="roster-name">${APP.modal.esc(item.nickname)}</span><span class="roster-signature">${APP.modal.esc(item.signature||'')}</span></span><time class="roster-date">${md}</time></button>`}).join('')}</section>`).join('');for(const item of items){const node=list.querySelector(`[data-roster-avatar="${CSS.escape(item.id)}"]`);if(node)void this.paintAvatar(item,node)}},
      blank(type){const item={id:'',type,createdAt:Date.now(),updatedAt:Date.now(),settingSource:null};for(const media of this.mediaDefs())item[media.key]=this.emptyMedia();for(const field of this.fieldDefs())item[field.key]='';return item},
      openEditor(type,id=null){if(this.saving||!this.tab(type)?.editable)return;const existing=id?APP.state.roster.items.find(item=>item.id===id):null;this.releasePreview();this.dirtyMedia.clear();APP.state.roster.editingId=existing?.id||null;APP.state.roster.draft=structuredClone(existing||this.blank(type));APP.state.roster.pendingAssets=new Set();this.paintEditor();APP.pageManager.open('roster-editor',{appId:'roster'})},
      field(name){return this.editorRoot?.querySelector(`[data-roster-field="${name}"]`)||null},
      setEditorBusy(busy){this.saving=Boolean(busy);if(!this.editorRoot)return;this.editorRoot.querySelectorAll('[data-roster-save],[data-roster-delete],[data-roster-editor-back],[data-roster-media],[data-roster-media-url],[data-roster-field],[data-roster-import]').forEach(node=>{node.disabled=this.saving});const save=this.editorRoot.querySelector('[data-roster-save]');if(save)save.textContent=this.saving?'保存中…':this.ui.editor.saveLabel},
      paintSettingSource(source=APP.state.roster.draft?.settingSource){const node=this.editorRoot?.querySelector('[data-roster-source-note]');if(!node)return;const type=this.ui.editor.importSource.types.find(option=>option.value===source?.type);node.hidden=!type;node.textContent=node.hidden?'':`${this.ui.editor.importSource.summaryLabel}：${type.label}${source.value?' · '+source.value:''}`},
      async importSetting(file){const draft=APP.state.roster.draft,input=this.field('setting'),button=this.editorRoot?.querySelector('[data-roster-import]');if(!draft||!input||!file||this.saving)return;button.disabled=true;try{const value=await window.APP_DocumentImport.parse(file);if(APP.state.roster.draft!==draft||!input.isConnected)return;const cfg=this.ui.editor.importSource,answer=await APP.modal.form({title:cfg.title,subtitle:cfg.subtitle,confirmLabel:cfg.confirmLabel,fields:[{key:'type',type:'select',label:cfg.typeLabel,value:'',options:[{value:'',label:cfg.selectPlaceholder},...cfg.types],required:true,requiredMessage:cfg.sourceRequired}]});if(!answer||APP.state.roster.draft!==draft||!input.isConnected)return;if(!cfg.types.some(option=>option.value===answer.type))throw new Error(cfg.sourceRequired);input.value=value;draft.setting=value;draft.settingSource={type:answer.type,fileName:file.name.slice(0,180),importedAt:Date.now()};this.paintSettingSource(draft.settingSource);APP.guide.show('文档正文与来源已导入，保存档案后生效。')}catch(error){APP.guide.show(error?.message||'文档导入失败')}finally{button.disabled=this.saving}},
      paintEditor(){const d=APP.state.roster.draft;if(!this.editorRoot||!d)return;this.setEditorBusy(false);const editing=Boolean(APP.state.roster.editingId),definition=this.tab(d.type);APP.pageHeading.set(this.editorRoot,`${editing?this.ui.editor.editVerb:this.ui.editor.addVerb}${this.label(d.type)}`,`${definition?.subtitle||this.label(d.type)} ${editing?this.ui.editor.editSubtitleVerb:this.ui.editor.addSubtitleVerb}`);const footer=this.editorRoot.querySelector('[data-roster-editor-footer]');if(footer)footer.hidden=!editing;for(const field of this.fieldDefs()){const input=this.field(field.key);if(input)input.value=d[field.key]||''}for(const key of ['account','password'])this.field(key).required=d.type===APP.config.auth.rosterType;this.paintSettingSource(d.settingSource);for(const media of this.mediaDefs())void this.paintPreview(media.key);this.editorRoot.querySelector('.roster-editor-scroll')?.scrollTo({top:0,left:0,behavior:'auto'})},
      async paintPreview(key){const d=APP.state.roster.draft,node=this.editorRoot?.querySelector(`[data-roster-preview="${key}"]`),input=this.editorRoot?.querySelector(`[data-roster-media-url="${key}"]`),media=this.mediaDefs().find(item=>item.key===key);if(!d||!node||!input||!media)return;const consumer=`roster:editor:${key}`;this.previewConsumers.add(consumer);await APP.images.present(d[key]?.assetId,consumer,url=>{if(APP.state.roster.draft!==d||!node.isConnected)return;node.style.backgroundImage=url?`url("${url.replace(/"/g,'\\"')}")`:'none'});if(APP.state.roster.draft!==d||!input.isConnected)return;input.value=d[key]?.sourceType==='url'?(d[key].sourceValue||''):d[key]?.sourceType==='local'?(d[key].sourceLabel||'本地文件'):'';input.dataset.sourceMode=d[key]?.sourceType||'none'},
      async acceptMediaAsset(key,asset,d=APP.state.roster.draft){if(!asset)return false;if(!d||APP.state.roster.draft!==d){await APP.images.discard(asset.assetId);return false}const previous=d[key]?.assetId,discardPrevious=previous&&APP.state.roster.pendingAssets.has(previous)&&previous!==asset.assetId;d[key]=asset;APP.state.roster.pendingAssets.add(asset.assetId);this.dirtyMedia.delete(key);await this.paintPreview(key);if(discardPrevious){APP.state.roster.pendingAssets.delete(previous);await APP.images.discard(previous)}return true},
      pickMedia(key){const d=APP.state.roster.draft,media=this.mediaDefs().find(item=>item.key===key);if(this.saving||!d||!media)return;APP.images.chooseLocal({target:`roster:${key}:${Date.now()}`,strategy:media.strategy,onReady:asset=>void this.acceptMediaAsset(key,asset,d),onError:error=>APP.guide.show(error?.message||this.ui.messages.imageFailed)})},
      showMediaError(key,error){const input=this.editorRoot?.querySelector(`[data-roster-media-url="${key}"]`);if(!input)return;input.setCustomValidity(error?.message||this.ui.messages.imageFailed);input.reportValidity();input.addEventListener('input',()=>input.setCustomValidity(''),{once:true})},
      async resolveMediaInput(key){const d=APP.state.roster.draft;if(!d||!this.dirtyMedia.has(key))return true;const input=this.editorRoot?.querySelector(`[data-roster-media-url="${key}"]`),media=this.mediaDefs().find(item=>item.key===key);if(!input||!media)return true;const value=input.value.trim();if(d[key]?.sourceType==='url'&&value===d[key].sourceValue){this.dirtyMedia.delete(key);return true}if(!value){const previous=d[key]?.assetId,discardPrevious=previous&&APP.state.roster.pendingAssets.has(previous);d[key]=this.emptyMedia();this.dirtyMedia.delete(key);await this.paintPreview(key);if(discardPrevious){APP.state.roster.pendingAssets.delete(previous);await APP.images.discard(previous)}return true}try{const asset=await APP.images.ingestURL({target:`roster:${key}:url:${Date.now()}`,url:value,strategy:media.strategy});return asset?await this.acceptMediaAsset(key,asset,d):false}catch(error){this.showMediaError(key,error);return false}},
      async resolveDirtyMedia(){for(const key of [...this.dirtyMedia])if(!await this.resolveMediaInput(key))return false;return true},
      readDraft(){const source=APP.state.roster.draft;if(!source)return null;const d=structuredClone(source);for(const field of this.fieldDefs()){let value=String(this.field(field.key)?.value??'');if(field.kind!=='textarea'&&field.inputType!=='password')value=value.trim();d[field.key]=Number.isInteger(field.maxLength)?value.slice(0,field.maxLength):value}d.updatedAt=Date.now();return d},
      async save(){if(this.saving)return;this.setEditorBusy(true);try{if(!await this.resolveDirtyMedia())return;const form=this.editorRoot?.querySelector('[data-roster-form]');if(!form?.reportValidity())return;const draft=this.readDraft();if(!draft)return;const required=this.fieldDefs().find(field=>field.required&&!draft[field.key]);if(required){this.field(required.key)?.focus();return}const editingId=APP.state.roster.editingId,old=editingId?APP.state.roster.items.find(item=>item.id===editingId):null;if(draft.account&&APP.state.roster.items.some(item=>item.id!==editingId&&item.account&&APP.auth.normalizeUsername(item.account)===APP.auth.normalizeUsername(draft.account))){const input=this.field('account');input.setCustomValidity('账号已存在：角色、路人、用户不可重复');input.reportValidity();input.addEventListener('input',()=>input.setCustomValidity(''),{once:true});return}if(editingId&&!old){APP.guide.show(this.ui.messages.saveFailed);return}if(old){draft.id=old.id;draft.type=old.type;draft.createdAt=old.createdAt}else draft.id=this.generateId(draft.type);const next=structuredClone(APP.state.roster.items),i=next.findIndex(item=>item.id===editingId);if(i>=0)next.splice(i,1,draft);else next.unshift(draft);const replacements=this.mediaDefs().map(media=>({oldId:old?.[media.key]?.assetId||null,nextId:draft[media.key]?.assetId||null}));const normalizedNext=this.normalize(next),normalizedRelations=this.normalizeRelations(APP.state.roster.relations,normalizedNext);await APP.images.commitRosterState(normalizedNext,normalizedRelations,replacements);APP.state.roster.items=normalizedNext;APP.state.roster.relations=normalizedRelations;await APP.auth.syncRoster(old,APP.state.roster.items.find(item=>item.id===draft.id));APP.state.roster.pendingAssets.clear();this.dirtyMedia.clear();this.releasePreview();APP.state.roster.editingId=null;APP.state.roster.draft=null;APP.pageManager.open('roster',{appId:'roster'});this.render();APP.communicationDirectory?.refresh?.();APP.memoryPage.refresh();APP.guide.show(this.ui.messages.saved)}catch(error){APP.runtime.report(error,'名册保存');APP.guide.show(this.ui.messages.saveFailed)}finally{this.setEditorBusy(false)}},
      async discardPending(){const pending=[...APP.state.roster.pendingAssets];APP.state.roster.pendingAssets.clear();this.dirtyMedia.clear();for(const id of pending)await APP.images.discard(id);this.releasePreview()},
      async closeEditor(){if(this.saving)return false;const draft=APP.state.roster.draft;if(!draft)return false;APP.state.roster.draft=null;APP.state.roster.editingId=null;await this.discardPending();APP.pageManager.open('roster',{appId:'roster'});this.render();return true},
      async remove(){if(this.saving)return;const id=APP.state.roster.editingId,item=APP.state.roster.items.find(row=>row.id===id);if(!item)return;const confirmed=await APP.modal.confirm(this.ui.deleteConfirm);if(!confirmed||this.saving)return;const next=APP.state.roster.items.filter(row=>row.id!==id),replacements=this.mediaDefs().map(media=>({oldId:item[media.key]?.assetId||null,nextId:null}));this.setEditorBusy(true);try{const normalizedNext=this.normalize(next),normalizedRelations=this.normalizeRelations(APP.state.roster.relations,normalizedNext);await APP.images.commitRosterState(normalizedNext,normalizedRelations,replacements);APP.state.roster.items=normalizedNext;APP.state.roster.relations=normalizedRelations;APP.state.roster.relationFocusId=this.resolveRelationFocus(APP.state.roster.relationFocusId===id?null:APP.state.roster.relationFocusId);await APP.auth.syncRoster(item,null);await this.discardPending();APP.state.roster.editingId=null;APP.state.roster.draft=null;APP.pageManager.open('roster',{appId:'roster'});this.render();APP.communicationDirectory?.refresh?.();APP.memoryPage.refresh();APP.guide.show(this.ui.messages.deleted)}catch(error){APP.runtime.report(error,'名册删除');APP.guide.show(this.ui.messages.deleteFailed)}finally{this.setEditorBusy(false)}},
      bind(){if(this.bound)return;this.bound=true;this.editorRoot.querySelector('[data-roster-form]')?.addEventListener('submit',event=>{event.preventDefault();void this.save()});this.root.addEventListener('click',event=>{const tab=event.target.closest('[data-roster-tab]');if(tab){APP.state.roster.activeTab=tab.dataset.rosterTab;this.render();return}if(event.target.closest('[data-roster-add]')){if(APP.state.roster.activeTab==='relations')void this.editRelation(null,{sourceId:this.resolveRelationFocus()});else this.openEditor(APP.state.roster.activeTab);return}const person=event.target.closest('[data-relation-person-id]');if(person){event.preventDefault();if(this.relationView.suppressClick)return;APP.state.roster.relationFocusId=this.resolveRelationFocus(person.dataset.relationPersonId);this.resetRelationView();this.render();return}const card=event.target.closest('[data-roster-id]');if(card){const item=APP.state.roster.items.find(row=>row.id===card.dataset.rosterId);if(item)this.openEditor(item.type,item.id)}});this.editorRoot.addEventListener('click',event=>{if(event.target.closest('[data-roster-editor-back]')){event.preventDefault();void this.closeEditor();return}if(event.target.closest('[data-roster-save]')){event.preventDefault();void this.save();return}if(event.target.closest('[data-roster-delete]')){event.preventDefault();void this.remove();return}if(event.target.closest('[data-roster-import]')){event.preventDefault();if(!this.saving)this.editorRoot.querySelector('[data-roster-import-input]')?.click();return}const media=event.target.closest('[data-roster-media]');if(media){event.preventDefault();this.pickMedia(media.dataset.rosterMedia)}});this.editorRoot.addEventListener('input',event=>{if(event.isTrusted&&event.target.matches?.('[data-roster-field="setting"]')){const draft=APP.state.roster.draft;if(draft){draft.settingSource=null;this.paintSettingSource(null)}}const input=event.target.closest?.('[data-roster-media-url]');if(!input||this.saving)return;this.dirtyMedia.add(input.dataset.rosterMediaUrl);input.dataset.sourceMode='url'});this.editorRoot.addEventListener('change',event=>{const target=event.target;if(target.matches?.('[data-roster-import-input]')){const file=target.files?.[0];target.value='';if(file)void this.importSetting(file);return}const input=target.closest?.('[data-roster-media-url]');if(input&&!this.saving)void this.resolveMediaInput(input.dataset.rosterMediaUrl)})},
      async init(prefetched=undefined,prefetchedRelations=undefined){this.root=document.getElementById('rosterApp');this.editorRoot=document.getElementById('rosterEditorApp');this.memoryRoot=document.getElementById('memoryApp');if(!this.root||!this.editorRoot||!this.memoryRoot)throw new Error('名册页面结构不完整');this.mount();if(!this.tab(APP.state.roster.activeTab))APP.state.roster.activeTab=this.ui.defaultTab;const saved=prefetched===undefined?await APP.store.getSetting(this.settingKey):prefetched,normalized=this.normalize(saved);APP.state.roster.items=normalized;if(JSON.stringify(saved??[])!==JSON.stringify(normalized))await APP.store.replaceSetting(this.settingKey,normalized);const savedRelations=prefetchedRelations===undefined?await APP.store.getSetting(this.relationSettingKey):prefetchedRelations,normalizedRelations=this.normalizeRelations(savedRelations,normalized);APP.state.roster.relations=normalizedRelations;APP.state.roster.relationFocusId=this.resolveRelationFocus();if(JSON.stringify(savedRelations??[])!==JSON.stringify(normalizedRelations))await APP.store.replaceSetting(this.relationSettingKey,normalizedRelations);await APP.auth.reconcileRoster();this.bind();this.render();APP.memoryPage.refresh()}
    },
    store:{
      db:null,
      reconcileScheduled:false,
      async init(){
        await APP.runtime.ensureDexie();
        if(!window.Dexie)throw new Error('Dexie.js 未加载：本项目不提供 IndexedDB 原生或其他持久化兜底。');
        this.db=new Dexie(APP.config.database.name);
        this.db.version(APP.config.database.version).stores(APP.config.database.schema);
        this.db.on('blocked',()=>APP.runtime.report(new Error('IndexedDB 被其他标签页占用，请关闭同站点旧页面后重试'),'数据库'));
        await APP.runtime.withTimeout(this.db.open(),8000,'IndexedDB 打开超时（8 秒）')
      },
      async migrateNeutralStorageKeys(){
        const aliases=[
          [APP.config.auth.sessionKey,/^__[^:]+_auth_session__$/],
          [APP.config.auth.legacyClaimKey,/^__[^:]+_legacy_claim__$/],
          [APP.config.database.protocolKey,/^__[^:]+_protocol__$/]
        ];
        await this.db.transaction('rw',this.db.settings,async()=>{
          const rows=await this.db.settings.toArray();
          for(const [target,pattern] of aliases){
            if(rows.some(row=>row.key===target))continue;
            const source=rows.filter(row=>row.key!==target&&pattern.test(row.key)).sort((a,b)=>(Number(b.updatedAt)||0)-(Number(a.updatedAt)||0))[0];
            if(!source)continue;
            await this.db.settings.put({...source,key:target,updatedAt:Date.now()});
            await this.db.settings.delete(source.key)
          }
        })
      },
      async migrateRosterToShared(){
        const key=APP.config.roster.settingKey;
        await this.db.transaction('rw',this.db.settings,async()=>{
          const rows=await this.db.settings.toArray(),scoped=rows.filter(row=>/^account:chat:[0-9a-f-]{36}:rosterProfiles$/.test(row.key));
          if(!scoped.length)return;
          const global=rows.find(row=>row.key===key),merged=Array.isArray(global?.value)?structuredClone(global.value):[],used=new Map(merged.map(item=>[item.id,item]));
          for(const row of scoped){
            if(!Array.isArray(row.value))throw new Error('旧版账号名册格式无效，已保留原数据');
            const remapped=new Map();
            for(const original of row.value){
              const item=structuredClone(original),prior=used.get(item.id);
              if(prior&&JSON.stringify(prior)!==JSON.stringify(item)){
                const oldId=item.id,type=APP.config.roster.prefixes[item.type]?item.type:APP.config.roster.ui.defaultTab;
                item.id=APP.rosterPage.generateId(type,new Set(used.keys()));
                remapped.set(oldId,item.id)
              }
              if(!prior||remapped.has(original.id)){merged.push(item);used.set(item.id,item)}
            }
            if(remapped.size){
              const chatKey=row.key.replace(/:rosterProfiles$/,':chatConversations'),chatRow=await this.db.settings.get(chatKey);
              if(chatRow&&Array.isArray(chatRow.value)){
                const conversations=structuredClone(chatRow.value);
                for(const conversation of conversations)if(remapped.has(conversation.profileId))conversation.profileId=remapped.get(conversation.profileId);
                await this.db.settings.put({...chatRow,value:conversations,updatedAt:Date.now()})
              }
            }
          }
          await this.db.settings.put({key,value:merged,updatedAt:Date.now()});
          await this.db.settings.bulkDelete(scoped.map(row=>row.key))
        })
      },
      async adoptLegacyAccountData(appId,profileId,legacyId=null){
        const keys=APP.config.auth.scopedSettings[appId]||[],claimKey=APP.config.auth.legacyClaimKey;
        await this.db.transaction('rw',this.db.settings,async()=>{
          const claim=await this.db.settings.get(claimKey),sourceId=legacyId||null;
          if(!sourceId&&claim)return;
          if(!sourceId&&!claim){const legacyRows=await Promise.all(keys.map(key=>this.db.settings.get(key)));if(!legacyRows.some(Boolean))return}
          for(const key of keys){
            const targetKey=this.scopedKey(appId,profileId,key),sourceKey=sourceId?this.scopedKey(appId,sourceId,key):key;
            const source=await this.db.settings.get(sourceKey);if(!source)continue;
            const target=await this.db.settings.get(targetKey);
            if(!target){await this.db.settings.put({...source,key:targetKey,updatedAt:Date.now()});await this.db.settings.delete(sourceKey);continue}
            if(key==='chatConversations'&&Array.isArray(target.value)&&Array.isArray(source.value)){
              const merged=structuredClone(target.value);
              for(const conversation of source.value){
                if(!conversation||!Array.isArray(conversation.messages))continue;
                const existing=merged.find(item=>item.profileId===conversation.profileId);
                if(!existing){merged.push(structuredClone(conversation));continue}
                const seen=new Set(existing.messages.map(message=>message.id));
                for(const message of conversation.messages)if(!seen.has(message.id)){existing.messages.push(structuredClone(message));seen.add(message.id)}
                existing.messages.sort((left,right)=>(Number(left.createdAt)||0)-(Number(right.createdAt)||0))
              }
              await this.db.settings.put({...target,value:merged,updatedAt:Date.now()});await this.db.settings.delete(sourceKey)
            }
          }
          if(!sourceId&&!claim)await this.db.settings.put({key:claimKey,value:{protocol:APP.config.auth.protocol,claimedBy:profileId,at:Date.now()},updatedAt:Date.now()})
        })
      },
      scheduleReconcile(){
        if(this.reconcileScheduled)return;this.reconcileScheduled=true;
        const run=async()=>{try{await this.reconcileCurrentData()}catch(error){APP.runtime.report(error,'数据库整理')}};
        if('requestIdleCallback'in window)requestIdleCallback(()=>void run(),{timeout:8000});else setTimeout(()=>void run(),3000)
      },
      currentSettingKeys(){
        return new Set([
          ...Object.keys(APP.config.components||{}),
          ...Object.keys(APP.config.themeImages||{}),
          APP.config.theme.wallpaper.settingKey,
          APP.config.theme.lockWallpaper.settingKey,
          APP.config.theme.icons.settingKey,
          APP.config.theme.lockScreen.settingKey,
          ...(APP.config.database.persistentKeys||[]),
          APP.config.database.protocolKey
        ].filter(Boolean))
      },
      scopedKey(appId,accountId,key){return `account:${appId}:${accountId}:${key}`},
      scopeOwner(key){return Object.entries(APP.config.auth.scopedSettings).find(([,keys])=>keys.includes(key))?.[0]||null},
      storageKey(key){
        const owner=this.scopeOwner(key);
        if(!owner)return key;
        const account=APP.auth.current(owner);
        if(!account)throw new Error(`${owner} 尚未登录，无法访问 ${key}`);
        return this.scopedKey(owner,account.id,key)
      },
      async rawGet(key){return (await this.db.settings.get(key))?.value??null},
      async rawSet(key,value){await this.db.settings.put({key,value:structuredClone(value),updatedAt:Date.now()})},
      async getAppData(appId,key){
        const account=APP.auth.current(appId);if(!account)throw new Error(`${appId} 尚未登录`);
        return this.rawGet(this.scopedKey(appId,account.id,key))
      },
      async putAppData(appId,key,value){
        const account=APP.auth.current(appId);if(!account)throw new Error(`${appId} 尚未登录`);
        const payload=JSON.parse(JSON.stringify(value));
        return this.rawSet(this.scopedKey(appId,account.id,key),{protocol:APP.config.auth.protocol,protocolVersion:APP.config.auth.protocolVersion,appId,accountId:account.id,payload})
      },
      collectAssetIds(value,output){
        if(!value||typeof value!=='object')return output;
        if(Array.isArray(value)){for(const item of value)this.collectAssetIds(item,output);return output}
        if(typeof value.assetId==='string'&&value.assetId)output.add(value.assetId);
        for(const [key,item] of Object.entries(value))if(key!=='assetId')this.collectAssetIds(item,output);
        return output
      },
      normalizeCurrentSetting(key,value){
        if(APP.config.components?.[key]||APP.config.themeImages?.[key])return APP.editor.normalize(key,value);
        if(key===APP.config.theme.wallpaper.settingKey)return APP.themePages.normalizeWallpaper(value);
        if(key===APP.config.theme.lockWallpaper.settingKey)return APP.themePages.normalizeLockWallpaper(value);
        if(key===APP.config.theme.icons.settingKey)return APP.themePages.normalizeIcons(value);
        if(key===APP.config.theme.lockScreen.settingKey)return APP.themePages.normalizeLockScreen(value);
        return value
      },
      sameStoredValue(left,right){
        try{return JSON.stringify(left)===JSON.stringify(right)}catch{return false}
      },
      async reconcileCurrentData(){
        const allowed=this.currentSettingKeys();
        await this.db.transaction('rw',this.db.settings,this.db.assets,async()=>{
          const settings=await this.db.settings.toArray(),referencedAssets=new Set(),staleSettingKeys=[],normalizedRows=[],rosterId=new RegExp(`^${APP.config.roster.prefixes[APP.config.auth.rosterType]}\\d{${APP.config.roster.idDigits}}$`);
          for(const row of settings){
            const match=/^account:([a-z0-9-]+):([^:]+):(.+)$/.exec(row.key);
            const baseKey=match?match[3]:row.key;
            const scoped=match&&APP.config.auth.scopedSettings[match[1]]?.includes(baseKey)&&
              (rosterId.test(match[2])||/^[0-9a-f-]{36}$/.test(match[2]));
            if(!allowed.has(row.key)&&!scoped){staleSettingKeys.push(row.key);continue}
            if(row.key===APP.config.database.protocolKey)continue;
            const normalized=this.normalizeCurrentSetting(baseKey,row.value);
            if(!this.sameStoredValue(row.value,normalized))normalizedRows.push({...row,value:structuredClone(normalized)});
            this.collectAssetIds(normalized,referencedAssets)
          }
          if(staleSettingKeys.length)await this.db.settings.bulkDelete(staleSettingKeys);
          const protocolKey=APP.config.database.protocolKey,storedProtocol=settings.find(row=>row.key===protocolKey)?.value||null;
          const protocolCurrent=storedProtocol?.protocol===APP.protocol.protocol&&storedProtocol?.protocolVersion===APP.protocol.protocolVersion&&storedProtocol?.dataRevision===APP.protocol.dataRevision;
          const protocolValue={protocol:APP.protocol.protocol,protocolVersion:APP.protocol.protocolVersion,dataRevision:APP.protocol.dataRevision,updatedAt:protocolCurrent&&Number(storedProtocol.updatedAt)?Number(storedProtocol.updatedAt):Date.now()};
          if(!this.sameStoredValue(storedProtocol,protocolValue))normalizedRows.push({key:protocolKey,value:protocolValue,updatedAt:protocolValue.updatedAt});
          if(normalizedRows.length)await this.db.settings.bulkPut(normalizedRows);
          const [assetIds,pendingAssetIds]=await Promise.all([this.db.assets.toCollection().primaryKeys(),this.db.assets.where('status').equals('pending').primaryKeys()]),pendingSet=new Set(pendingAssetIds),staleAssetIds=assetIds.filter(id=>pendingSet.has(id)||!referencedAssets.has(id));
          if(staleAssetIds.length)await this.db.assets.bulkDelete(staleAssetIds)
        })
      },
      async getSettings(keys){const unique=[...new Set(keys.filter(Boolean))],resolved=unique.map(key=>this.scopeOwner(key)&&!APP.auth.current(this.scopeOwner(key))?null:this.storageKey(key)),rows=await this.db.settings.bulkGet(resolved.filter(Boolean)),byKey=new Map(rows.filter(Boolean).map(row=>[row.key,row.value]));return new Map(unique.map((key,index)=>[key,resolved[index]?byKey.get(resolved[index])??null:null]))},
      async getSetting(key){return this.scopeOwner(key)&&!APP.auth.current(this.scopeOwner(key))?null:this.rawGet(this.storageKey(key))},
      async replaceSetting(key,value){
        const storageKey=this.storageKey(key),snapshot=structuredClone(value);
        return this.db.transaction('rw',this.db.settings,async()=>{await this.db.settings.put({key:storageKey,value:snapshot,updatedAt:Date.now()});const stored=await this.db.settings.get(storageKey);if(!stored)throw new Error(`设置 ${key} 写入后无法回读`);return structuredClone(stored.value)})
      },
      async setSetting(key,value){await this.replaceSetting(key,value)},
      async putPendingAsset(record){await this.db.assets.put(record)},
      async getAssets(ids){const unique=[...new Set(ids.filter(Boolean))];if(!unique.length)return [];const rows=await this.db.assets.bulkGet(unique);return rows.filter(Boolean)},
      async getAsset(id){return id?this.db.assets.get(id):null},
      async deletePendingAsset(id){
        if(!id)return false;
        const record=await this.db.assets.get(id);
        if(record?.status!=='pending')return false;
        await this.db.assets.delete(id);return true
      },
      async deleteAsset(id){if(id)await this.db.assets.delete(id)},
      async commitComponent(settingKey,value,replacements){
        const storageKey=this.storageKey(settingKey);
        const nextIds=new Set(replacements.map(item=>item.nextId).filter(Boolean));
        await this.db.transaction('rw',this.db.settings,this.db.assets,async()=>{
          for(const id of nextIds)await this.db.assets.update(id,{status:'committed'});
          await this.db.settings.put({key:storageKey,value,updatedAt:Date.now()});
          for(const {oldId,nextId} of replacements)if(oldId&&oldId!==nextId)await this.db.assets.delete(oldId);
        });
      },
      async commitRosterState(profiles,relations,replacements){
        const profileKey=this.storageKey(APP.config.roster.settingKey),relationKey=this.storageKey(APP.config.roster.relationSettingKey),nextIds=new Set(replacements.map(item=>item.nextId).filter(Boolean));
        await this.db.transaction('rw',this.db.settings,this.db.assets,async()=>{
          for(const id of nextIds)await this.db.assets.update(id,{status:'committed'});
          const updatedAt=Date.now();await this.db.settings.put({key:profileKey,value:profiles,updatedAt});await this.db.settings.put({key:relationKey,value:relations,updatedAt});
          for(const {oldId,nextId} of replacements)if(oldId&&oldId!==nextId)await this.db.assets.delete(oldId)
        })
      }
    },
    images:{
      picker:null,pickSession:null,urls:new Map(),records:new Map(),versions:new Map(),presentVersions:new Map(),pickSerial:0,
      async init(){
        this.picker=APP.refs.imagePicker;
        this.picker.multiple=true;this.picker.setAttribute('multiple','');
        this.picker.addEventListener('change',()=>this.onPickerChange());
        this.picker.addEventListener('cancel',()=>{this.pickSession=null;this.picker.value=''})
      },
      policy(name){
        const policy=APP.config.image.strategies[name];
        if(!policy)throw new Error(`未知图片策略：${name}`);
        return policy
      },
      token(target){const value=(this.versions.get(target)||0)+1;this.versions.set(target,value);return value},
      isCurrent(target,token){return this.versions.get(target)===token},
      invalidateTarget(target){this.token(target)},
      validate(blob){
        if(!blob||!blob.type.startsWith('image/'))throw new Error('请选择有效图片文件');
        if(blob.size>APP.config.image.maxInputBytes)throw new Error('原图体积过大')
      },
      chooseLocal({target,strategy,onReady,onError}){
        this.pickSession={target,strategy,onReady,onError,multiple:false};
        this.picker.value='';this.picker.click()
      },
      chooseLocalMany({target,strategy,onReady,onError,max=12}){
        this.pickSession={target,strategy,onReady,onError,multiple:true,max};
        this.picker.value='';this.picker.click()
      },
      async onPickerChange(){
        const session=this.pickSession,files=[...(this.picker.files||[])];
        this.pickSession=null;this.picker.value='';
        if(!session||!files.length)return;
        try{
          if(session.multiple){
            if(files.length>session.max)throw new Error(`最多选择 ${session.max} 张图片`);
            const serial=++this.pickSerial,assets=[];
            try{
              for(let index=0;index<files.length;index++){
                const file=files[index],asset=await this.ingestBlob({target:`${session.target}:${serial}:${index}`,blob:file,strategy:session.strategy,sourceType:'local',sourceValue:'',sourceLabel:file.name});
                if(asset)assets.push(asset)
              }
            }catch(error){for(const asset of assets)await this.discard(asset.assetId);throw error}
            await session.onReady?.(assets);return
          }
          const file=files[0],asset=await this.ingestBlob({target:session.target,blob:file,strategy:session.strategy,sourceType:'local',sourceValue:'',sourceLabel:file.name});
          if(asset)await session.onReady?.(asset)
        }catch(error){session.onError?.(error)}
      },
      async ingestURL({target,url,strategy}){
        const clean=String(url||'').trim();
        if(!/^https?:\/\//i.test(clean))throw new Error('请输入 http/https 图片 URL');
        const token=this.token(target),response=await fetch(clean,{mode:'cors',credentials:'omit'});
        if(!response.ok)throw new Error(`图片读取失败（${response.status}）`);
        const blob=await response.blob();
        return this.ingestBlob({target,blob,strategy,sourceType:'url',sourceValue:clean,sourceLabel:clean,token})
      },
      async ingestBlob({target,blob,strategy,sourceType,sourceValue,sourceLabel,token=this.token(target)}){
        this.validate(blob);
        if(!this.isCurrent(target,token))return null;
        const processed=await this.process(blob,strategy);
        if(!this.isCurrent(target,token))return null;
        const id=crypto.randomUUID(),record={id,blob:processed.blob,strategy,status:'pending',sourceType,sourceValue,sourceLabel,width:processed.width,height:processed.height,type:processed.blob.type,size:processed.blob.size,createdAt:Date.now()};
        await APP.store.putPendingAsset(record);
        if(!this.isCurrent(target,token)){await APP.store.deleteAsset(id);return null}
        return {assetId:id,sourceType,sourceValue,sourceLabel}
      },
      async process(blob,strategyName){
        const policy=this.policy(strategyName),codec=APP.config.image.encode,bitmap=await createImageBitmap(blob);
        try{
          if(bitmap.width*bitmap.height>APP.config.image.maxInputPixels)throw new Error('图片像素量过大');
          const square=policy.fit==='square',srcSide=Math.min(bitmap.width,bitmap.height),baseW=square?srcSide:bitmap.width,baseH=square?srcSide:bitmap.height,scale=Math.min(1,policy.maxSide/Math.max(baseW,baseH),Math.sqrt(policy.maxPixels/(baseW*baseH)));
          let width=Math.max(1,Math.round(baseW*scale)),height=Math.max(1,Math.round(baseH*scale)),quality=policy.quality,encoded=null;
          for(let pass=0;pass<codec.passes;pass++){
            encoded=await this.render(bitmap,{square,width,height,type:policy.type,quality});
            if(encoded.size<=policy.maxBytes)return {blob:encoded,width,height};
            if(quality>codec.minQuality)quality=Math.max(codec.minQuality,quality-codec.qualityStep);
            else{width=Math.max(1,Math.round(width*codec.scaleStep));height=Math.max(1,Math.round(height*codec.scaleStep))}
          }
          throw new Error('图片压缩后仍超过当前策略体积上限')
        }finally{bitmap.close?.()}
      },
      async render(bitmap,{square,width,height,type,quality}){
        const side=Math.min(bitmap.width,bitmap.height),sx=square?(bitmap.width-side)/2:0,sy=square?(bitmap.height-side)/2:0,sw=square?side:bitmap.width,sh=square?side:bitmap.height;
        if(typeof OffscreenCanvas!=='undefined'){
          const canvas=new OffscreenCanvas(width,height),ctx=canvas.getContext('2d',{alpha:false});
          ctx.drawImage(bitmap,sx,sy,sw,sh,0,0,width,height);
          return canvas.convertToBlob({type,quality})
        }
        const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
        const ctx=canvas.getContext('2d',{alpha:false});ctx.drawImage(bitmap,sx,sy,sw,sh,0,0,width,height);
        return new Promise((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(new Error('图片编码失败')),type,quality))
      },
      prime(records){for(const record of records||[])if(record?.id&&record?.blob)this.records.set(record.id,record)},
      async present(assetId,consumer,painter){
        const serial=(this.presentVersions.get(consumer)||0)+1;this.presentVersions.set(consumer,serial);
        let entry=null,url='';
        if(assetId){
          entry=this.urls.get(assetId);
          if(!entry){
            const record=this.records.get(assetId)||await APP.store.getAsset(assetId);this.records.delete(assetId);
            if(record?.blob){entry={url:URL.createObjectURL(record.blob),consumers:new Set()};this.urls.set(assetId,entry)}
          }
          url=entry?.url||''
        }
        if(this.presentVersions.get(consumer)!==serial){if(entry&&!entry.consumers.size)this.releaseUrl(assetId);return ''}
        if(entry)entry.consumers.add(consumer);
        try{painter?.(url)}catch(error){if(entry){entry.consumers.delete(consumer);this.releaseUrl(assetId)}throw error}
        for(const [id,current] of [...this.urls]){if(id===assetId)continue;if(current.consumers.delete(consumer))this.releaseUrl(id)}
        return url
      },
      releaseUrl(assetId,{force=false}={}){
        const entry=this.urls.get(assetId);
        if(!entry||(!force&&entry.consumers.size))return false;
        URL.revokeObjectURL(entry.url);this.urls.delete(assetId);return true
      },
      releaseConsumer(consumer){
        this.presentVersions.set(consumer,(this.presentVersions.get(consumer)||0)+1);
        for(const [id,entry] of [...this.urls])if(entry.consumers.delete(consumer))this.releaseUrl(id)
      },
      async discard(assetId){
        if(!assetId)return;
        const deleted=await APP.store.deletePendingAsset(assetId);
        if(deleted)this.releaseUrl(assetId,{force:true})
      },
      async commitState(settingKey,value,replacements){
        await APP.store.commitComponent(settingKey,value,replacements);
        for(const {oldId,nextId} of replacements)if(oldId&&oldId!==nextId)this.releaseUrl(oldId)
      },
      async commitRosterState(profiles,relations,replacements){
        await APP.store.commitRosterState(profiles,relations,replacements);
        for(const {oldId,nextId} of replacements)if(oldId&&oldId!==nextId)this.releaseUrl(oldId)
      },
      shutdown(){this.presentVersions.clear();this.records.clear();for(const id of [...this.urls.keys()])this.releaseUrl(id,{force:true})}
    },
    cssValue(name){
      const value=getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      if(!value)throw new Error(`Missing global color variable: ${name}`);
      return value
    },
    editor:{
      root:null,active:null,draft:null,original:null,pendingAssets:new Set(),dirtyMedia:new Set(),busy:false,opening:false,confirmingReset:false,resetInputSnapshot:new Map(),values:{},rangeRaf:0,pendingRange:null,
      clone(value){return structuredClone(value)},
      esc(value=''){return APP.modal.esc(value)},
      definition(type){const direct=APP.config.components[type]||APP.config.editorViews?.[type];if(direct)return direct;const image=APP.config.themeImages?.[type],base=APP.config.themeImageEditor;if(!image||!base)return null;return {...base,title:image.title,media:[{key:base.mediaKey,label:base.label,strategy:image.strategy}],defaultState:this.clone(base.defaultState)}},
      sourceType(type){return this.definition(type)?.sourceType||type},
      controlDefs(type){return (this.definition(type)?.controls||[]).map(key=>APP.config.styleControls[key]).filter(Boolean)},
      rangeDefs(type){return this.controlDefs(type).filter(control=>control.type==='range')},
      colorValue(value,fallback){
        const raw=String(value??'').trim(),base=String(fallback||APP.cssValue('--theme-primary')).trim();
        if(/^#[0-9a-f]{6}$/i.test(raw))return raw.toUpperCase();
        if(/^#[0-9a-f]{3}$/i.test(raw))return `#${raw.slice(1).split('').map(char=>char+char).join('')}`.toUpperCase();
        return base.toUpperCase()
      },
      choiceValue(control,value,fallback){
        const allowed=new Set((control?.options||[]).map(option=>option.value)),candidate=String(value??'');
        return allowed.has(candidate)?candidate:(allowed.has(String(fallback??''))?String(fallback):control?.options?.[0]?.value||'')
      },
      uploadButton(attribute=''){return `<button class="editor-upload" type="button" ${attribute}><i class="fa-solid fa-folder-open" aria-hidden="true"></i><span>本地文件</span></button>`},
      normalize(type,value){
        const def=this.definition(type),base=this.clone(def.defaultState),incoming=value&&typeof value==='object'?value:{},next=this.clone(base),owns=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
        for(const field of (def.fields||[]))if(owns(incoming,field.key))next[field.key]=String(incoming[field.key]??'');
        for(const media of (def.media||[])){
          const saved=incoming[media.key];
          if(!saved||typeof saved!=='object'||Array.isArray(saved))continue;
          for(const key of Object.keys(base[media.key]||{}))if(owns(saved,key))next[media.key][key]=saved[key]
        }
        for(const control of this.controlDefs(type)){
          const raw=incoming[control.key],fallback=base[control.key];
          if(control.type==='range'){const number=Number(raw);next[control.key]=Number.isFinite(number)?Math.max(control.min,Math.min(control.max,number)):fallback}
          else if(control.type==='color')next[control.key]=this.colorValue(raw,fallback);
          else if(control.type==='choice')next[control.key]=this.choiceValue(control,raw,fallback)
        }
        return next
      },
      render(type,{mount=false,reveal=true}={}){
        const def=this.definition(type),draft=this.draft,mediaDefs=def.media||[],fieldDefs=def.fields||[],controlDefs=this.controlDefs(type);
        const media=mediaDefs.map(item=>`
          <section class="editor-media" data-media="${item.key}">
            <div class="editor-media-label">${item.label}</div>
            <div class="editor-media-row">
              <div class="ui-media-surface editor-preview" data-preview="${item.key}" aria-label="${item.label}预览"></div>
              <div class="editor-media-controls">
                <input class="editor-input" data-media-url="${item.key}" value="" placeholder="图片 URL / 이미지 URL" inputmode="url" autocomplete="off" spellcheck="false" aria-label="${item.label} URL">
                ${this.uploadButton(`data-upload="${item.key}"`)}
              </div>
            </div>
          </section>`).join('');
        const fields=fieldDefs.map(field=>`<label class="editor-field"><span class="editor-field-label">${field.label}</span><input class="editor-input" data-field="${field.key}" value="${this.esc(draft[field.key])}" placeholder="${field.placeholder}"></label>`).join('');
        const controls=controlDefs.map(control=>{
          if(control.type==='range'){
            const value=Math.max(control.min,Math.min(control.max,Number(draft[control.key]??control.min))),progress=((value-control.min)/(control.max-control.min))*100;
            return `<label class="editor-range-field"><span class="editor-range-head"><span class="editor-range-label">${control.label}</span><span class="editor-range-value" data-range-value="${control.key}">${Math.round(value)}${control.suffix||''}</span></span><input class="ui-range editor-range" type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${value}" data-range="${control.key}" style="--range-progress:${progress}%" aria-label="${control.label}"></label>`
          }
          if(control.type==='color'){
            const value=this.colorValue(draft[control.key],def.defaultState[control.key]);
            return `<label class="editor-color-field editor-control-shell"><span class="editor-color-label">${control.label}</span><input class="editor-color-input" type="color" value="${value}" data-color="${control.key}" aria-label="${control.label}"></label>`
          }
          if(control.type==='choice'){
            const value=this.choiceValue(control,draft[control.key],def.defaultState[control.key]),options=(control.options||[]).map(option=>`<option value="${this.esc(option.value)}"${option.value===value?' selected':''}>${option.label}</option>`).join('');
            return `<label class="editor-choice-field editor-control-shell"><span class="editor-choice-label">${control.label}</span><span class="editor-choice-select-wrap"><select class="editor-choice-select" data-choice="${control.key}" aria-label="${control.label}">${options}</select></span></label>`
          }
          return ''
        }).join('');
        const body=`${media}${fields?`<div class="editor-fields">${fields}</div>`:''}${controls?`<div class="editor-style-controls">${controls}</div>`:''}<div class="editor-reset-wrap"><button class="editor-reset" type="button" data-reset>${def.resetLabel||'重置此组件'}</button></div>`,actions='<footer class="editor-actions"><button class="editor-action editor-cancel" type="button" data-cancel>取消</button><button class="editor-action editor-confirm" type="button" data-confirm>确定</button></footer>',options={title:def.title,subtitle:def.subtitle,titleId:'editorTitle',body,bodyClass:'',actions},modalOptions={owner:'editor',onCancel:()=>this.confirmingReset?void this.closeResetConfirm():void this.close(),reveal};
        return mount?APP.modal.mount(options,modalOptions):APP.modal.replace(options,modalOptions)
      },
      async open(type){
        if(!APP.state.runtime.ready){APP.guide.show(APP.state.runtime.error?'数据层初始化失败，请查看错误提示':'数据层正在初始化');return}
        if(!this.definition(type)||this.busy||this.opening||APP.modal.isOpen())return;this.cancelRangePreview();this.opening=true;
        const sourceType=this.sourceType(type),sourceValue=this.values[sourceType]||APP.config.components[sourceType]?.defaultState||this.definition(type).defaultState;
        this.active=type;this.original=this.normalize(type,sourceValue);this.draft=this.clone(this.original);this.pendingAssets.clear();this.dirtyMedia.clear();this.confirmingReset=false;this.resetInputSnapshot.clear();
        if(!this.render(type,{mount:true,reveal:false})){this.active=null;this.draft=null;this.original=null;this.opening=false;return}
        try{
          await Promise.all((this.definition(type).media||[]).map(item=>this.paintMedia(item.key)));
          if(this.active!==type||!APP.modal.isOpen('editor'))return;
          APP.modal.reveal()
        }finally{this.opening=false}
      },
      async close({discard=true}={}){
        this.cancelRangePreview();if(APP.modal.isOpen('editor'))APP.modal.finish(null);
        const activeType=this.active,original=this.original,pending=[...this.pendingAssets];
        if(discard)for(const id of pending)await APP.images.discard(id);
        if(discard&&activeType&&original)this.applyComponentStyle(activeType,original);
        (this.definition(activeType)?.media||[]).forEach(item=>APP.images.releaseConsumer(`editor:${activeType}:${item.key}`));
        if(activeType)(this.definition(activeType)?.media||[]).forEach(item=>APP.images.invalidateTarget(`${activeType}:${item.key}`));
        this.active=null;this.draft=null;this.original=null;this.pendingAssets.clear();this.dirtyMedia.clear();this.confirmingReset=false;this.resetInputSnapshot.clear();this.busy=false;this.opening=false
      },
      bindEvents(){
        /* One delegated editor event hub. It is bound once for the lifetime of APP; render() never adds control listeners. */
        this.root.addEventListener('click',event=>{
          const action=event.target.closest?.('[data-cancel],[data-confirm],[data-reset],[data-reset-cancel],[data-reset-confirm],[data-upload]');
          if(!action||!this.root.contains(action))return;
          if(action.matches('[data-cancel]'))return void this.close();
          if(action.matches('[data-confirm]'))return void this.confirm();
          if(action.matches('[data-reset]'))return this.openResetConfirm();
          if(action.matches('[data-reset-cancel]'))return this.closeResetConfirm();
          if(action.matches('[data-reset-confirm]'))return void this.resetDraft();
          if(action.matches('[data-upload]'))return void this.pickLocal(action.dataset.upload)
        });
        this.root.addEventListener('input',event=>{
          const element=event.target;
          if(!(element instanceof HTMLInputElement)||!this.draft)return;
          if(element.matches('[data-field]')){this.draft[element.dataset.field]=element.value;return}
          if(element.matches('[data-range]')){const key=element.dataset.range,range=this.rangeDefs(this.active).find(item=>item.key===key),value=Number(element.value);this.draft[key]=value;this.queueRangePreview(element,range,value);return}
          if(element.matches('[data-color]')){const key=element.dataset.color,control=this.controlDefs(this.active).find(item=>item.key===key);this.draft[key]=this.colorValue(element.value,this.definition(this.active).defaultState[key]);if(control)this.applyComponentStyle(this.active,this.draft);return}
          if(element.matches('[data-media-url]')){this.dirtyMedia.add(element.dataset.mediaUrl);element.dataset.sourceMode='url'}
        });
        this.root.addEventListener('change',event=>{
          const element=event.target;
          if(!this.draft)return;
          if(element instanceof HTMLSelectElement&&element.matches('[data-choice]')){const key=element.dataset.choice,control=this.controlDefs(this.active).find(item=>item.key===key);if(control){this.draft[key]=this.choiceValue(control,element.value,this.definition(this.active).defaultState[key]);this.applyComponentStyle(this.active,this.draft)}return}
          if(element instanceof HTMLInputElement&&element.matches('[data-media-url]'))void this.resolveMediaInput(element.dataset.mediaUrl)
        })
      },
      cancelRangePreview(){if(this.rangeRaf){cancelAnimationFrame(this.rangeRaf);this.rangeRaf=0}this.pendingRange=null},
      queueRangePreview(element,range,value){
        if(!element||!range)return;
        this.pendingRange={element,range,value};
        if(this.rangeRaf)return;
        this.rangeRaf=requestAnimationFrame(()=>{
          this.rangeRaf=0;const pending=this.pendingRange;this.pendingRange=null;if(!pending||!this.draft||!this.active)return;
          this.paintRange(pending.element,pending.range,pending.value);this.applyComponentStyle(this.active,this.draft)
        })
      },
      paintRange(element,range,value){if(!element||!range)return;const progress=((value-range.min)/(range.max-range.min))*100;element.style.setProperty('--range-progress',`${Math.max(0,Math.min(100,progress))}%`);const output=this.root.querySelector(`[data-range-value="${range.key}"]`);if(output)output.textContent=`${Math.round(value)}${range.suffix||''}`},
      mediaDef(key){return (this.definition(this.active).media||[]).find(item=>item.key===key)},
      pickLocal(key){
        const def=this.mediaDef(key);if(!def||this.busy)return;
        APP.images.chooseLocal({target:`${this.active}:${key}`,strategy:def.strategy,onReady:asset=>this.acceptAsset(key,asset),onError:error=>this.showMediaError(key,error)})
      },
      async acceptAsset(key,asset){
        if(!asset||!this.draft)return;
        const previous=this.draft[key]?.assetId,discardPrevious=previous&&this.pendingAssets.has(previous)&&previous!==asset.assetId;
        this.draft[key]=asset;this.pendingAssets.add(asset.assetId);this.dirtyMedia.delete(key);await this.paintMedia(key);
        if(discardPrevious){this.pendingAssets.delete(previous);await APP.images.discard(previous)}
      },
      showMediaError(key,error){
        const input=this.root.querySelector(`[data-media-url="${key}"]`);if(!input)return;
        input.setCustomValidity(error?.message||'图片处理失败');input.reportValidity();input.addEventListener('input',()=>input.setCustomValidity(''),{once:true})
      },
      async resolveMediaInput(key){
        if(!this.draft||!this.dirtyMedia.has(key))return true;
        const input=this.root.querySelector(`[data-media-url="${key}"]`);if(!input)return true;
        const value=input.value.trim();
        if(this.draft[key]?.sourceType==='url'&&value===this.draft[key].sourceValue){this.dirtyMedia.delete(key);return true}
        if(!value){
          const previous=this.draft[key]?.assetId,discardPrevious=previous&&this.pendingAssets.has(previous);
          this.draft[key]={assetId:null,sourceType:'none',sourceValue:'',sourceLabel:''};this.dirtyMedia.delete(key);await this.paintMedia(key);
          if(discardPrevious){this.pendingAssets.delete(previous);await APP.images.discard(previous)}return true
        }
        try{
          const def=this.mediaDef(key),asset=await APP.images.ingestURL({target:`${this.active}:${key}`,url:value,strategy:def.strategy});
          if(!asset)return false;await this.acceptAsset(key,asset);return true
        }catch(error){this.showMediaError(key,error);return false}
      },
      async paintMedia(key){
        if(!this.draft)return;
        const preview=this.root.querySelector(`[data-preview="${key}"]`),input=this.root.querySelector(`[data-media-url="${key}"]`);if(!preview||!input)return;
        const media=this.draft[key]||this.definition(this.active).defaultState[key],consumer=`editor:${this.active}:${key}`;
        const url=await APP.images.present(media.assetId,consumer,nextUrl=>{preview.style.backgroundImage=nextUrl?`url("${nextUrl.replace(/"/g,'\\"')}")`:'none'});
        if(!this.draft)return;
        if(media.sourceType==='url'){input.value=media.sourceValue||'';input.dataset.sourceMode='url'}
        else if(media.sourceType==='local'&&url){input.value=media.sourceLabel||'本地文件';input.dataset.sourceMode='local'}
        else{input.value='';input.dataset.sourceMode='none'}
      },
      captureResetInputs(){
        this.resetInputSnapshot.clear();
        for(const media of (this.definition(this.active)?.media||[])){
          const input=this.root.querySelector(`[data-media-url="${media.key}"]`);
          if(input&&this.dirtyMedia.has(media.key))this.resetInputSnapshot.set(media.key,{value:input.value,sourceMode:input.dataset.sourceMode||'url'})
        }
      },
      openResetConfirm(){
        if(!this.active||this.busy)return;
        const def=this.definition(this.active);this.captureResetInputs();this.confirmingReset=true;
        APP.modal.replace({title:'确认重置？',titleId:'editorTitle',body:`<div class="modal-copy">${this.esc(def.resetText||'当前设置将恢复为默认状态。')}</div>`,actions:'<footer class="editor-actions"><button class="editor-action editor-cancel" type="button" data-reset-cancel>取消</button><button class="editor-action editor-confirm" type="button" data-reset-confirm>重置</button></footer>'},{owner:'editor',onCancel:()=>void this.closeResetConfirm()})
      },
      async closeResetConfirm(){
        if(!this.active||!this.confirmingReset)return;const type=this.active,snapshot=new Map(this.resetInputSnapshot);this.confirmingReset=false;
        if(!this.render(type))return;
        await Promise.all((this.definition(type).media||[]).map(item=>this.paintMedia(item.key)));
        if(this.active!==type||this.confirmingReset)return;
        for(const [key,state] of snapshot){const input=this.root.querySelector(`[data-media-url="${key}"]`);if(input){input.value=state.value;input.dataset.sourceMode=state.sourceMode;this.dirtyMedia.add(key)}}
        this.resetInputSnapshot.clear()
      },
      async resetDraft(){
        if(!this.active||this.busy)return;this.cancelRangePreview();
        const type=this.active,pending=[...this.pendingAssets];this.pendingAssets.clear();this.dirtyMedia.clear();this.resetInputSnapshot.clear();this.confirmingReset=false;this.draft=this.clone(this.definition(type).defaultState);
        if(!this.render(type))return;
        await Promise.all((this.definition(type).media||[]).map(item=>this.paintMedia(item.key)));
        this.applyComponentStyle(type,this.draft);
        for(const id of pending)await APP.images.discard(id);
      },
      async confirm(){
        if(!this.active||!this.draft||this.busy)return;this.cancelRangePreview();
        this.busy=true;const button=this.root.querySelector('[data-confirm]');if(button)button.disabled=true;
        try{
          const activeType=this.active,def=this.definition(activeType),sourceType=this.sourceType(activeType);
          for(const media of (def.media||[])){const ok=await this.resolveMediaInput(media.key);if(!ok){this.busy=false;if(button)button.disabled=false;return}}
          const previous=this.values[sourceType]||this.normalize(sourceType,APP.config.components[sourceType]?.defaultState),next=sourceType===activeType?this.clone(this.draft):this.clone(previous);
          if(sourceType!==activeType){
            for(const media of (def.media||[]))next[media.key]=this.clone(this.draft[media.key]);
            for(const field of (def.fields||[]))next[field.key]=this.draft[field.key];
            for(const control of this.controlDefs(activeType))next[control.key]=this.draft[control.key]
          }
          const replacements=(def.media||[]).map(media=>({oldId:previous[media.key]?.assetId||null,nextId:next[media.key]?.assetId||null}));
          await APP.images.commitState(sourceType,next,replacements);this.values[sourceType]=next;this.pendingAssets.clear();
          await this.applyComponent(sourceType,next);
          await this.close({discard:false})
        }catch(error){APP.runtime.report(error,'组件保存');this.busy=false;if(button)button.disabled=false}
      },
      async applyComponent(type,value){
        const def=this.definition(type),target=APP.refs.components?.[type];
        if(!def||!target)return;
        for(const field of (def.fields||[])){
          const node=target.querySelector(`[data-bind="${field.key}"]`);
          if(node)node.textContent=String(value?.[field.key]??def.defaultState?.[field.key]??'')
        }
        for(const media of (def.media||[])){
          const selector=`[data-media-view="${media.key}"]`,node=target.matches?.(selector)?target:target.querySelector(selector),consumer=`view:${type}:${media.key}`,mirror=type==='profile'&&media.key==='avatar'?document.querySelector('[data-settings-avatar]'):null;
          await APP.images.present(value?.[media.key]?.assetId,consumer,url=>{const css=url?`url("${url.replace(/"/g,'\\"')}")`:'none';if(node){node.style.backgroundImage=css;node.style.backgroundSize='cover';node.style.backgroundPosition='center'}if(mirror){mirror.style.backgroundImage=css;mirror.style.backgroundSize='cover';mirror.style.backgroundPosition='center'}})
        }
        this.applyComponentStyle(type,value)
      },
      applyComponentStyle(type,value){
        const target=APP.refs.components?.[type],def=this.definition(type);
        if(!target||!def)return;
        const transparency=Math.max(0,Math.min(100,Number(value?.backgroundTransparency??def.defaultState?.backgroundTransparency??0))),alpha=1-transparency/100;
        target.style.setProperty('--component-bg-alpha',String(alpha));
        for(const control of this.controlDefs(type)){
          if(control.type==='color'&&control.cssVar)target.style.setProperty(control.cssVar,this.colorValue(value?.[control.key],def.defaultState?.[control.key]));
          else if(control.type==='choice'&&control.attribute)target.setAttribute(control.attribute,this.choiceValue(control,value?.[control.key],def.defaultState?.[control.key]))
        }
      }
    },
    home:{
      currentX:0,cropBaseLeft:0,cropBaseTop:0,cropReady:false,
      measureProfileWallpaperCrop(){
        const clip=APP.refs.profileInfoBg;if(!clip)return;
        const rect=clip.getBoundingClientRect();this.cropBaseLeft=rect.left-this.currentX;this.cropBaseTop=rect.top;this.cropReady=true
      },
      syncProfileWallpaperCrop(x=this.currentX){
        const wallpaper=APP.refs.profileInfoWallpaper;if(!wallpaper||!this.cropReady)return;
        wallpaper.style.transform=`translate3d(${-(this.cropBaseLeft+x)}px,${-this.cropBaseTop}px,0)`
      },
      pageWidth(){return innerWidth},
      pageCount(){return Math.max(1,APP.refs.screens?.length||1)},
      baseX(){return -APP.state.page.index*this.pageWidth()},
      setX(x,animate=false){this.currentX=x;APP.refs.stage.classList.toggle('animating',animate);APP.refs.stage.style.transform=`translate3d(${x}px,0,0)`;this.syncProfileWallpaperCrop(x)},
      syncPager(){APP.refs.dots.forEach((dot,index)=>dot.classList.toggle('active',index===APP.state.page.index))},
      snap(next){APP.state.page.index=Math.max(0,Math.min(this.pageCount()-1,next));this.syncPager();this.setX(this.baseX(),true)},
      renderCalendar(){
        const now=new Date(),day=now.getDay(),offset=day===0?-6:1-day,monday=new Date(now.getFullYear(),now.getMonth(),now.getDate()+offset),weekdayLabels=['一','二','三','四','五','六','日'];
        for(let index=0;index<7;index++){
          const date=new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+index),item=document.createElement('div');
          item.className='date-item';item.innerHTML=`<div class="weekday">${weekdayLabels[index]}</div><div class="daynum">${date.getDate()}</div>`;APP.refs.dateStrip.appendChild(item)
        }
      },
      diaryDateTimer:null,
      renderDiaryDate(){
        const node=APP.refs.diaryDate;if(!node)return;const now=new Date(),week=['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];node.textContent=`${now.getMonth()+1}月${now.getDate()}日 ${week[now.getDay()]}`
      },
      startDiaryDate(){
        this.renderDiaryDate();clearTimeout(this.diaryDateTimer);const now=new Date(),next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,0,30);this.diaryDateTimer=setTimeout(()=>this.startDiaryDate(),Math.max(1000,next-now))
      },
      chatClockTimer:null,
      renderChatClock(){
        const now=new Date(),hours=now.getHours(),minutes=String(now.getMinutes()).padStart(2,'0'),period=hours>=12?'PM':'AM',hour12=hours%12||12,text=`${String(hour12).padStart(2,'0')}:${minutes} ${period}`;
        APP.refs.chatTimes.forEach(node=>{node.textContent=text;node.dateTime=now.toISOString()})
      },
      startChatClock(){
        this.renderChatClock();clearTimeout(this.chatClockTimer);
        const tick=()=>{this.renderChatClock();const now=new Date();this.chatClockTimer=setTimeout(tick,(60-now.getSeconds())*1000-now.getMilliseconds()+20)};
        const now=new Date();this.chatClockTimer=setTimeout(tick,(60-now.getSeconds())*1000-now.getMilliseconds()+20)
      },
      bindPager(){
        const state=APP.state.page,pager=APP.config.pager,viewport=APP.refs.viewport;
        viewport.addEventListener('pointerdown',event=>{
          if(document.body.classList.contains('editor-open')||APP.pageManager.isOpen())return;
          if(event.pointerType==='mouse'&&event.button!==0)return;
          state.dragging=true;state.axis=null;const tappedApp=event.target.closest?.('.app-shell');state.tapEditorType=tappedApp?null:(event.target.closest?.('[data-editor]')?.dataset.editor||null);state.startX=state.lastX=event.clientX;state.startY=event.clientY;state.startTime=performance.now();APP.refs.stage.classList.remove('animating');
          if(!tappedApp){try{viewport.setPointerCapture(event.pointerId)}catch(_){ }}
        });
        viewport.addEventListener('pointermove',event=>{
          if(!state.dragging)return;
          const dx=event.clientX-state.startX,dy=event.clientY-state.startY;
          if(state.axis===null&&Math.hypot(dx,dy)>pager.axisLockDistance){state.axis=Math.abs(dx)>=Math.abs(dy)?'x':'y';state.tapEditorType=null}
          if(state.axis!=='x')return;
          event.preventDefault();state.lastX=event.clientX;let drag=dx;
          if((state.index===0&&drag>0)||(state.index===this.pageCount()-1&&drag<0))drag*=pager.edgeResistance;
          this.setX(this.baseX()+drag)
        },{passive:false});
        const finish=event=>{
          if(!state.dragging)return;state.dragging=false;
          const dx=(event?.clientX??state.lastX)-state.startX,elapsed=Math.max(1,performance.now()-state.startTime),velocity=dx/elapsed;
          if(event?.type==='pointercancel'){state.tapEditorType=null;return this.snap(state.index)}
          if(state.axis===null&&state.tapEditorType)return;
          state.tapEditorType=null;if(state.axis!=='x')return this.snap(state.index);
          const threshold=this.pageWidth()*pager.dragThresholdRatio;
          if(dx<-threshold||velocity<-pager.velocityThreshold)this.snap(state.index+1);
          else if(dx>threshold||velocity>pager.velocityThreshold)this.snap(state.index-1);
          else this.snap(state.index)
        };
        viewport.addEventListener('pointerup',finish);viewport.addEventListener('pointercancel',finish);
        /* Open on the original click, never on pointerup. This prevents the opening gesture from clicking through into the newly mounted panel. */
        viewport.addEventListener('click',event=>{
          const type=state.tapEditorType;state.tapEditorType=null;
          if(!type||document.body.classList.contains('editor-open'))return;
          const target=event.target.closest?.('[data-editor]');
          if(!target||target.dataset.editor!==type||event.target.closest?.('.app-shell'))return;
          APP.editor.open(type)
        });
        addEventListener('resize',()=>{APP.refs.stage.classList.remove('animating');this.setX(this.baseX());requestAnimationFrame(()=>{this.measureProfileWallpaperCrop();this.syncProfileWallpaperCrop()})});APP.refs.stage.addEventListener('transitionend',()=>{APP.refs.stage.classList.remove('animating');this.syncProfileWallpaperCrop()})
      }
    },
    lockScreen:{
      root:null,timeNode:null,dateNode:null,passcodeNode:null,dots:[],clockTimer:0,dragging:false,pointerId:null,startY:0,lastY:0,holdTimer:0,locked:false,passcodeValue:'',
      get settings(){return APP.state.theme.lockScreen||APP.config.theme.lockScreen?.defaultState||{enabled:true,passwordEnabled:false,password:''}},
      init(){
        this.root=APP.refs.lockScreen;this.timeNode=APP.refs.lockTime;this.dateNode=APP.refs.lockDate;if(!this.root)return;this.passcodeNode=this.root.querySelector('[data-lock-passcode]');this.dots=[...this.root.querySelectorAll('[data-lock-passcode-dot]')];this.updateClock();this.scheduleClock();
        this.root.addEventListener('pointerdown',event=>this.onPointerDown(event));this.root.addEventListener('pointermove',event=>this.onPointerMove(event),{passive:false});this.root.addEventListener('pointerup',event=>this.onPointerEnd(event));this.root.addEventListener('pointercancel',event=>this.onPointerEnd(event,true));this.root.querySelectorAll('[data-lock-quick]').forEach(button=>this.bindQuick(button));this.root.querySelectorAll('[data-passcode-digit]').forEach(button=>button.addEventListener('click',()=>this.inputDigit(button.dataset.passcodeDigit)));
        this.root.querySelector('[data-passcode-cancel]')?.addEventListener('click',()=>this.hidePasscode());this.root.querySelector('[data-passcode-emergency]')?.addEventListener('click',()=>APP.guide.show('此演示未接入系统紧急呼叫'));
        addEventListener('keydown',event=>{if(!this.locked||!this.root.classList.contains('is-passcode'))return;if(/^\d$/.test(event.key)){event.preventDefault();this.inputDigit(event.key);return}if(event.key==='Backspace'){event.preventDefault();this.passcodeValue=this.passcodeValue.slice(0,-1);this.paintPasscode();return}if(event.key==='Escape'){event.preventDefault();this.hidePasscode()} });
        addEventListener('pagehide',()=>clearTimeout(this.clockTimer),{once:true});window.appLock=()=>this.lock()
      },
      configure({initial=false}={}){
        if(!this.root)return;const state=this.settings;if(!state.enabled){this.locked=false;this.hidePasscode();this.root.hidden=true;this.root.setAttribute('aria-hidden','true');return}
        if(initial)this.lock();else if(this.locked&&this.root.hidden)this.lock()
      },
      updateClock(){if(!this.timeNode||!this.dateNode)return;const now=new Date(),time=new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}).format(now).replace(/^24:/,'00:');this.timeNode.textContent=time;this.timeNode.dateTime=now.toISOString();const monthDay=new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric'}).format(now),weekday=new Intl.DateTimeFormat('zh-CN',{weekday:'long'}).format(now);this.dateNode.textContent=`${monthDay} ${weekday}`},
      scheduleClock(){clearTimeout(this.clockTimer);const now=new Date(),delay=(60-now.getSeconds())*1000-now.getMilliseconds()+24;this.clockTimer=setTimeout(()=>{this.updateClock();this.scheduleClock()},Math.max(250,delay))},
      onPointerDown(event){if(!this.locked||this.root.classList.contains('is-passcode')||event.target.closest?.('[data-lock-quick]'))return;if(event.pointerType==='mouse'&&event.button!==0)return;this.dragging=true;this.pointerId=event.pointerId;this.startY=this.lastY=event.clientY;this.root.classList.add('is-dragging');try{this.root.setPointerCapture(event.pointerId)}catch(_){ }},
      onPointerMove(event){if(!this.dragging||event.pointerId!==this.pointerId)return;const dy=Math.min(0,event.clientY-this.startY);this.lastY=event.clientY;if(dy<0){event.preventDefault();const eased=-Math.pow(Math.abs(dy),.94);this.root.style.setProperty('--lock-drag-y',`${Math.max(-innerHeight*.74,eased)}px`)}},
      onPointerEnd(event,cancelled=false){if(!this.dragging||event.pointerId!==this.pointerId)return;this.dragging=false;this.root.classList.remove('is-dragging');const dy=(event.clientY??this.lastY)-this.startY;this.pointerId=null;if(!cancelled&&dy<-Math.min(92,innerHeight*.105))this.requestUnlock();else this.root.style.setProperty('--lock-drag-y','0px')},
      requestUnlock(){this.root.style.setProperty('--lock-drag-y','0px');if(this.settings.passwordEnabled&&/^\d{6}$/.test(this.settings.password))this.showPasscode();else this.unlock()},
      showPasscode(){if(!this.passcodeNode)return;this.passcodeValue='';this.paintPasscode();this.root.classList.remove('is-dragging','is-unlocking-passcode');this.root.style.setProperty('--lock-drag-y','0px');this.passcodeNode.hidden=false;this.passcodeNode.setAttribute('aria-hidden','false');void this.passcodeNode.offsetWidth;requestAnimationFrame(()=>{if(this.locked&&!this.passcodeNode.hidden)this.root.classList.add('is-passcode')})},
      hidePasscode(){this.passcodeValue='';this.paintPasscode();this.root?.classList.remove('is-passcode','is-unlocking-passcode');if(this.passcodeNode){this.passcodeNode.hidden=true;this.passcodeNode.setAttribute('aria-hidden','true')}},
      paintPasscode(){this.dots.forEach((dot,index)=>dot.classList.toggle('is-filled',index<this.passcodeValue.length))},
      inputDigit(value){if(!this.locked||!this.root.classList.contains('is-passcode')||this.passcodeValue.length>=6||!/^[0-9]$/.test(String(value)))return;this.passcodeValue+=String(value);this.paintPasscode();try{navigator.vibrate?.(6)}catch(_){ }if(this.passcodeValue.length===6)setTimeout(()=>this.verifyPasscode(),90)},
      verifyPasscode(){if(this.passcodeValue.length!==6)return;if(this.passcodeValue===this.settings.password){this.unlock();return}const dots=this.root.querySelector('.system-passcode-dots');dots?.classList.remove('is-error');void dots?.offsetWidth;dots?.classList.add('is-error');setTimeout(()=>dots?.classList.remove('is-error'),390);try{navigator.vibrate?.([16,35,16])}catch(_){ }setTimeout(()=>{this.passcodeValue='';this.paintPasscode()},260)},
      bindQuick(button){const clear=()=>{clearTimeout(this.holdTimer);this.holdTimer=0;button.classList.remove('is-pressed','is-holding')};button.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'&&event.button!==0)return;event.stopPropagation();clear();button.classList.add('is-pressed');this.holdTimer=setTimeout(()=>{button.classList.add('is-holding');this.activateQuick(button)},430)});button.addEventListener('pointerup',clear);button.addEventListener('pointercancel',clear);button.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse')clear()});button.addEventListener('click',event=>event.preventDefault());button.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;event.preventDefault();this.activateQuick(button)})},
      activateQuick(button){const action=button.dataset.lockQuick;if(!action)return;if(action==='flashlight')button.setAttribute('aria-pressed',String(button.getAttribute('aria-pressed')!=='true'));button.classList.remove('is-confirmed');void button.offsetWidth;button.classList.add('is-confirmed');setTimeout(()=>button.classList.remove('is-confirmed'),390);try{navigator.vibrate?.(8)}catch(_){ }},
      unlock(){if(!this.locked)return;const fromPasscode=this.root.classList.contains('is-passcode')&&!this.passcodeNode?.hidden;this.locked=false;this.root.style.setProperty('--lock-drag-y','0px');this.root.classList.remove('is-dragging');if(fromPasscode){this.root.classList.add('is-unlocking-passcode');setTimeout(()=>{if(this.locked)return;this.root.hidden=true;this.root.setAttribute('aria-hidden','true');this.root.classList.remove('is-passcode','is-unlocking-passcode');if(this.passcodeNode){this.passcodeNode.hidden=true;this.passcodeNode.setAttribute('aria-hidden','true')}this.passcodeValue='';this.paintPasscode()},540);return}this.hidePasscode();this.root.classList.add('is-unlocking');setTimeout(()=>{if(this.locked)return;this.root.hidden=true;this.root.setAttribute('aria-hidden','true');this.root.classList.remove('is-unlocking')},540)},
      lock(){if(!this.root||!this.settings.enabled)return false;this.hidePasscode();this.locked=true;this.root.hidden=false;this.root.setAttribute('aria-hidden','false');this.root.classList.remove('is-unlocking','is-unlocking-passcode','is-passcode','is-dragging');this.root.style.setProperty('--lock-drag-y','0px');this.updateClock();this.root.querySelector('[data-lock-quick="flashlight"]')?.setAttribute('aria-pressed','false');return true}
    },
    cacheRefs(){
      const componentTypes=[...Object.keys(APP.config.components),...Object.keys(APP.config.themeImages||{})];const components=Object.fromEntries(componentTypes.map(type=>[type,document.querySelector(`[data-editor="${type}"]`)]));
      this.refs={stage:document.getElementById('stage'),viewport:document.getElementById('viewport'),screens:[...document.querySelectorAll('.screen')],appLayer:document.getElementById('appLayer'),globalPanel:document.getElementById('globalEditor'),systemGuide:document.getElementById('systemGuide'),lockScreen:document.getElementById('lockScreen'),lockTime:document.querySelector('[data-lock-time]'),lockDate:document.querySelector('[data-lock-date]'),dots:[...document.querySelectorAll('.dot')],dateStrip:document.getElementById('dateStrip'),diaryDate:document.querySelector('[data-diary-date]'),chatTimes:[...document.querySelectorAll('[data-chat-time]')],imagePicker:document.getElementById('globalImagePicker'),profileInfoBg:document.querySelector('.profile-info-bg'),profileInfoWallpaper:document.querySelector('.profile-info-wallpaper'),components};
      const required={stage:this.refs.stage,viewport:this.refs.viewport,appLayer:this.refs.appLayer,globalEditor:this.refs.globalPanel,systemGuide:this.refs.systemGuide,lockScreen:this.refs.lockScreen,dateStrip:this.refs.dateStrip,globalImagePicker:this.refs.imagePicker},missing=Object.entries(required).filter(([,node])=>!node).map(([name])=>name);
      if(missing.length)throw new Error(`基础 DOM 结构不完整：${missing.join('、')}`);
      if(!this.refs.systemGuide.querySelector('[data-system-guide-copy]'))throw new Error('基础 DOM 结构不完整：systemGuide copy');
      this.editor.root=this.refs.globalPanel
    },
    bindGlobalEvents(){
      this.editor.bindEvents();
      APP.refs.viewport.addEventListener('click',event=>{
        const launcher=event.target.closest?.('[data-app-id]');if(!launcher)return;
        event.preventDefault();APP.openApp(launcher.dataset.appId)
      });
      APP.refs.viewport.addEventListener('keydown',event=>{
        if(event.key!=='Enter'&&event.key!==' ')return;
        const launcher=event.target.closest?.('[data-app-id]');if(!launcher)return;
        event.preventDefault();APP.openApp(launcher.dataset.appId)
      });
      APP.refs.appLayer.addEventListener('click',event=>{
        const chatTab=event.target.closest?.('[data-chat-tab]');if(chatTab){event.preventDefault();APP.chatPage.select(chatTab.dataset.chatTab);return}
        const instagramTab=event.target.closest?.('[data-instagram-tab]');if(instagramTab){event.preventDefault();APP.instagramPage.select(instagramTab.dataset.instagramTab);return}
        const redbookTab=event.target.closest?.('[data-redbook-tab]');if(redbookTab){event.preventDefault();APP.redbookPage.select(redbookTab.dataset.redbookTab);return}
        const redbookHomeTab=event.target.closest?.('[data-redbook-home-tab]');if(redbookHomeTab){event.preventDefault();APP.redbookPage.selectHome(redbookHomeTab.dataset.redbookHomeTab);return}
        const redbookSubBack=event.target.closest?.('[data-redbook-sub-back]');if(redbookSubBack){event.preventDefault();APP.redbookPage.backSubpage();return}
        const redbookMessageKind=event.target.closest?.('[data-redbook-message-kind]');if(redbookMessageKind){event.preventDefault();APP.redbookPage.toggleGroupMenu(false);APP.redbookPage.openMessageKind(redbookMessageKind.dataset.redbookMessageKind);return}
        if(event.target.closest?.('[data-redbook-group-trigger]')){event.preventDefault();APP.redbookPage.toggleGroupMenu();return}
        if(event.target.closest?.('[data-redbook-share]')){event.preventDefault();APP.redbookPage.toggleShare(true);return}
        if(event.target.closest?.('[data-redbook-share-close]')){event.preventDefault();APP.redbookPage.toggleShare(false);return}
        const redbookShareLayer=event.target.closest?.('[data-redbook-share-layer]');if(redbookShareLayer&&event.target===redbookShareLayer){event.preventDefault();APP.redbookPage.toggleShare(false);return}
        const redbookOpen=event.target.closest?.('[data-redbook-open]');if(redbookOpen){event.preventDefault();APP.redbookPage.toggleGroupMenu(false);APP.redbookPage.openSubpage(redbookOpen.dataset.redbookOpen);return}
        const redbookLike=event.target.closest?.('[data-redbook-like]');if(redbookLike){event.preventDefault();redbookLike.setAttribute('aria-pressed',String(redbookLike.getAttribute('aria-pressed')!=='true'));return}
        if(event.target.closest?.('[data-redbook-publish]')){event.preventDefault();APP.redbookPage.toggleCompose(true);return}
        if(event.target.closest?.('[data-redbook-compose-close]')){event.preventDefault();APP.redbookPage.toggleCompose(false);return}
        const redbookCompose=event.target.closest?.('[data-redbook-compose]');if(redbookCompose&&event.target===redbookCompose){event.preventDefault();APP.redbookPage.toggleCompose(false);return}
        if(event.target.closest?.('[data-page-back]')){event.preventDefault();APP.pageManager.back();return}
        const editorTarget=event.target.closest?.('[data-editor]');
        const editorControl=event.target.closest?.('button,input,select,textarea,a');
        if(editorTarget&&!editorControl){event.preventDefault();APP.editor.open(editorTarget.dataset.editor);return}
        const avatarEditor=event.target.closest?.('[data-settings-avatar-editor]');
        if(avatarEditor){event.preventDefault();APP.editor.open(avatarEditor.dataset.settingsAvatarEditor);return}
        const settingsEntry=event.target.closest?.('[data-settings-entry]');if(settingsEntry){const target=settingsEntry.dataset.settingsEntry;if(APP.systemInfo.open(target)){event.preventDefault();return}if(APP.appManager.resolve(target)){event.preventDefault();APP.openApp(target);return}}
        const themeEntry=event.target.closest?.('[data-theme-entry]');if(themeEntry){const target=themeEntry.dataset.themeEntry;if(new Set(['wallpaper','icons','lock-settings']).has(target)){event.preventDefault();APP.pageManager.open(target,{appId:'theme'});return}}
      });
      APP.refs.appLayer.addEventListener('keydown',event=>{
        if(event.key!=='Enter'&&event.key!==' ')return;
        const editorTarget=event.target.closest?.('[data-editor]');
        if(editorTarget&&event.target===editorTarget){event.preventDefault();APP.editor.open(editorTarget.dataset.editor);return}
        const avatarEditor=event.target.closest?.('[data-settings-avatar-editor]');if(!avatarEditor)return;
        event.preventDefault();APP.editor.open(avatarEditor.dataset.settingsAvatarEditor)
      });
      addEventListener('keydown',event=>{
        if(event.key==='Escape'&&APP.modal.isOpen()){APP.modal.cancel();return}
        if(event.key==='Escape'&&APP.pageManager.isOpen()){APP.pageManager.back();return}
        if(APP.modal.isOpen()||(event.key!=='Enter'&&event.key!==' '))return;
        const target=event.target instanceof HTMLElement?event.target.closest('[data-editor]'):null;
        if(!target||event.target!==target)return;
        event.preventDefault();APP.editor.open(target.dataset.editor)
      });
      addEventListener('pagehide',()=>APP.images.shutdown(),{once:true})
    },
    async init(){
      APP.state.runtime.phase='protocol';this.protocolRuntime.init();this.featureRuntime.assertBuild();this.featureRuntime.assertRoutes(this.config.routes);this.cacheRefs();this.lockScreen.init();this.appRegistry.init(this.config.apps);this.appManager.init(this.config.routes);this.pageManager.init(this.config.pages);window.openApp=appId=>APP.openApp(appId);this.home.renderCalendar();this.home.startDiaryDate();this.home.startChatClock();this.home.bindPager();
      const componentTypes=[...Object.keys(this.config.components),...Object.keys(this.config.themeImages||{})];
      componentTypes.forEach(type=>{this.editor.values[type]=this.editor.normalize(type,this.editor.definition(type).defaultState)});
      this.bindGlobalEvents();APP.state.page.index=0;this.home.syncPager();this.home.setX(0,false);
      try{
        APP.state.runtime.phase='storage';await this.store.init();await this.store.migrateNeutralStorageKeys();await this.store.migrateRosterToShared();await this.auth.init();await this.images.init();
        const apiKeys=this.apiPage.settingKeys(),themeWallpaperKey=this.config.theme.wallpaper.settingKey,themeLockWallpaperKey=this.config.theme.lockWallpaper.settingKey,themeIconsKey=this.config.theme.icons.settingKey,themeLockKey=this.config.theme.lockScreen.settingKey,worldbookKey=this.config.worldbook.settingKey,rosterKey=this.config.roster.settingKey,rosterRelationKey=this.config.roster.relationSettingKey,communicationOwnerKey='communicationOwnerId',startupKeys=[...componentTypes,themeWallpaperKey,themeLockWallpaperKey,themeIconsKey,themeLockKey,apiKeys.config,apiKeys.presets,worldbookKey,rosterKey,rosterRelationKey,communicationOwnerKey];
        APP.state.runtime.phase='settings';const snapshot=await this.store.getSettings(startupKeys);
        componentTypes.forEach(type=>{this.editor.values[type]=this.editor.normalize(type,snapshot.get(type))});
        const startupAssetIds=new Set();for(const type of componentTypes)this.store.collectAssetIds(this.editor.values[type],startupAssetIds);this.store.collectAssetIds(snapshot.get(themeWallpaperKey),startupAssetIds);this.store.collectAssetIds(snapshot.get(themeLockWallpaperKey),startupAssetIds);this.store.collectAssetIds(snapshot.get(themeIconsKey),startupAssetIds);this.store.collectAssetIds(snapshot.get(themeLockKey),startupAssetIds);this.images.prime(await this.store.getAssets([...startupAssetIds]));
        await Promise.all([
          ...componentTypes.map(type=>this.editor.applyComponent(type,this.editor.values[type])),
          this.themePages.init({wallpaper:snapshot.get(themeWallpaperKey),lockWallpaper:snapshot.get(themeLockWallpaperKey),icons:snapshot.get(themeIconsKey),lockScreen:snapshot.get(themeLockKey)})
        ]);
        APP.state.runtime.shellReady=true;APP.state.runtime.phase='modules';await Promise.all([this.apiPage.init({config:snapshot.get(apiKeys.config),presets:snapshot.get(apiKeys.presets)}),this.worldbookPage.init(snapshot.get(worldbookKey)),this.rosterPage.init(snapshot.get(rosterKey),snapshot.get(rosterRelationKey))]);await this.communicationDirectory.init(snapshot.get(communicationOwnerKey));await this.conversationStore.migrate();
        APP.state.runtime.phase='first-paint';this.runtime.assertCriticalStyles();await this.runtime.waitForFonts();this.featureRuntime.ensure('chat');
        await this.runtime.nextPaint();this.home.measureProfileWallpaperCrop();this.home.syncProfileWallpaperCrop();await this.runtime.nextPaint();this.runtime.assertCriticalRender();
        APP.state.runtime.ready=true;APP.state.runtime.phase='ready';document.documentElement.dataset.appBoot='ready';this.store.scheduleReconcile()
      }catch(error){document.documentElement.dataset.appBoot='error';APP.state.runtime.phase='error';APP.runtime.report(error,'APP 初始化');APP.guide.show('初始化失败，错误详情已显示')}
    }
  };

  try{const installFeatures=window.__APP_INSTALL_FEATURES__;if(typeof installFeatures!=='function')throw new Error('功能模块未加载');installFeatures(APP);window.__APP_INSTALL_COMMUNICATION__(APP);await APP.init()}catch(error){document.documentElement.dataset.appBoot='error';APP.state.runtime.phase='fatal';APP.runtime.report(error,'启动');}
})();
