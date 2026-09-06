import './style.css'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
console.log('SUPABASE URL:', supabaseUrl)
console.log('SUPABASE KEY:', supabaseAnonKey)
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

const state={session:null, section:'Inicio', entries:[], reminders:[], due:[]}
const money=n=>new Intl.NumberFormat('es-UY',{style:'currency',currency:'UYU',maximumFractionDigits:0}).format(Number(n||0))

function shell(){
  document.querySelector('#app').innerHTML=`
  <div id="login" class="login-wrap"><div class="login-card"><h2>Calcos del Este</h2><p class="muted">Centro de control privado</p><div class="field"><label>Email</label><input id="email" type="email" placeholder="tu@email.com"></div><div class="field"><label>Contraseña</label><input id="password" type="password"></div><button class="btn primary" id="loginBtn">Ingresar</button><p id="loginMsg" class="muted"></p></div></div>
  <div id="appView" class="app hidden"><aside class="sidebar" id="sidebar"><div class="brand">Calcos <span>del Este</span></div><div class="nav">${['Inicio','Ingresos Calcos','Gastos Calcos','Compras materiales','Ingresos personales','Gastos diarios','Gastos casa','Gastos familia','Vencimientos','Seguros','Recordatorios','Clientes / Trabajos','Proveedores','Reportes','Notas','Configuración'].map((x,i)=>`<button data-section="${x}" class="${i===0?'active':''}">${x}</button>`).join('')}</div></aside><main class="main"><div class="topbar"><div><button class="btn soft menu-btn" id="menuBtn">☰</button><h1 id="title">Inicio</h1><div class="muted">Tu centro de control personal y de Calcos del Este</div></div><div class="actions"><button class="btn soft" id="newBtn">+ Nuevo movimiento</button><button class="btn primary" id="logoutBtn">Cerrar sesión</button></div></div><div id="content"></div></main></div>
  <div id="modal" class="modal hidden"><div class="modal-card"><div class="modal-head"><h3>Nuevo movimiento</h3><button class="close" id="closeModal">✕</button></div><div class="field"><label>Tipo</label><select id="type"><option value="income_business">Ingreso Calcos</option><option value="expense_business">Gasto Calcos</option><option value="materials">Compra material</option><option value="income_personal">Ingreso personal</option><option value="expense_home">Gasto casa</option><option value="expense_family">Gasto familia</option><option value="expense_daily">Gasto diario</option></select></div><div class="field"><label>Fecha</label><input id="date" type="date"></div><div class="field"><label>Concepto</label><input id="concept"></div><div class="field"><label>Monto</label><input id="amount" type="number" step="0.01"></div><div class="field"><label>Estado</label><select id="status"><option>Pagado</option><option>Pendiente</option><option>Parcial</option><option>Cobrado</option></select></div><div class="field"><label>Observaciones</label><textarea id="notes"></textarea></div><button class="btn primary" id="saveEntry">Guardar</button><p id="saveMsg" class="muted"></p></div></div>`
}

function renderDashboard(){
 const incomeBiz=state.entries.filter(x=>x.type==='income_business').reduce((a,b)=>a+Number(b.amount),0)
 const expBiz=state.entries.filter(x=>['expense_business','materials'].includes(x.type)).reduce((a,b)=>a+Number(b.amount),0)
 const mats=state.entries.filter(x=>x.type==='materials').reduce((a,b)=>a+Number(b.amount),0)
 const personalIn=state.entries.filter(x=>x.type==='income_personal').reduce((a,b)=>a+Number(b.amount),0)
 const personalOut=state.entries.filter(x=>['expense_home','expense_family','expense_daily'].includes(x.type)).reduce((a,b)=>a+Number(b.amount),0)
 const net=incomeBiz+personalIn-expBiz-personalOut
 document.querySelector('#content').innerHTML=`<div class="cards"><div class="card"><div class="k">Ingresos Calcos</div><div class="v">${money(incomeBiz)}</div></div><div class="card"><div class="k">Gastos Calcos</div><div class="v">${money(expBiz)}</div></div><div class="card"><div class="k">Compras materiales</div><div class="v">${money(mats)}</div></div><div class="card"><div class="k">Disponible total</div><div class="v">${money(net)}</div></div></div><div class="grid"><div><div class="panel"><h3>Últimos movimientos</h3><div class="list">${state.entries.slice(0,8).map(x=>`<div class="row"><div>${x.concept}</div><div>${x.type.replaceAll('_',' ')}</div><div>${money(x.amount)}</div><div><span class="tag ${String(x.status).toLowerCase().includes('pend')?'orange':'green'}">${x.status||''}</span></div></div>`).join('')||'<div class="muted">Sin movimientos todavía.</div>'}</div></div></div><div><div class="panel"><h3>Próximos vencimientos</h3><div class="list">${state.due.slice(0,5).map(x=>`<div><b>${x.concept}</b><div class="muted">${x.due_date||''} · ${money(x.amount)}</div></div>`).join('')||'<div class="muted">Sin vencimientos.</div>'}</div></div><div class="panel"><h3>Recordatorios</h3><div class="list">${state.reminders.slice(0,5).map(x=>`<div>${x.title}<div class="muted">${x.date||''}</div></div>`).join('')||'<div class="muted">Sin recordatorios.</div>'}</div></div></div></div>`
}

function renderGeneric(name){document.querySelector('#content').innerHTML=`<div class="panel"><h3>${name}</h3><p class="muted">Módulo listo para ampliar. En esta primera versión, los movimientos se cargan desde “+ Nuevo movimiento” y alimentan el Dashboard automáticamente.</p></div>`}

async function loadData(){
 if(!supabase || !state.session){state.entries=[];state.reminders=[];state.due=[];renderDashboard();return}
 const uid=state.session.user.id
 const {data:e}=await supabase.from('entries').select('*').eq('user_id',uid).order('date',{ascending:false})
 const {data:r}=await supabase.from('reminders').select('*').eq('user_id',uid).order('date',{ascending:true})
 const {data:d}=await supabase.from('due_items').select('*').eq('user_id',uid).order('due_date',{ascending:true})
 state.entries=e||[];state.reminders=r||[];state.due=d||[];renderDashboard()
}

function bind(){
 document.querySelector('#loginBtn').onclick=async()=>{
  const msg=document.querySelector('#loginMsg');msg.textContent=''
  if(!supabase){msg.textContent='Falta configurar Supabase en .env';return}
  const email=document.querySelector('#email').value, password=document.querySelector('#password').value
  const {data,error}=await supabase.auth.signInWithPassword({email,password})
  if(error){msg.textContent=error.message;return}
  state.session=data.session;document.querySelector('#login').classList.add('hidden');document.querySelector('#appView').classList.remove('hidden');await loadData()
 }
 document.querySelector('#logoutBtn').onclick=async()=>{if(supabase) await supabase.auth.signOut();location.reload()}
 document.querySelector('#newBtn').onclick=()=>document.querySelector('#modal').classList.remove('hidden')
 document.querySelector('#closeModal').onclick=()=>document.querySelector('#modal').classList.add('hidden')
 document.querySelector('#menuBtn').onclick=()=>document.querySelector('#sidebar').classList.toggle('open')
 document.querySelectorAll('[data-section]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-section]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');state.section=btn.dataset.section;document.querySelector('#title').textContent=state.section;state.section==='Inicio'?renderDashboard():renderGeneric(state.section);document.querySelector('#sidebar').classList.remove('open')})
 document.querySelector('#saveEntry').onclick=async()=>{
  const msg=document.querySelector('#saveMsg');msg.textContent=''
  if(!supabase||!state.session){msg.textContent='Debes iniciar sesión.';return}
  const payload={user_id:state.session.user.id,type:document.querySelector('#type').value,date:document.querySelector('#date').value,concept:document.querySelector('#concept').value,amount:Number(document.querySelector('#amount').value||0),status:document.querySelector('#status').value,notes:document.querySelector('#notes').value}
  const {error}=await supabase.from('entries').insert(payload)
  if(error){msg.textContent=error.message;return}
  document.querySelector('#modal').classList.add('hidden');await loadData()
 }
}

shell();bind();
if(supabase){const {data}=await supabase.auth.getSession(); if(data.session){state.session=data.session;document.querySelector('#login').classList.add('hidden');document.querySelector('#appView').classList.remove('hidden');await loadData()}}
