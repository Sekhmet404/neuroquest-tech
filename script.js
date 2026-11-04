/* NEUROQUEST TECH V4
   Código comentado para aprender: todas las funciones trabajan localmente.
   No hay conexión a API ni inteligencia artificial. */
'use strict';
const KEY='neuroquest_v4';
const $=(selector)=>document.querySelector(selector);
const $$=(selector)=>[...document.querySelectorAll(selector)];
// Cargamos datos guardados. Si aún no existen, empezamos sin misiones.
let state={avatar:'rebelde',missions:[],large:false,contrast:false,reading:false,focus:false,visualTime:false};
try { const saved=JSON.parse(localStorage.getItem(KEY)); if(saved && typeof saved==='object') state={...state,...saved}; } catch(e){ console.warn('Datos guardados no disponibles',e); }
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){console.warn('No se ha podido guardar',e);}}
function exportBackup(){
 try{
  const raw=localStorage.getItem(KEY),data=raw?JSON.parse(raw):null;
  if(!data||typeof data!=='object'||Array.isArray(data)||!Array.isArray(data.missions)){alert('No hay datos válidos para exportar.');return;}
  const now=new Date(),date=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=`neuroquest-backup-${date}.json`;link.click();URL.revokeObjectURL(url);
  alert('Copia de seguridad descargada correctamente.');
 }catch(e){alert('No se ha podido exportar la copia de seguridad.');}
}
const BACKUP_ROOT_KEYS=['avatar','missions','large','contrast','reading','focus','visualTime'];
const BACKUP_MISSION_KEYS=['id','goal','deadline','daily','difficulty','steps'];
const BACKUP_STEP_KEYS=['id','name','minutes','done'];
function hasExactKeys(value,keys){const actual=Object.keys(value).sort(),expected=[...keys].sort();return actual.length===expected.length&&actual.every((key,index)=>key===expected[index]);}
function validIdentifier(value){return typeof value==='string'&&value.trim().length>0&&value.length<=200;}
function validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const [year,month,day]=value.split('-').map(Number),date=new Date(year,month-1,day);return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day;}
function validateBackupData(data){
 if(!data||typeof data!=='object'||Array.isArray(data)||!hasExactKeys(data,BACKUP_ROOT_KEYS))throw new Error('La raíz no coincide con el esquema de NeuroQuest.');
 if(!Object.prototype.hasOwnProperty.call(AVATARS,data.avatar))throw new Error('El avatar no es válido.');
 for(const key of ['large','contrast','reading','focus','visualTime'])if(typeof data[key]!=='boolean')throw new Error(`El ajuste ${key} no es válido.`);
 if(!Array.isArray(data.missions)||data.missions.length>1000)throw new Error('La lista de misiones no es válida.');
 const missionIds=new Set();
 for(const mission of data.missions){
  if(!mission||typeof mission!=='object'||Array.isArray(mission)||!hasExactKeys(mission,BACKUP_MISSION_KEYS))throw new Error('Una misión tiene una estructura inválida.');
  if(!validIdentifier(mission.id)||missionIds.has(mission.id))throw new Error('Los identificadores de misión no son válidos.');
  missionIds.add(mission.id);
  if(typeof mission.goal!=='string'||mission.goal.trim().length===0||mission.goal.length>5000)throw new Error('El objetivo de una misión no es válido.');
  if(!validDate(mission.deadline))throw new Error('La fecha de una misión no es válida.');
  if(!Number.isInteger(mission.daily)||mission.daily<15||mission.daily>720)throw new Error('Los minutos diarios de una misión no son válidos.');
  if(!['baja','media','alta'].includes(mission.difficulty))throw new Error('La complejidad de una misión no es válida.');
  if(!Array.isArray(mission.steps)||mission.steps.length>1000)throw new Error('Las submisiones no son válidas.');
  const stepIds=new Set();
  for(const step of mission.steps){
   if(!step||typeof step!=='object'||Array.isArray(step)||!hasExactKeys(step,BACKUP_STEP_KEYS))throw new Error('Una submisión tiene una estructura inválida.');
   if(!validIdentifier(step.id)||stepIds.has(step.id))throw new Error('Los identificadores de submisión no son válidos.');
   stepIds.add(step.id);
   if(typeof step.name!=='string'||step.name.trim().length===0||step.name.length>5000)throw new Error('El nombre de una submisión no es válido.');
   if(!Number.isInteger(step.minutes)||step.minutes<5||step.minutes>1440)throw new Error('Los minutos de una submisión no son válidos.');
   if(typeof step.done!=='boolean')throw new Error('El estado de una submisión no es válido.');
  }
 }
 return data;
}
function readBackupFile(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('No se pudo leer el archivo.'));reader.readAsText(file);});}
async function importBackup(file){
 try{
  const text=await readBackupFile(file);if(!text.trim())throw new Error('El archivo está vacío.');
  let parsed;try{parsed=JSON.parse(text);}catch(e){throw new Error('El archivo no contiene JSON válido.');}
  const data=validateBackupData(parsed),steps=data.missions.reduce((count,mission)=>count+mission.steps.length,0),avatar=AVATARS[data.avatar].name;
  const summary=`Resumen de la copia:\n- Misiones: ${data.missions.length}\n- Pasos: ${steps}\n- Avatar: ${avatar}\n\nEsta operación sustituirá tus datos actuales.\n¿Quieres continuar?`;
  if(!confirm(summary))return;
  const serialized=JSON.stringify(data);try{localStorage.setItem(KEY,serialized);}catch(e){alert('No se pudo guardar la copia. Tus datos actuales no se han sustituido.');return;}
  state=data;try{render();applySettings();}catch(e){location.reload();return;}
  alert('Copia de seguridad importada correctamente.');
 }catch(e){alert(`No se puede importar la copia: ${e.message||'error desconocido'}`);}
}
const uid=()=> (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()));
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=m=>`${Math.floor(m/60)} h ${m%60} min`;
// Plantillas para distintas tareas. La persona puede modificar cualquier paso.
function suggest(goal,difficulty){
 const g=goal.toLowerCase();
 let steps;
 if(/auditor|norma|cumplimiento|evidencia/.test(g)) steps=['Definir alcance y objetivo','Revisar requisitos y documentación','Preparar lista de comprobación','Reunir evidencias','Revisar hallazgos y pendientes'];
 else if(/estudi|examen|aprend|tema|curso/.test(g)) steps=['Revisar temario y objetivos','Leer el primer bloque','Preparar resumen visual','Practicar con ejercicios','Repasar y comprobar conocimientos'];
 else if(/limpi|ordenar|casa|habitaci|armario/.test(g)) steps=['Preparar materiales y despejar espacio','Recoger y clasificar objetos','Limpiar una primera zona','Continuar con otra zona','Revisar y guardar materiales'];
 else if(/presentaci|diapositiv|exponer/.test(g)) steps=['Definir mensaje principal','Crear guion breve','Preparar diapositivas','Revisar diseño y legibilidad','Ensayar la presentación'];
 else if(/program|aplicaci|web|código|codigo/.test(g)) steps=['Definir funciones mínimas','Organizar archivos y estructura','Implementar primera función','Probar y corregir errores','Documentar y revisar'];
 else if(/compr|supermercado|recado/.test(g)) steps=['Revisar lo que falta','Preparar lista y presupuesto','Organizar recorrido','Realizar compra o recado','Guardar y comprobar pendientes'];
 else steps=['Definir el resultado esperado','Preparar materiales e información','Realizar la primera parte','Continuar y resolver pendientes','Revisar y dar por terminado'];
 const base=difficulty==='alta'?60:difficulty==='baja'?25:40;
 return steps.map((name,i)=>({id:uid(),name,minutes:base+(i===2?15:0),done:false}));
}
// Fecha local sin ambigüedades UTC: evitamos errores de un día por husos horarios.
function parseDay(iso){const [y,m,d]=iso.split('-').map(Number);return new Date(y,m-1,d,12);}
function daysLeft(iso){return Math.max(0,Math.ceil((parseDay(iso)-new Date())/86400000));}
const TODAY_DEFAULT_LIMIT=45,TODAY_MAX_TASKS=3;
function localCalendarNumber(date){return Date.UTC(date.getFullYear(),date.getMonth(),date.getDate());}
function calendarDaysUntil(iso,today=new Date()){
 const [year,month,day]=iso.split('-').map(Number),deadline=Date.UTC(year,month-1,day),current=localCalendarNumber(today);
 return Math.round((deadline-current)/86400000);
}
// Las misiones vencidas conservan una ventana mínima de un día para evitar divisiones por cero.
function calculateTodayPlan(missions,limit=TODAY_DEFAULT_LIMIT,maxTasks=TODAY_MAX_TASKS,today=new Date()){
 const candidates=[],excluded=[],safeLimit=Math.max(0,Number(limit)||0),safeMaxTasks=Math.max(0,Math.floor(Number(maxTasks)||0));
 missions.forEach((mission,missionIndex)=>{
  const stepIndex=mission.steps.findIndex(step=>!step.done);if(stepIndex<0)return;
  const step=mission.steps[stepIndex],daysUntil=calendarDaysUntil(mission.deadline,today),pendingMinutes=mission.steps.filter(item=>!item.done).reduce((sum,item)=>sum+Math.max(0,Number(item.minutes)||0),0),dailyMinutes=Math.max(1,Number(mission.daily)||0),availableDays=Math.max(1,daysUntil+1);
  candidates.push({step:{...step,mission:mission.goal,missionId:mission.id,deadline:mission.deadline},missionIndex,stepIndex,daysUntil,pendingMinutes,pressure:pendingMinutes/(availableDays*dailyMinutes),minutes:Math.max(0,Number(step.minutes)||0)});
 });
 candidates.sort((a,b)=>{
  const overdueA=a.daysUntil<0?0:1,overdueB=b.daysUntil<0?0:1;
  return overdueA-overdueB||a.daysUntil-b.daysUntil||b.pressure-a.pressure||a.minutes-b.minutes||a.missionIndex-b.missionIndex||a.stepIndex-b.stepIndex;
 });
 const tasks=[];let plannedMinutes=0;
 for(const candidate of candidates){
  const remaining=safeLimit-plannedMinutes;
  if(tasks.length>=safeMaxTasks){excluded.push({task:candidate.step,reason:'max-tasks'});continue;}
  if(candidate.minutes>remaining){excluded.push({task:candidate.step,reason:remaining<=0?'no-remaining-time':'does-not-fit'});continue;}
  tasks.push(candidate.step);plannedMinutes+=candidate.minutes;
 }
 return {tasks,plannedMinutes,remainingMinutes:Math.max(0,safeLimit-plannedMinutes),candidateCount:candidates.length,excludedCount:excluded.length,excluded,status:tasks.length?'planned':candidates.length?'no-fit':'no-pending'};
}
function total(m){return m.steps.reduce((a,s)=>a+Math.max(0,Number(s.minutes)||0),0);}
function allSteps(){return state.missions.flatMap(m=>m.steps);}
function updateXP(){const completed=allSteps().filter(s=>s.done).length, xp=completed*25,level=1+Math.floor(xp/100);$('#level').textContent=`NIVEL ${level}`;$('#xptext').textContent=`${xp%100} / 100 XP · ${xp} XP total`;$('#xpbar').style.width=`${xp%100}%`;}
// Al elegir un alter ego actualizamos también el retrato grande del lateral.
// Rebelde tiene ilustración de cuerpo entero; los otros dos tienen retratos
// ampliados sin deformarlos. Más adelante pueden sustituirse por ilustraciones verticales.
const AVATARS={
 rebelde:{icon:'assets/rebelde.png',image:'assets/hero.png',name:'REBELDE',alt:'Rebelde, personaje urbano de pelo blanco'},
 estratega:{icon:'assets/estratega-icon.png',image:'assets/strategist.png',name:'ESTRATEGA',alt:'Estratega, personaje de pelo morado y gafas'},
 explorador:{icon:'assets/explorador-icon.png',image:'assets/explorer.png',name:'EXPLORADOR',alt:'Explorador, personaje de pelo rojo y gafas naranjas'}
};
function renderAvatars(){
 if(!AVATARS[state.avatar])state.avatar='rebelde';
  $$('.avatar').forEach(b=>{const info=AVATARS[b.dataset.avatar],yes=b.dataset.avatar===state.avatar;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes));if(info){const icon=b.querySelector('img');if(icon)icon.src=info.icon;}});
 const hero=$('#hero-image'),info=AVATARS[state.avatar];
 hero.src=info.image;hero.alt=info.alt;
 $('#hero-name').textContent=info.name;
}
// Navegación por VISTAS: los botones no se limitan a mover el scroll.
// Inicio muestra el tablero; cada otra opción presenta solo su sección.
const VIEWS=['inicio','misiones','calendario','enfoque','progreso','ajustes'];
function navigate(hash){
 const view=hash.replace('#','');
 if(!VIEWS.includes(view))return;
 document.body.dataset.view=view;
 $$('nav a').forEach(a=>{
  const yes=a.getAttribute('href')===hash;
  a.classList.toggle('active',yes);
  if(yes)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
 });
 window.scrollTo({top:0,behavior:'instant'});
}
$$('nav a').forEach(a=>a.addEventListener('click',e=>{
 e.preventDefault();const hash=a.getAttribute('href');
 history.replaceState(null,'',hash);navigate(hash);
}));
window.addEventListener('hashchange',()=>navigate(location.hash||'#inicio'));
$$('.avatar').forEach(b=>b.addEventListener('click',()=>{state.avatar=b.dataset.avatar;save();renderAvatars();}));
const avatarChoices=$('.avatars');
function closeAvatarPopover(choice,returnFocus=false){
 const info=choice?.querySelector('.avatar-info'),popover=choice?.querySelector('.avatar-popover');
 if(!info||!popover)return;
 choice.classList.remove('is-open');
 info.setAttribute('aria-expanded','false');
 popover.setAttribute('aria-hidden','true');
 if(returnFocus){
  choice.dataset.suppressFocus='true';
  info.focus();
  setTimeout(()=>delete choice.dataset.suppressFocus,0);
 }
}
function closeAllAvatarPopovers(except=null){
 $$('.avatar-choice.is-open').forEach(choice=>{if(choice!==except)closeAvatarPopover(choice);});
}
function openAvatarPopover(choice){
 if(!choice)return;
 closeAllAvatarPopovers(choice);
 choice.classList.remove('is-dismissed');
 const info=choice.querySelector('.avatar-info'),popover=choice.querySelector('.avatar-popover');
 if(!info||!popover)return;
 choice.classList.add('is-open');
 info.setAttribute('aria-expanded','true');
 popover.setAttribute('aria-hidden','false');
}
avatarChoices.addEventListener('click',e=>{
 const info=e.target.closest('.avatar-info');
 if(!info)return;
 const choice=info.closest('.avatar-choice');
 if(choice?.classList.contains('is-open'))closeAvatarPopover(choice);else openAvatarPopover(choice);
});
avatarChoices.addEventListener('focusin',e=>{
  const target=e.target.closest('.avatar-popover');
 const choice=target?.closest('.avatar-choice');
 if(target&&choice?.dataset.suppressFocus!=='true')openAvatarPopover(choice);
});
avatarChoices.addEventListener('pointerover',e=>{
 const choice=e.target.closest('.avatar-choice');
 if(choice&&!choice.contains(e.relatedTarget))choice.classList.remove('is-dismissed');
});
document.addEventListener('pointerdown',e=>{
 if(!e.target.closest('.avatar-choice'))closeAllAvatarPopovers();
});
document.addEventListener('focusin',e=>{
 if(!e.target.closest('.avatar-choice'))closeAllAvatarPopovers();
});
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape')return;
 const choice=$('.avatar-choice.is-open');
 if(!choice)return;
 e.preventDefault();
 choice.classList.add('is-dismissed');
 closeAvatarPopover(choice,true);
});
// Crear misión principal: fecha, minutos diarios y complejidad.
$('#mission-form').addEventListener('submit',e=>{
 e.preventDefault();const goal=$('#goal').value.trim(),deadline=$('#deadline').value,daily=Number($('#daily').value),difficulty=$('#difficulty').value;
 if(!goal||!deadline||!Number.isFinite(daily)||daily<15){alert('Escribe un objetivo, una fecha y al menos 15 minutos diarios.');return;}
 if(parseDay(deadline)<new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate())){alert('La fecha límite no puede estar en el pasado.');return;}
 state.missions.unshift({id:uid(),goal,deadline,daily,difficulty,steps:suggest(goal,difficulty)});save();render();$('#goal').value='';history.replaceState(null,'','#misiones');navigate('#misiones');
});
// Renderizado seguro: solo insertamos contenido del usuario escapado.
function renderMissions(){const el=$('#missions');if(!state.missions.length){el.innerHTML='<p class="empty">Aquí aparecerán las submisiones cuando generes tu plan.</p>';return;}
 el.innerHTML=state.missions.map(m=>`<article class="mission" data-id="${m.id}"><div class="mission-head">${escapeHTML(m.goal)}</div><p class="mission-meta">Fecha límite: ${escapeHTML(m.deadline)} · ${m.daily} min/día · ${escapeHTML(m.difficulty)}</p>${m.steps.map(s=>`<div class="step" data-step="${s.id}"><div class="step-head"><input type="checkbox" aria-label="Completar ${escapeHTML(s.name)}" data-action="done" ${s.done?'checked':''}><span class="step-name"><input aria-label="Nombre de la submisión" data-action="name" value="${escapeHTML(s.name)}"></span><input class="step-min" type="number" min="5" max="1440" aria-label="Minutos estimados" data-action="minutes" value="${s.minutes}"><button type="button" data-action="remove-step" aria-label="Eliminar submisión">✕</button></div></div>`).join('')}<div class="mission-actions"><button type="button" data-action="add-step">+ Añadir paso</button><button type="button" data-action="remove-mission">Eliminar misión</button></div></article>`).join('');}
// Delegación de eventos: sirve también para submisiones creadas después.
$('#missions').addEventListener('change',e=>{const action=e.target.dataset.action;if(!['done','name','minutes'].includes(action))return;const row=e.target.closest('[data-step]'),article=e.target.closest('[data-id]');if(!row||!article)return;const m=state.missions.find(x=>x.id===article.dataset.id),s=m?.steps.find(x=>x.id===row.dataset.step);if(!s)return;
 if(action==='done')s.done=e.target.checked;if(action==='name')s.name=e.target.value.trim()||'Paso sin título';if(action==='minutes')s.minutes=Math.max(5,Math.min(1440,Number(e.target.value)||5));save();render();});
$('#missions').addEventListener('click',e=>{const btn=e.target.closest('button[data-action]');if(!btn)return;const article=btn.closest('[data-id]');const m=state.missions.find(x=>x.id===article?.dataset.id);if(!m)return;
 if(btn.dataset.action==='add-step')m.steps.push({id:uid(),name:'Nueva submisión',minutes:25,done:false});
 if(btn.dataset.action==='remove-step')m.steps=m.steps.filter(s=>s.id!==btn.closest('[data-step]').dataset.step);
 if(btn.dataset.action==='remove-mission'&&confirm('¿Eliminar esta misión y todas sus submisiones?'))state.missions=state.missions.filter(x=>x.id!==m.id);
 save();render();});
function renderToday(){
 const plan=calculateTodayPlan(state.missions),pending=plan.tasks;
 const urgency=s=>{const days=calendarDaysUntil(s.deadline);if(days<0)return '<span class="today-urgency is-overdue">Vencida</span>';if(days===0)return '<span class="today-urgency">Vence hoy</span>';if(days===1)return '<span class="today-urgency">Vence mañana</span>';return '<span class="today-urgency">Fecha límite: '+escapeHTML(s.deadline)+'</span>';};
 const summary=`<div class="today-summary"><span><strong>${plan.plannedMinutes} min</strong> planificados</span><span>Límite: <strong>${TODAY_DEFAULT_LIMIT} min</strong></span><span>Restan: <strong>${plan.remainingMinutes} min</strong></span></div>`;
 const explanation='<p class="today-hint">Recomendación automática: se actualiza al completar pasos.</p>';
 let content='';
 if(plan.status==='planned')content=pending.map(s=>`<div class="today-item"><span class="today-task"><span class="today-task-name">□ ${escapeHTML(s.name)}</span><small>Misión: ${escapeHTML(s.mission)}</small></span><span class="today-task-meta"><strong>${s.minutes} min</strong>${urgency(s)}</span></div>`).join('');
 if(plan.status==='no-fit')content='<p class="today-status is-warning" role="status">Hay tareas pendientes, pero ninguna cabe en los minutos que quedan hoy.</p>';
 if(plan.status==='no-pending')content='<p class="today-status" role="status">No hay tareas pendientes. Puedes descansar.</p>';
 const excluded=plan.excludedCount?`<p class="today-excluded" role="status">${plan.excludedCount} tarea${plan.excludedCount===1?'':'s'} pendiente${plan.excludedCount===1?'':'s'} queda${plan.excludedCount===1?'':'n'} fuera de esta recomendación por tiempo disponible o límite de tareas.</p>`:'';
 $('#today').innerHTML=summary+content+excluded+explanation;
}
function calculateGlobalProgress(missions){
 const list=Array.isArray(missions)?missions:[],steps=list.flatMap(m=>Array.isArray(m.steps)?m.steps:[]),completedSteps=steps.filter(step=>step.done).length,pendingSteps=steps.length-completedSteps,pendingMinutes=steps.filter(step=>!step.done).reduce((sum,step)=>sum+Math.max(0,Number(step.minutes)||0),0);
 return {missions:list.length,totalSteps:steps.length,completedSteps,pendingSteps,percentage:steps.length?Math.round(completedSteps/steps.length*100):0,pendingMinutes,status:steps.length?'has-data':'no-data'};
}
function renderGlobalProgress(){
 const summary=calculateGlobalProgress(state.missions),el=$('#global-progress');
 if(!el)return;
 const emptyMessage=summary.status==='no-data'?'<p class="muted" role="status">Aún no hay pasos para calcular el progreso global.</p>':'';
 el.innerHTML=`<div class="global-progress-summary"><div class="work-row">Misiones: ${summary.missions}</div><div class="work-row">Pasos: ${summary.totalSteps} total · ${summary.completedSteps} completados · ${summary.pendingSteps} pendientes</div><div class="work-row">Minutos pendientes: ${summary.pendingMinutes} min</div><div class="global-progress-value"><strong>Progreso global: ${summary.percentage} %</strong><div class="progress-track" role="progressbar" aria-label="Progreso global de pasos" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${summary.percentage}"><div style="width:${summary.percentage}%"></div></div></div></div>${emptyMessage}`;
}
function calculateMissionViability(mission,today=new Date()){
 const steps=Array.isArray(mission?.steps)?mission.steps:[],pendingSteps=steps.filter(step=>!step.done),pendingMinutes=pendingSteps.reduce((sum,step)=>sum+Math.max(0,Number(step.minutes)||0),0),daysUntil=calendarDaysUntil(mission.deadline,today),availableDays=Math.max(1,daysUntil+1),dailyMinutes=Math.max(0,Number(mission.daily)||0),capacityMinutes=availableDays*dailyMinutes,reservedMinutes=Math.ceil(pendingMinutes*1.3);
 let status;
 if(!steps.length)status='no-steps';
 else if(!pendingSteps.length)status='completed';
 else if(daysUntil<0)status='overdue';
 else status=reservedMinutes<=capacityMinutes?'viable':'not-viable';
 return {mission,steps:steps.length,pendingSteps:pendingSteps.length,pendingMinutes,reservedMinutes,daysUntil,availableDays,capacityMinutes,status};
}
function renderWork(){
 const el=$('#workload');
 if(!el)return;
 if(!state.missions.length){el.innerHTML='<p class="muted">Aún no hay misiones para comprobar su viabilidad.</p>';return;}
 const labels={'no-steps':'Sin pasos','completed':'Completada','overdue':'Vencida','viable':'Viable','not-viable':'No viable'};
 el.innerHTML=state.missions.map(mission=>{const result=calculateMissionViability(mission),label=labels[result.status];return `<article class="mission-viability"><h3 class="mission-viability-title">${escapeHTML(mission.goal)}</h3><p class="mission-viability-meta">Fecha límite: ${escapeHTML(mission.deadline)} · Días disponibles: ${result.availableDays}</p><div class="work-row">◷ Minutos pendientes: ${fmt(result.pendingMinutes)}</div><div class="work-row">▦ Con margen del 30 %: ${fmt(result.reservedMinutes)}</div><div class="work-row">◉ Capacidad disponible: ${fmt(result.capacityMinutes)}</div><div class="status viability-status viability-${result.status}" role="status">Estado: ${label}</div></article>`;}).join('');
}
function renderCalendar(){
 const el=$('#calendar-content');
 if(!state.missions.length){el.innerHTML='<p class="muted">Aún no hay fechas límite. Crea una misión para empezar.</p>';return;}
 el.innerHTML=state.missions.slice().sort((a,b)=>a.deadline.localeCompare(b.deadline)).map(m=>{
  const [y,mo,d]=m.deadline.split('-');
  const done=m.steps.filter(s=>s.done).length;
  return `<div class="calendar-entry"><strong>${escapeHTML(d+'/'+mo+'/'+y)}</strong><span>${escapeHTML(m.goal)}</span><small>${done}/${m.steps.length} pasos</small></div>`;
 }).join('');
}
function render(){renderAvatars();renderMissions();renderToday();renderGlobalProgress();renderWork();renderCalendar();updateXP();}
// Temporizador Pomodoro de 25 minutos, con pausa y reinicio.
const POMODORO_DURATION=25*60;
let seconds=POMODORO_DURATION,timer=null,lastTick=0;
function updateVisualTime(){const remaining=Math.max(0,Math.min(POMODORO_DURATION,seconds)),elapsed=POMODORO_DURATION-remaining,percent=Math.round(elapsed/POMODORO_DURATION*100),progress=$('#visual-progress');if(!progress)return;const remainingText=`${Math.ceil(remaining/60)} min restantes`,elapsedText=`${percent}% transcurrido`;progress.max=POMODORO_DURATION;progress.value=remaining;progress.setAttribute('aria-valuenow',String(remaining));progress.setAttribute('aria-valuetext',`${remainingText}, ${elapsedText}`);$('#visual-remaining').textContent=remainingText;$('#visual-elapsed').textContent=elapsedText;}
function clock(){const mm=String(Math.floor(seconds/60)).padStart(2,'0'),ss=String(seconds%60).padStart(2,'0');$('#clock').textContent=`${mm}:${ss}`;updateVisualTime();}
$('#start').addEventListener('click',()=>{if(timer)return;lastTick=Date.now();timer=setInterval(()=>{const now=Date.now(),elapsed=Math.floor((now-lastTick)/1000);if(elapsed<1)return;lastTick+=elapsed*1000;seconds=Math.max(0,seconds-elapsed);clock();if(seconds===0){clearInterval(timer);timer=null;alert('¡Misión de enfoque terminada! Toca descansar.');}},250);});
$('#pause').addEventListener('click',()=>{clearInterval(timer);timer=null;});
$('#reset').addEventListener('click',()=>{clearInterval(timer);timer=null;seconds=POMODORO_DURATION;clock();});
$('#font-toggle').addEventListener('click',()=>{state.large=!state.large;applySettings();save();});
$('#contrast-toggle').addEventListener('click',()=>{state.contrast=!state.contrast;applySettings();save();});
$('#reading-toggle').addEventListener('click',()=>{state.reading=!state.reading;applySettings();save();});
$('#focus-toggle').addEventListener('click',()=>{state.focus=!state.focus;applySettings();save();});
$('#visual-time-toggle').addEventListener('click',()=>{state.visualTime=!state.visualTime;applySettings();save();});
$('#export-backup').addEventListener('click',exportBackup);
$('#import-backup-button').addEventListener('click',()=>$('#import-backup').click());
$('#import-backup').addEventListener('change',e=>{const file=e.target.files?.[0];e.target.value='';if(file)importBackup(file);});
function syncSettingsToggle(selector,active){const button=$(selector),status=button?.querySelector('.setting-status');if(!button)return;button.setAttribute('aria-pressed',String(active));if(status)status.textContent=active?'✓ Activado':'Desactivado';}
function applySettings(){document.body.classList.toggle('large-text',!!state.large);document.body.classList.toggle('high-contrast',!!state.contrast);document.body.classList.toggle('reading-friendly',!!state.reading);document.body.classList.toggle('focus-mode',!!state.focus);syncSettingsToggle('#font-toggle',!!state.large);syncSettingsToggle('#contrast-toggle',!!state.contrast);syncSettingsToggle('#reading-toggle',!!state.reading);syncSettingsToggle('#focus-toggle',!!state.focus);const visualEnabled=!!state.visualTime,visualTime=$('#visual-time');visualTime.hidden=!visualEnabled;syncSettingsToggle('#visual-time-toggle',visualEnabled);if(visualEnabled)updateVisualTime();}
applySettings();render();clock();
navigate(VIEWS.includes(location.hash.slice(1))?location.hash:'#inicio');
