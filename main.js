import './style.css'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

const state={
  session:null,
  section:'Inicio',
  entries:[],
  reminders:[],
  due:[],
  editingId:null
}

const money=n=>new Intl.NumberFormat('es-UY',{
  style:'currency',
  currency:'UYU',
  maximumFractionDigits:0
}).format(Number(n||0))

function shell(){
  document.querySelector('#app').innerHTML=`
  <div id="login" class="login-wrap">
    <div class="login-card">
      <h2>Calcos del Este</h2>
      <p class="muted">Centro de control privado</p>

      <div class="field">
        <label>Email</label>
        <input id="email" type="email" placeholder="tu@email.com">
      </div>

      <div class="field">
        <label>Contraseña</label>
        <input id="password" type="password">
      </div>

      <button class="btn primary" id="loginBtn">Ingresar</button>
      <p id="loginMsg" class="muted"></p>
    </div>
  </div>

  <div id="appView" class="app hidden">
    <aside class="sidebar" id="sidebar">
      <div class="brand">Calcos <span>del Este</span></div>

      <div class="nav">
        ${[
          'Inicio',
          '📁 Todos los movimientos',
          'Ingresos Calcos',
          'Gastos Calcos',
          'Compras materiales',
          'Ingresos personales',
          'Gastos diarios',
          'Gastos casa',
          'Gastos familia',
          'Vencimientos',
          'Seguros',
          'Recordatorios',
          'Clientes / Trabajos',
          'Proveedores',
          'Reportes',
          'Notas',
          'Configuración'
        ].map((x,i)=>`
          <button data-section="${x}" class="${i===0?'active':''}">
            ${x}
          </button>
        `).join('')}
      </div>
    </aside>

    <main class="main">
      <div class="topbar">
        <div>
          <button class="btn soft menu-btn" id="menuBtn">☰</button>
          <h1 id="title">Inicio</h1>
          <div class="muted">Tu centro de control personal y de Calcos del Este</div>
        </div>

        <div class="actions">
          <button class="btn soft" id="newBtn">+ Nuevo movimiento</button>
          <button class="btn primary" id="logoutBtn">Cerrar sesión</button>
        </div>
      </div>

      <div id="content"></div>
    </main>
  </div>

  <div id="modal" class="modal hidden">
    <div class="modal-card">

      <div class="modal-head">
        <h3 id="modalTitle">Nuevo movimiento</h3>
        <button class="close" id="closeModal">✕</button>
      </div>

      <div class="field">
        <label>Tipo</label>
        <select id="type">
          <option value="income_business">Ingreso Calcos</option>
          <option value="expense_business">Gasto Calcos</option>
          <option value="materials">Compra material</option>
          <option value="income_personal">Ingreso personal</option>
          <option value="expense_home">Gasto casa</option>
          <option value="expense_family">Gasto familia</option>
          <option value="expense_daily">Gasto diario</option>
        </select>
      </div>

      <div class="field">
        <label>Fecha</label>
        <input id="date" type="date">
      </div>

      <div class="field">
        <label>Concepto</label>
        <input id="concept">
      </div>

      <div class="field">
        <label>Monto</label>
        <input id="amount" type="number" step="0.01">
      </div>

      <div class="field">
        <label>Estado</label>
        <select id="status">
          <option>Pagado</option>
          <option>Pendiente</option>
          <option>Parcial</option>
          <option>Cobrado</option>
        </select>
      </div>

      <div class="field">
        <label>Observaciones</label>
        <textarea id="notes"></textarea>
      </div>

      <button class="btn primary" id="saveEntry">Guardar</button>
      <p id="saveMsg" class="muted"></p>
    </div>
  </div>
  `
}

function typeName(type){
  const names={
    income_business:'Ingreso Calcos',
    expense_business:'Gasto Calcos',
    materials:'Compra material',
    income_personal:'Ingreso personal',
    expense_home:'Gasto casa',
    expense_family:'Gasto familia',
    expense_daily:'Gasto diario'
  }
  return names[type] || type
}

function renderDashboard(){
  const incomeBiz=state.entries
    .filter(x=>x.type==='income_business')
    .reduce((a,b)=>a+Number(b.amount),0)

  const expBiz=state.entries
    .filter(x=>['expense_business','materials'].includes(x.type))
    .reduce((a,b)=>a+Number(b.amount),0)

  const mats=state.entries
    .filter(x=>x.type==='materials')
    .reduce((a,b)=>a+Number(b.amount),0)

  const personalIn=state.entries
    .filter(x=>x.type==='income_personal')
    .reduce((a,b)=>a+Number(b.amount),0)

  const personalOut=state.entries
    .filter(x=>['expense_home','expense_family','expense_daily'].includes(x.type))
    .reduce((a,b)=>a+Number(b.amount),0)

  const net=incomeBiz+personalIn-expBiz-personalOut

  document.querySelector('#content').innerHTML=`
    <div class="cards">
      <div class="card">
        <div class="k">Ingresos Calcos</div>
        <div class="v">${money(incomeBiz)}</div>
      </div>

      <div class="card">
        <div class="k">Gastos Calcos</div>
        <div class="v">${money(expBiz)}</div>
      </div>

      <div class="card">
        <div class="k">Compras materiales</div>
        <div class="v">${money(mats)}</div>
      </div>

      <div class="card">
        <div class="k">Disponible total</div>
        <div class="v">${money(net)}</div>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="panel">
          <h3>Últimos movimientos</h3>

          <div class="list">
            ${
              state.entries.slice(0,8).map(x=>`
                <div class="row">
                  <div>${x.concept}</div>
                  <div>${typeName(x.type)}</div>
                  <div>${money(x.amount)}</div>
                  <div>
                    <span class="tag ${
                      String(x.status).toLowerCase().includes('pend')
                      ? 'orange'
                      : 'green'
                    }">
                      ${x.status||''}
                    </span>
                  </div>
                  <div>
                    <button class="btn soft editBtn" data-id="${x.id}">
                      Editar
                    </button>
                  </div>
                </div>
              `).join('')
              ||
              '<div class="muted">Sin movimientos todavía.</div>'
            }
          </div>
        </div>
      </div>

      <div>
        <div class="panel">
          <h3>Próximos vencimientos</h3>

          <div class="list">
            ${
              state.due.slice(0,5).map(x=>`
                <div>
                  <b>${x.concept}</b>
                  <div class="muted">
                    ${x.due_date||''} · ${money(x.amount)}
                  </div>
                </div>
              `).join('')
              ||
              '<div class="muted">Sin vencimientos.</div>'
            }
          </div>
        </div>

        <div class="panel">
          <h3>Recordatorios</h3>

          <div class="list">
            ${
              state.reminders.slice(0,5).map(x=>`
                <div>
                  ${x.title}
                  <div class="muted">${x.date||''}</div>
                </div>
              `).join('')
              ||
              '<div class="muted">Sin recordatorios.</div>'
            }
          </div>
        </div>
      </div>
    </div>
  `

  bindEditButtons()
}

function renderAllMovements(){
  document.querySelector('#content').innerHTML=`
    <div class="panel">
      <h3>📁 Todos los movimientos</h3>

      <div class="list">
        ${
          state.entries.map(x=>`
            <div class="row">
              <div>
                <b>${x.concept}</b>
                <div class="muted">${x.date||''}</div>
              </div>

              <div>${typeName(x.type)}</div>

              <div>${money(x.amount)}</div>

              <div>
                <span class="tag ${
                  String(x.status).toLowerCase().includes('pend')
                  ? 'orange'
                  : 'green'
                }">
                  ${x.status||''}
                </span>
              </div>

              <div>
                <button class="btn soft editBtn" data-id="${x.id}">
                  Editar
                </button>
              </div>
            </div>
          `).join('')
          ||
          '<div class="muted">Todavía no hay movimientos cargados.</div>'
        }
      </div>
    </div>
  `

  bindEditButtons()
}

function renderGeneric(name){
  document.querySelector('#content').innerHTML=`
    <div class="panel">
      <h3>${name}</h3>
      <p class="muted">
        Módulo listo para ampliar. Los movimientos se cargan desde
        “+ Nuevo movimiento”.
      </p>
    </div>
  `
}

async function loadData(){
  if(!supabase || !state.session){
    state.entries=[]
    state.reminders=[]
    state.due=[]
    renderDashboard()
    return
  }

  const uid=state.session.user.id

  const {data:e}=await supabase
    .from('entries')
    .select('*')
    .eq('user_id',uid)
    .order('date',{ascending:false})

  const {data:r}=await supabase
    .from('reminders')
    .select('*')
    .eq('user_id',uid)
    .order('date',{ascending:true})

  const {data:d}=await supabase
    .from('due_items')
    .select('*')
    .eq('user_id',uid)
    .order('due_date',{ascending:true})

  state.entries=e||[]
  state.reminders=r||[]
  state.due=d||[]

  if(state.section==='📁 Todos los movimientos'){
    renderAllMovements()
  }else{
    renderDashboard()
  }
}

function openNewMovement(){
  state.editingId=null

  document.querySelector('#modalTitle').textContent='Nuevo movimiento'
  document.querySelector('#saveEntry').textContent='Guardar'

  document.querySelector('#type').value='income_business'
  document.querySelector('#date').value=new Date().toISOString().slice(0,10)
  document.querySelector('#concept').value=''
  document.querySelector('#amount').value=''
  document.querySelector('#status').value='Pagado'
  document.querySelector('#notes').value=''

  document.querySelector('#modal').classList.remove('hidden')
}

function openEditMovement(id){
  const entry=state.entries.find(x=>String(x.id)===String(id))
  if(!entry) return

  state.editingId=entry.id

  document.querySelector('#modalTitle').textContent='Editar movimiento'
  document.querySelector('#saveEntry').textContent='Guardar cambios'

  document.querySelector('#type').value=entry.type
  document.querySelector('#date').value=entry.date||''
  document.querySelector('#concept').value=entry.concept||''
  document.querySelector('#amount').value=entry.amount||''
  document.querySelector('#status').value=entry.status||'Pagado'
  document.querySelector('#notes').value=entry.notes||''

  document.querySelector('#modal').classList.remove('hidden')
}

function bindEditButtons(){
  document.querySelectorAll('.editBtn').forEach(btn=>{
    btn.onclick=()=>openEditMovement(btn.dataset.id)
  })
}

function bind(){
  document.querySelector('#loginBtn').onclick=async()=>{
    const msg=document.querySelector('#loginMsg')
    msg.textContent=''

    if(!supabase){
      msg.textContent='Falta configurar Supabase en .env'
      return
    }

    const email=document.querySelector('#email').value
    const password=document.querySelector('#password').value

    const {data,error}=await supabase.auth.signInWithPassword({
      email,
      password
    })

    if(error){
      msg.textContent=error.message
      return
    }

    state.session=data.session

    document.querySelector('#login').classList.add('hidden')
    document.querySelector('#appView').classList.remove('hidden')

    await loadData()
  }

  document.querySelector('#logoutBtn').onclick=async()=>{
    if(supabase) await supabase.auth.signOut()
    location.reload()
  }

  document.querySelector('#newBtn').onclick=openNewMovement

  document.querySelector('#closeModal').onclick=()=>{
    state.editingId=null
    document.querySelector('#modal').classList.add('hidden')
  }

  document.querySelector('#menuBtn').onclick=()=>{
    document.querySelector('#sidebar').classList.toggle('open')
  }

  document.querySelectorAll('[data-section]').forEach(btn=>{
    btn.onclick=()=>{
      document.querySelectorAll('[data-section]').forEach(b=>{
        b.classList.remove('active')
      })

      btn.classList.add('active')

      state.section=btn.dataset.section
      document.querySelector('#title').textContent=state.section

      if(state.section==='Inicio'){
        renderDashboard()
      }else if(state.section==='📁 Todos los movimientos'){
        renderAllMovements()
      }else{
        renderGeneric(state.section)
      }

      document.querySelector('#sidebar').classList.remove('open')
    }
  })

  document.querySelector('#saveEntry').onclick=async()=>{
    const msg=document.querySelector('#saveMsg')
    msg.textContent=''

    if(!supabase || !state.session){
      msg.textContent='Debes iniciar sesión.'
      return
    }

    const payload={
      user_id:state.session.user.id,
      type:document.querySelector('#type').value,
      date:document.querySelector('#date').value,
      concept:document.querySelector('#concept').value,
      amount:Number(document.querySelector('#amount').value||0),
      status:document.querySelector('#status').value,
      notes:document.querySelector('#notes').value
    }

    let error

    if(state.editingId){
      const result=await supabase
        .from('entries')
        .update(payload)
        .eq('id',state.editingId)
        .eq('user_id',state.session.user.id)

      error=result.error
    }else{
      const result=await supabase
        .from('entries')
        .insert(payload)

      error=result.error
    }

    if(error){
      msg.textContent=error.message
      return
    }

    state.editingId=null

    document.querySelector('#modal').classList.add('hidden')

    await loadData()
  }
}

shell()
bind()

if(supabase){
  const {data}=await supabase.auth.getSession()

  if(data.session){
    state.session=data.session

    document.querySelector('#login').classList.add('hidden')
    document.querySelector('#appView').classList.remove('hidden')

    await loadData()
  }
}
