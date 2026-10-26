'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const source=fs.readFileSync('features.js','utf8');
const context={window:{},console,Promise,setTimeout,clearTimeout,structuredClone,requestAnimationFrame:fn=>fn()};
vm.createContext(context);vm.runInContext(source,context);
const reports=[];let storedPrefs={};let cleared=null;let openedApp=null;let history=[];let appended=[];
const APP={
  featureRuntime:{register(){},seal(version){this.version=version},ensure(id){this.ensured=id}},
  state:{roster:{items:[]},communication:{ownerId:null}},
  auth:{current(){return null}},
  modal:{esc:value=>String(value??''),confirm:async()=>true},
  rosterPage:{label:()=> '角色'},
  runtime:{report(error,scope){reports.push({error,scope})}},
  communicationDirectory:{release(){},paintAvatar(){return Promise.resolve()},label:item=>item.nickname||'好友'},
  images:{releaseConsumer(){},present(){return Promise.resolve('')}},
  guide:{show(){}},
  store:{
    async getAppData(){return {payload:structuredClone(storedPrefs)}},
    async putAppData(_app,_key,value){storedPrefs=structuredClone(value)},
    db:{settings:{},async transaction(_mode,_store,fn){return fn()}}
  },
  conversationStore:{
    async clear(ownerId,profileId){cleared=[ownerId,profileId];return 3},
    async history(){return structuredClone(history)},
    async append(ownerId,profileId,rows,options){appended.push({ownerId,profileId,rows:structuredClone(rows),options:structuredClone(options)});history.push({...rows[0],id:'m1',channel:options.channel,createdAt:1});return [history.at(-1)]}
  },
  conversationAI:{pending:new Map(),async generate(){return true}},
  openApp(id){openedApp=id;return true}
};
context.window.__APP_INSTALL_FEATURES__(APP);
assert.strictEqual(APP.featureRuntime.version,'0.0.41');
const self={id:'userid0000000000001',type:'userid'};
const friend={id:'char0000000000000001',type:'char',nickname:'Friend',account:'friend',virtualLocation:'Seoul',background:{assetId:null},avatar:{assetId:null}};
APP.state.roster.items=[self,friend];APP.auth.current=appId=>appId==='chat'?self:null;
function attrNode(){return {disabled:false,hidden:false,checked:false,textContent:'',value:'',style:{},classList:{remove(){},add(){}},setAttribute(name,value){this[name]=value}}}
const friendNodes={
  '[data-chat-friend-home]':{scrollTop:99},
  '[data-chat-friend-name]':attrNode(),
  '[data-chat-friend-ip]':attrNode(),
  '[data-chat-friend-avatar]':attrNode(),
  '[data-chat-friend-cover]':Object.assign(attrNode(),{isConnected:true}),
  '[data-chat-friend-action="block"]':attrNode(),
  '[data-chat-friend-block-label]':attrNode(),
  '[data-chat-friend-action="chat"]':attrNode(),
  '[data-chat-friend-pref="pinned"]':attrNode(),
  '[data-chat-friend-pref="muted"]':attrNode()
};
const subpages=[{dataset:{chatFriendSubpage:'moments'},hidden:true},{dataset:{chatFriendSubpage:'settings'},hidden:true}];
const threadNodes={
  '[data-chat-thread-name]':attrNode(),
  '[data-chat-thread-avatar]':attrNode(),
  '[data-chat-thread-input]':Object.assign(attrNode(),{focus(){this.focused=true}}),
  '[data-chat-thread-status]':attrNode(),
  '[data-chat-thread-send]':attrNode(),
  '[data-chat-thread-log]':Object.assign(attrNode(),{innerHTML:'',scrollTop:0,scrollHeight:100})
};
APP.chatPage.root={dataset:{}};
APP.chatPage.friendProfileRoot={hidden:true,querySelector(selector){return friendNodes[selector]||null},querySelectorAll(selector){return selector==='[data-chat-friend-subpage]'?subpages:[]}};
APP.chatPage.threadRoot={hidden:true,querySelector(selector){return threadNodes[selector]||null}};
assert.strictEqual(APP.chatPage.openFriendProfile(friend.id),true);
assert.strictEqual(APP.chatPage.friendProfileRoot.hidden,false);
assert.strictEqual(friendNodes['[data-chat-friend-home]'].scrollTop,0);
assert.strictEqual(APP.chatPage.root.dataset.chatFriendOpen,'true');
assert.strictEqual(APP.chatPage.friendId,friend.id);
assert.strictEqual(friendNodes['[data-chat-friend-name]'].textContent,'Friend');
assert.strictEqual(friendNodes['[data-chat-friend-ip]'].textContent,'IP · Seoul');
assert.strictEqual(APP.chatPage.showFriendSubpage('moments'),true);assert.strictEqual(subpages[0].hidden,false);assert.strictEqual(subpages[1].hidden,true);
APP.chatPage.closeFriendSubpage();assert(subpages.every(row=>row.hidden));
(async()=>{
  await APP.chatPage.updateFriendPreference(friend.id,{pinned:true,muted:true});
  assert.strictEqual(storedPrefs[friend.id].pinned,true);assert.strictEqual(storedPrefs[friend.id].muted,true);
  assert.strictEqual(friendNodes['[data-chat-friend-pref="pinned"]'].checked,true);assert.strictEqual(friendNodes['[data-chat-friend-pref="muted"]'].checked,true);
  await APP.chatPage.clearFriendConversation();assert.deepStrictEqual(cleared,[self.id,friend.id]);
  await APP.chatPage.openFriendChat();
  assert.strictEqual(openedApp,null,'Chat friend action must never open another app');
  assert.strictEqual(APP.chatPage.threadRoot.hidden,false);
  assert.strictEqual(APP.chatPage.threadId,friend.id);
  assert.strictEqual(APP.chatPage.root.dataset.chatThreadOpen,'true');
  assert.strictEqual(threadNodes['[data-chat-thread-name]'].textContent,'Friend');
  assert.strictEqual(threadNodes['[data-chat-thread-input]'].focused,true);
  threadNodes['[data-chat-thread-input]'].value='hello';
  await APP.chatPage.sendChatThread({elements:{message:threadNodes['[data-chat-thread-input]']}});
  assert.strictEqual(appended.length,1);assert.strictEqual(appended[0].options.channel,'chat');assert.strictEqual(appended[0].rows[0].content,'hello');
  APP.chatPage.closeChatThread();assert.strictEqual(APP.chatPage.threadRoot.hidden,true);assert.strictEqual(APP.chatPage.threadId,null);assert.strictEqual(APP.chatPage.friendProfileRoot.hidden,false);
  await APP.chatPage.updateFriendPreference(friend.id,{blocked:true});assert.strictEqual(friendNodes['[data-chat-friend-action="chat"]'].disabled,true);assert.strictEqual(friendNodes['[data-chat-friend-block-label]'].textContent,'解除拉黑');
  let clickHandler=null;const fakeButton={dataset:{chatFriendId:friend.id},addEventListener(type,handler){if(type==='click')clickHandler=handler}};APP.chatPage.bindFriendRows({querySelectorAll(){return [fakeButton]}});APP.chatPage.closeFriendProfile();let prevented=false,stopped=false;clickHandler({preventDefault(){prevented=true},stopPropagation(){stopped=true}});assert(prevented&&stopped);assert.strictEqual(APP.chatPage.friendProfileRoot.hidden,false);
  assert.strictEqual(APP.chatPage.openFriendProfile(self.id),false);assert.strictEqual(APP.chatPage.openFriendProfile('missing'),false);
  console.log(JSON.stringify({passed:31,reports:reports.map(row=>row.scope)},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
