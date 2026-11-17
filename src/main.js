import '@fontsource/bebas-neue/latin-400.css';
import '@fontsource/montserrat/latin-ext-400.css';
import '@fontsource/montserrat/latin-400.css';
import '@fontsource/montserrat/latin-ext-600.css';
import '@fontsource/montserrat/latin-600.css';
import './styles.css';
import {registerSW} from 'virtual:pwa-register';
import {state,readTab} from './state';
import {connect,login,logout,message,addTrainer,renameTrainer,removeTrainer,addTask,patchTask,removeTask} from './firebase';
import {shell} from './render/app';
import {dialog} from './render/dialog';
const app=document.querySelector('#app');let deferred=false,toastTimer;const edits=new Map();
const editing=()=>app.contains(document.activeElement)&&document.activeElement?.matches('input,textarea,select');
function render(force=false){if(!force&&editing()){deferred=true;return;}deferred=false;app.innerHTML=shell();app.querySelectorAll('textarea').forEach(fit);}
function fit(el){el.style.height='auto';el.style.height=`${el.scrollHeight+2}px`;}
function toast(text){document.querySelector('#toast').textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>document.querySelector('#toast').textContent='',4500);}
function fail(e){state.error=message(e);render();}
function run(fn){try{Promise.resolve(fn()).catch(fail);}catch(e){fail(e);}}
function saveField(el){const row=el.closest('[data-id]');if(!row)return;const field=el.dataset.field,key=`${row.dataset.id}:${field}`,edit=edits.get(key);if(edit){clearTimeout(edit.timer);edits.delete(key);}if(!state.editor||!state.user)return;const task=state.tasks.find(t=>t.id===row.dataset.id);if(!task)return;let value=el.value;if(field==='title'){value=value.trim();if(!value){el.value=task.title;toast('Görev başlığı boş bırakılamaz.');return;}}if(task[field]!==value)run(()=>patchTask(task.id,{[field]:value}));}
app.addEventListener('input',event=>{const el=event.target;if(el.matches('textarea'))fit(el);if(!['title','note'].includes(el.dataset.field)||!el.closest('[data-id]'))return;const key=`${el.closest('[data-id]').dataset.id}:${el.dataset.field}`,old=edits.get(key);clearTimeout(old?.timer);const original=old?.original??state.tasks.find(t=>t.id===el.closest('[data-id]').dataset.id)?.[el.dataset.field]??'';edits.set(key,{original,timer:setTimeout(()=>saveField(el),1200)});});
app.addEventListener('keydown',event=>{const el=event.target;if(!el.closest('[data-id]')||!['title','note'].includes(el.dataset.field))return;if(event.key==='Escape'){const key=`${el.closest('[data-id]').dataset.id}:${el.dataset.field}`,edit=edits.get(key);clearTimeout(edit?.timer);el.value=edit?.original??state.tasks.find(t=>t.id===el.closest('[data-id]').dataset.id)?.[el.dataset.field]??'';edits.delete(key);el.blur();}if(event.key==='Enter'&&el.dataset.field==='title'){event.preventDefault();saveField(el);el.blur();}});
app.addEventListener('focusout',event=>{if(['title','note'].includes(event.target.dataset.field))saveField(event.target);setTimeout(()=>{if(deferred&&!editing())render();},0);});
app.addEventListener('change',event=>{const el=event.target;if(el.id==='sort'){state.sort=el.value;render(true);return;}if(el.id==='trainer-filter'){state.trainerFilter=el.value;render(true);return;}if(el.id==='priority-filter'){state.priorityFilter=el.value;render(true);return;}const row=el.closest('[data-id]');if(!row||!state.editor)return;const field=el.dataset.field;if(field==='done')run(()=>patchTask(row.dataset.id,{done:el.checked,doneAt:el.checked?Date.now():null}));else if(field==='priority')run(()=>patchTask(row.dataset.id,{priority:Number(el.value)}));else if(field==='due'||field==='trainerId')run(()=>patchTask(row.dataset.id,{[field]:el.value||null}));});
app.addEventListener('submit',event=>{if(event.target.id!=='new-task')return;event.preventDefault();const form=event.target,title=form.elements.title.value.trim(),trainerId=state.tab==='all'?form.elements.trainer.value:state.tab;if(!title||!trainerId)return;run(()=>addTask(title,trainerId));form.elements.title.value='';form.elements.title.blur();});
app.addEventListener('click',async event=>{const tab=event.target.closest('[data-tab]');if(tab){location.hash=tab.dataset.tab==='all'?'all':encodeURIComponent(tab.dataset.tab);return;}const nav=event.target.closest('[data-nav]');if(nav&&nav.dataset.nav!=='tasks'){toast(`${nav.dataset.name} · Yakında`);return;}const button=event.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;
if(action==='login'){button.disabled=true;run(()=>login().finally(()=>{if(button.isConnected)button.disabled=false;}));return;}
if(action==='logout'){for(const el of app.querySelectorAll('[data-field="title"],[data-field="note"]'))saveField(el);run(logout);return;}
if(action==='dismiss'){state.error='';render(true);return;}
if(!state.editor)return;
if(action==='add-trainer'){const name=await dialog({title:'Eğitmen ekle',value:'',label:'Eğitmenin adı',confirm:'Ekle'});if(name)run(()=>addTrainer(name));}
if(action==='edit-trainer'){const trainer=state.trainers.find(t=>t.id===state.tab);if(!trainer)return;const count=state.tasks.filter(t=>t.trainerId===trainer.id).length;const choice=await dialog({title:'Eğitmeni düzenle',body:trainer.deleting?'Silme işlemi yarıda kalmış. Eğitmeni sil seçeneğiyle tamamlayabilirsin.':'Eğitmen adını güncelleyebilir veya görevleriyle silebilirsin.',value:trainer.name,remove:true});if(!choice)return;if(!choice.remove)run(()=>renameTrainer(trainer.id,choice));else if(await dialog({title:'Eğitmeni sil?',body:`${trainer.name} ve bu eğitmene ait ${count} görev birlikte silinecek.`,confirm:'Görevleriyle sil',danger:true}))run(()=>removeTrainer(trainer.id));}
if(action==='delete-task'){const id=button.closest('[data-id]').dataset.id;const task=state.tasks.find(t=>t.id===id);if(await dialog({title:'Görevi sil?',body:task?.title,confirm:'Sil',danger:true}))run(()=>removeTask(id));}
});
window.addEventListener('hashchange',()=>{state.tab=readTab();if(state.tab!=='all'&&!state.trainers.some(t=>t.id===state.tab)&&state.loaded.trainers)state.tab='all';render(true);});
for(const type of ['online','offline'])window.addEventListener(type,()=>{state.online=navigator.onLine;render();});
const update=registerSW({onNeedRefresh(){toast('Yeni sürüm hazır. Yenilemek için bildirime dokun.');const node=document.querySelector('#toast');node.onclick=()=>{if(editing()||Object.values(state.pending).some(Boolean)){toast('Önce düzenlemeni tamamla ve kayıtların eşitlenmesini bekle.');return;}update(true);};},onOfflineReady(){toast('Uygulama çevrimdışı kullanıma hazır.');},onRegisterError(){toast('Çevrimdışı hazırlık tamamlanamadı. Uygulamayı yeniden aç.');}});
connect(force=>{if(!state.editor&&edits.size){force=true;}if(force){for(const edit of edits.values())clearTimeout(edit.timer);edits.clear();}if(state.loaded.trainers&&state.tab!=='all'&&!state.trainers.some(t=>t.id===state.tab)){state.tab='all';history.replaceState(null,'','#all');}render(force);});render();
