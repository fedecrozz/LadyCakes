/* LadyCakes - app.js
   Simple SPA stored in localStorage. Spanish UI.
*/

const selectors = {
  content: document.getElementById('content'),
  navBtns: document.querySelectorAll('.nav-btn'),
  viewTitle: document.getElementById('viewTitle'),
  bizName: document.getElementById('bizName'),
  logoImg: document.getElementById('logoImg'),
  logoPlaceholder: document.getElementById('logoPlaceholder'),
  editProfileBtn: document.getElementById('editProfileBtn'),
  profileModal: document.getElementById('profileModal'),
  inputBizName: document.getElementById('inputBizName'),
  inputLogo: document.getElementById('inputLogo'),
  inputBizDesc: document.getElementById('inputBizDesc'),
  inputBizContact: document.getElementById('inputBizContact'),
  saveProfileBtn: document.getElementById('saveProfileBtn'),
  cancelProfileBtn: document.getElementById('cancelProfileBtn'),
  exportBtn: document.getElementById('exportBtn'),
  importBtn: document.getElementById('importBtn'),
  fileInput: document.getElementById('fileInput'),
}

const STORAGE_KEY = 'ladycakes_data_v1'

let state = {
  profile: {
    name: 'LadyCakes',
    logo: '',
    description: '',
    contact: ''
  },
  needs: [],
  notes: [],
  tasks: [],
  recipes: [],
  products: [],
  inventory: [], // {itemName, qty, unit}
  orders: [], // customer orders
  reminders: []
}

// load
function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY)
    if(raw){
      const parsed = JSON.parse(raw)
      Object.assign(state, parsed)
    }
  }catch(e){console.error('load error',e)}
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// nav
function setActive(view){
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'))
  const btn = document.querySelector(`.nav-btn[data-view="${view}"]`)
  if(btn) btn.classList.add('active')
  renderView(view)
}

// profile modal
selectors.editProfileBtn.addEventListener('click', ()=>{
  selectors.inputBizName.value = state.profile.name || ''
  selectors.inputBizDesc.value = state.profile.description || ''
  selectors.inputBizContact.value = state.profile.contact || ''
  selectors.profileModal.setAttribute('aria-hidden','false')
})
selectors.cancelProfileBtn.addEventListener('click', ()=>{
  selectors.profileModal.setAttribute('aria-hidden','true')
})

selectors.inputLogo.addEventListener('change', (e)=>{
  const f = e.target.files[0]
  if(!f) return
  const reader = new FileReader()
  reader.onload = ev => {
    selectors.logoImg.src = ev.target.result
    selectors.logoImg.hidden = false
    selectors.logoPlaceholder.hidden = true
    state.profile.logo = ev.target.result
  }
  reader.readAsDataURL(f)
})

selectors.saveProfileBtn.addEventListener('click', ()=>{
  state.profile.name = selectors.inputBizName.value || 'LadyCakes'
  state.profile.description = selectors.inputBizDesc.value || ''
  state.profile.contact = selectors.inputBizContact.value || ''
  // logo may have been set earlier
  applyProfile()
  save()
  selectors.profileModal.setAttribute('aria-hidden','true')
  renderView(currentView)
})

function applyProfile(){
  selectors.bizName.textContent = state.profile.name || 'LadyCakes'
  if(state.profile.logo){
    selectors.logoImg.src = state.profile.logo
    selectors.logoImg.hidden = false
    selectors.logoPlaceholder.hidden = true
  } else {
    selectors.logoImg.hidden = true
    selectors.logoPlaceholder.hidden = false
    selectors.logoPlaceholder.textContent = abbreviate(state.profile.name)
  }
}

function abbreviate(name){
  if(!name) return 'LC'
  const parts = name.trim().split(/\s+/)
  return parts.map(p=>p[0]?.toUpperCase()).slice(0,2).join('')
}

// views
let currentView = 'dashboard'

function renderView(view){
  currentView = view
  selectors.viewTitle.textContent = titleFor(view)
  const c = selectors.content
  c.innerHTML = ''

  if(view === 'dashboard'){
    renderDashboard(c)
  } else if(view === 'needs'){
    renderNeeds(c)
  } else if(view === 'notes'){
    renderNotes(c)
  } else if(view === 'tasks'){
    renderTasks(c)
  } else if(view === 'recipes'){
    renderRecipes(c)
  } else if(view === 'products'){
    renderProducts(c)
  } else if(view === 'inventory'){
    renderInventory(c)
  } else if(view === 'orders'){
    renderOrders(c)
  } else if(view === 'reminders'){
    renderReminders(c)
  } else if(view === 'settings'){
    renderSettings(c)
  }
}

function titleFor(v){
  return ({dashboard:'Inicio',needs:'Cosas necesarias',notes:'Anotaciones',tasks:'Tareas',recipes:'Recetas',reminders:'Recordatorios',settings:'Ajustes'})[v] || v
}

function renderDashboard(container){
  const card = document.createElement('div'); card.className='card'
  card.innerHTML = `
    <h3>Bienvenida, <span class="pastel-tag">${state.profile.name}</span> <span class="heart">❤</span></h3>
    <p class="small-muted">Resumen rápido de tu emprendimiento</p>
    <div class="grid" style="margin-top:12px">
      <div class="card">
        <h4>Cosas necesarias</h4>
        <p class="small-muted">Tienes ${state.needs.length} elementos</p>
      </div>
      <div class="card">
        <h4>Tareas</h4>
        <p class="small-muted">${state.tasks.filter(t=>!t.done).length} pendientes</p>
      </div>
      <div class="card">
        <h4>Recetas</h4>
        <p class="small-muted">${state.recipes.length} recetas</p>
      </div>
      <div class="card">
        <h4>Recordatorios</h4>
        <p class="small-muted">${state.reminders.length} programados</p>
      </div>
    </div>
  `
  container.appendChild(card)
}

// Needs
function renderNeeds(container){
  const card = document.createElement('div'); card.className='card'
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3>Cosas necesarias</h3>
      <button id="addNeedBtn" class="btn primary">+ Agregar</button>
    </div>
    <p class="small-muted">Agrega materiales, herramientas, ingredientes y asigna prioridad (1-10).</p>
    <div id="needsList" style="margin-top:12px"></div>
  `
  container.appendChild(card)

  document.getElementById('addNeedBtn').addEventListener('click', ()=>openNeedEditor())
  refreshNeedsList()
}

function refreshNeedsList(){
  const list = document.getElementById('needsList')
  list.innerHTML = ''
  if(state.needs.length===0){
    list.innerHTML = '<p class="small-muted">No hay elementos aún.</p>'
    return
  }
  state.needs.forEach((n,idx)=>{
    const el = document.createElement('div'); el.className='list-item'
    const status = n.status || (n.acquired? 'Listo':'Pendiente')
    const badgeClass = status === 'Listo' ? 'status-listo' : 'status-pendiente'
    el.innerHTML = `
      <div>
        <div style="font-weight:700">${escapeHtml(n.name)} <span class="small-muted">· $${n.price || 0}</span> <span class="status-badge ${badgeClass}">${status}</span></div>
        <div class="small-muted">${escapeHtml(n.description||'')}</div>
        <div class="small-muted">Necesidad: ${n.urgency||5}/10</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="checkbox" class="acquired-checkbox" data-idx="${idx}" ${status==='Listo'? 'checked':''} title="Marcar como listo">
        <button class="icon-btn" data-action="edit" data-idx="${idx}">✏️</button>
        <button class="icon-btn" data-action="delete" data-idx="${idx}">🗑️</button>
      </div>
    `
    list.appendChild(el)
  })
  // attach listeners
  list.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', (e)=>{
      const act = b.getAttribute('data-action')
      const idx = Number(b.getAttribute('data-idx'))
      if(act==='edit') openNeedEditor(state.needs[idx], idx)
      if(act==='delete'){
        state.needs.splice(idx,1); save(); refreshNeedsList()
      }
    })
  })
  // acquired checkbox handlers -> convert to status
  list.querySelectorAll('.acquired-checkbox').forEach(cb=>{
    cb.addEventListener('change', ()=>{
      const idx = Number(cb.getAttribute('data-idx'))
      state.needs[idx].status = cb.checked ? 'Listo' : 'Pendiente'
      // remove legacy acquired flag if present
      if('acquired' in state.needs[idx]) delete state.needs[idx].acquired
      save(); refreshNeedsList()
    })
  })
}

function openNeedEditor(item=null, idx=null){
  const modal = createModal(item? 'Editar elemento':'Agregar elemento necesario')
  const statusVal = item ? (item.status || (item.acquired? 'Listo':'Pendiente')) : 'Pendiente'
  modal.innerHTML = `
    <div class="modal-card">
      <h3>${item? 'Editar elemento' : 'Agregar elemento necesario'}</h3>
      <label for="n_name">Nombre</label>
      <input id="n_name" class="input" value="${item?escapeHtml(item.name):''}" placeholder="Ej. Batidora">

      <label for="n_desc">Descripción</label>
      <textarea id="n_desc" class="input" rows="3" placeholder="Detalles, marca, tamaño...">${item?escapeHtml(item.description||''):''}</textarea>

      <div class="form-row">
        <div style="flex:1">
          <label for="n_price">Precio</label>
          <input id="n_price" class="input" type="number" placeholder="0.00" value="${item?item.price||0:0}">
        </div>
        <div style="width:120px">
          <label for="n_urgency">Necesidad</label>
          <select id="n_urgency" class="input">
            ${Array.from({length:10},(_,i)=>`<option value="${i+1}" ${item && item.urgency==(i+1)?'selected':''}>${i+1}</option>`).join('')}
          </select>
        </div>
      </div>

      <label for="n_status">Estado</label>
      <select id="n_status" class="input">
        <option value="Pendiente" ${statusVal==='Pendiente'? 'selected':''}>Pendiente</option>
        <option value="Listo" ${statusVal==='Listo'? 'selected':''}>Listo</option>
      </select>

      <div class="actions">
        <button id="saveNeed" class="btn primary">Guardar</button>
        <button id="cancelNeed" class="btn">Cancelar</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  document.getElementById('cancelNeed').addEventListener('click', ()=>{modal.remove()})
  document.getElementById('saveNeed').addEventListener('click', ()=>{
    const name = document.getElementById('n_name').value.trim()
    if(!name) return alert('El nombre es obligatorio')
    const desc = document.getElementById('n_desc').value.trim()
    const price = Number(document.getElementById('n_price').value) || 0
    const urgency = Number(document.getElementById('n_urgency').value)
    const status = document.getElementById('n_status').value || 'Pendiente'
    const obj = {name,description:desc,price,urgency}
    obj.status = status
    if(idx==null) state.needs.push(obj)
    else state.needs[idx] = obj
    save(); modal.remove(); refreshNeedsList()
  })
}

// Notes
function renderNotes(container){
  const card = document.createElement('div'); card.className='card'
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3>Anotaciones</h3>
      <button id="addNoteBtn" class="btn primary">+ Nueva</button>
    </div>
    <div id="notesList" style="margin-top:12px"></div>
  `
  container.appendChild(card)
  document.getElementById('addNoteBtn').addEventListener('click', ()=>openNoteEditor())
  refreshNotesList()
}

function refreshNotesList(){
  const list = document.getElementById('notesList')
  list.innerHTML = ''
  if(state.notes.length===0) { list.innerHTML = '<p class="small-muted">Sin notas.</p>'; return }
  state.notes.slice().reverse().forEach((n,idx)=>{
    const el = document.createElement('div'); el.className='card'
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong>${escapeHtml(n.title||'Nota')}</strong>
          <div class="small-muted">${new Date(n.created).toLocaleString()}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn" data-idx="${state.notes.length-1-idx}" data-act="edit">Editar</button>
          <button class="btn" data-idx="${state.notes.length-1-idx}" data-act="del">Eliminar</button>
        </div>
      </div>
      <p style="margin-top:8px">${escapeHtml(n.body||'')}</p>
    `
    list.appendChild(el)
  })
  list.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{
      const idx = Number(b.getAttribute('data-idx'))
      const act = b.getAttribute('data-act')
      if(act==='edit') openNoteEditor(state.notes[idx], idx)
      if(act==='del'){ state.notes.splice(idx,1); save(); refreshNotesList() }
    })
  })
}

function openNoteEditor(item=null, idx=null){
  const modal = createModal(item? 'Editar nota':'Nueva nota')
  const card = modal.querySelector('.modal-card')
  card.innerHTML = `
    <h3>${item? 'Editar nota' : 'Nueva nota'}</h3>
    <label>Título</label>
    <input id="noteTitle" class="input" value="${item?escapeHtml(item.title||''):''}" placeholder="Título breve">
    <label>Contenido</label>
    <textarea id="noteBody" class="input" rows="6" placeholder="Escribe la nota aquí...">${item?escapeHtml(item.body||''):''}</textarea>
    <div class="actions">
      <button id="saveNote" class="btn primary">Guardar</button>
      <button id="cancelNote" class="btn">Cancelar</button>
    </div>
  `
  document.body.appendChild(modal)
  const btnCancel = modal.querySelector('#cancelNote')
  const btnSave = modal.querySelector('#saveNote')
  btnCancel.addEventListener('click', ()=>modal.remove())
  btnSave.addEventListener('click', ()=>{
    const title = modal.querySelector('#noteTitle').value.trim()
    const body = modal.querySelector('#noteBody').value.trim()
    const obj = {title,body,created: Date.now()}
    if(idx==null) state.notes.push(obj)
    else state.notes[idx] = obj
    save(); modal.remove(); refreshNotesList()
  })
}

// Tasks
function renderTasks(container){
  const card = document.createElement('div'); card.className='card'
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3>Tareas</h3>
      <button id="addTaskBtn" class="btn primary">+ Nueva</button>
    </div>
    <div id="tasksList" style="margin-top:12px"></div>
  `
  container.appendChild(card)
  document.getElementById('addTaskBtn').addEventListener('click', ()=>openTaskEditor())
  refreshTasksList()
}

function refreshTasksList(){
  const list = document.getElementById('tasksList')
  list.innerHTML = ''
  if(state.tasks.length===0){ list.innerHTML = '<p class="small-muted">Sin tareas.</p>'; return }
  state.tasks.forEach((t,idx)=>{
    const el = document.createElement('div'); el.className='list-item'
    el.innerHTML = `
      <div>
        <div style="font-weight:700">${escapeHtml(t.title)} <span class="small-muted">${t.due?('· '+new Date(t.due).toLocaleDateString()):''}</span></div>
        <div class="small-muted">${escapeHtml(t.notes||'')}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="checkbox" data-idx="${idx}" ${t.done? 'checked':''}>
        <button class="icon-btn" data-idx="${idx}" data-act="edit">✏️</button>
        <button class="icon-btn" data-idx="${idx}" data-act="del">🗑️</button>
      </div>
    `
    list.appendChild(el)
  })
  list.querySelectorAll('input[type=checkbox]').forEach(cb=>{
    cb.addEventListener('change', ()=>{
      const idx = Number(cb.getAttribute('data-idx'))
      state.tasks[idx].done = cb.checked; save(); refreshTasksList()
    })
  })
  list.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{
      const idx = Number(b.getAttribute('data-idx'))
      const act = b.getAttribute('data-act')
      if(act==='edit') openTaskEditor(state.tasks[idx], idx)
      if(act==='del'){ state.tasks.splice(idx,1); save(); refreshTasksList() }
    })
  })
}

function openTaskEditor(item=null, idx=null){
  const modal = createModal(item? 'Editar tarea':'Nueva tarea')
  const statusVal = item? (item.status || (item.done? 'Listo':'Pendiente')) : 'Pendiente'
  const card = modal.querySelector('.modal-card')
  card.innerHTML = `
    <h3>${item? 'Editar tarea' : 'Nueva tarea'}</h3>
    <label>Título</label>
    <input id="t_title" class="input" value="${item?escapeHtml(item.title||''):''}" placeholder="Ej. Hornear torta para pedido">
    <label>Notas</label>
    <textarea id="t_notes" class="input" rows="3" placeholder="Detalles de la tarea...">${item?escapeHtml(item.notes||''):''}</textarea>
    <div class="form-row">
      <div style="flex:1">
        <label>Fecha de vencimiento</label>
        <input id="t_due" type="date" class="input" value="${item && item.due? new Date(item.due).toISOString().substr(0,10):''}">
      </div>
      <div style="width:140px">
        <label>Estado</label>
        <select id="t_status" class="input">
          <option value="Pendiente" ${statusVal==='Pendiente'? 'selected':''}>Pendiente</option>
          <option value="Listo" ${statusVal==='Listo'? 'selected':''}>Listo</option>
        </select>
      </div>
    </div>
    <div class="actions">
      <button id="saveTask" class="btn primary">Guardar</button>
      <button id="cancelTask" class="btn">Cancelar</button>
    </div>
  `
  document.body.appendChild(modal)
  const btnCancel = modal.querySelector('#cancelTask')
  const btnSave = modal.querySelector('#saveTask')
  btnCancel.addEventListener('click', ()=>modal.remove())
  btnSave.addEventListener('click', ()=>{
    const title = modal.querySelector('#t_title').value.trim()
    if(!title) return alert('El título es obligatorio')
    const notes = modal.querySelector('#t_notes').value.trim()
    const dueV = modal.querySelector('#t_due').value
    const due = dueV ? new Date(dueV).getTime() : null
    const status = modal.querySelector('#t_status').value || 'Pendiente'
    const obj = {title,notes,due,done: status === 'Listo', status}
    if(idx==null) state.tasks.push(obj)
    else state.tasks[idx] = obj
    save(); modal.remove(); refreshTasksList()
  })
}

// Recipes
function renderRecipes(container){
  const card = document.createElement('div'); card.className='card'
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3>Recetas</h3>
      <button id="addRecipeBtn" class="btn primary">+ Nueva</button>
    </div>
    <div id="recipesList" style="margin-top:12px"></div>
  `
  container.appendChild(card)
  document.getElementById('addRecipeBtn').addEventListener('click', ()=>openRecipeEditor())
  refreshRecipesList()
}

// Products
function renderProducts(container){
  const card = document.createElement('div'); card.className='card'
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3>Productos de venta</h3>
      <button id="addProductBtn" class="btn primary">+ Nuevo producto</button>
    </div>
    <p class="small-muted">Agrega productos (tartas, tortas, cupcakes) con foto, precio y descripción.</p>
    <div id="productsList" style="margin-top:12px"></div>
  `
  container.appendChild(card)
  document.getElementById('addProductBtn').addEventListener('click', ()=>openProductEditor())
  refreshProductsList()
}

function refreshProductsList(){
  const list = document.getElementById('productsList')
  list.innerHTML = ''
  if(!state.products || state.products.length===0){ list.innerHTML = '<p class="small-muted">No hay productos.</p>'; return }
  const grid = document.createElement('div'); grid.className='product-grid'
  state.products.forEach((p,idx)=>{
    const el = document.createElement('div'); el.className='product-card'
    el.innerHTML = `
      ${p.image? `<img src="${p.image}" alt="${escapeHtml(p.name)}">` : '<div style="height:140px;background:linear-gradient(90deg,#fff,#f7f7f9);border-radius:8px"></div>'}
      <div style="flex:1">
        <strong>${escapeHtml(p.name)}</strong>
        <div class="small-muted">${escapeHtml(p.description||'')}</div>
        <div style="margin-top:8px;font-weight:700">$${p.price || 0}</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn" data-idx="${idx}" data-act="edit">Editar</button>
        <button class="btn" data-idx="${idx}" data-act="del">Eliminar</button>
      </div>
    `
    grid.appendChild(el)
  })
  list.appendChild(grid)
  list.querySelectorAll('button').forEach(b=> b.addEventListener('click', ()=>{
    const idx = Number(b.getAttribute('data-idx'))
    const act = b.getAttribute('data-act')
    if(act==='edit') openProductEditor(state.products[idx], idx)
    if(act==='del'){ if(confirm('Eliminar producto?')){ state.products.splice(idx,1); save(); refreshProductsList() } }
  }))
}

function openProductEditor(item=null, idx=null){
  const modal = createModal(item? 'Editar producto':'Nuevo producto')
  const card = modal.querySelector('.modal-card')
  card.innerHTML = `
    <h3>${item? 'Editar producto':'Nuevo producto'}</h3>
    <label>Nombre</label>
    <input id="p_name" class="input" value="${item?escapeHtml(item.name||''):''}">
    <label>Descripción</label>
    <textarea id="p_desc" class="input" rows="3">${item?escapeHtml(item.description||''):''}</textarea>
    <div class="form-row">
      <input id="p_price" class="input" type="number" placeholder="Precio" value="${item?item.price||0:0}">
      <input id="p_qty" class="input" type="number" placeholder="Stock (opcional)" value="${item?item.stock||0:''}">
    </div>
    <label>Foto</label>
    <input id="p_image" type="file" accept="image/*">
    <div id="p_preview" style="margin-top:8px">${item && item.image? `<div class='file-preview'><img src='${item.image}' style='width:100%;height:100%;object-fit:cover'></div>`: ''}</div>
    <div class="actions">
      <button id="saveProduct" class="btn primary">Guardar</button>
      <button id="cancelProduct" class="btn">Cancelar</button>
    </div>
  `
  document.body.appendChild(modal)
  const inputImage = modal.querySelector('#p_image')
  const preview = modal.querySelector('#p_preview')
  inputImage.addEventListener('change', (e)=>{
    const f = e.target.files[0]; if(!f) return
    const reader = new FileReader(); reader.onload = ev=>{ preview.innerHTML = `<div class='file-preview'><img src='${ev.target.result}' style='width:100%;height:100%;object-fit:cover'></div>`; preview.dataset.img = ev.target.result }
    reader.readAsDataURL(f)
  })
  modal.querySelector('#cancelProduct').addEventListener('click', ()=>modal.remove())
  modal.querySelector('#saveProduct').addEventListener('click', ()=>{
    const name = modal.querySelector('#p_name').value.trim(); if(!name) return alert('Nombre requerido')
    const desc = modal.querySelector('#p_desc').value.trim()
    const price = Number(modal.querySelector('#p_price').value) || 0
    const stock = Number(modal.querySelector('#p_qty').value) || 0
    const image = preview.dataset.img || (item? item.image: '')
    const obj = {name,description:desc,price,stock,image}
    if(idx==null) state.products.push(obj)
    else state.products[idx] = obj
    save(); modal.remove(); refreshProductsList()
  })
}

// Inventory
function renderInventory(container){
  const card = document.createElement('div'); card.className='card'
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3>Inventario / Materia prima</h3>
      <button id="addInvBtn" class="btn primary">+ Agregar insumo</button>
    </div>
    <div id="invList" style="margin-top:12px"></div>
  `
  container.appendChild(card)
  document.getElementById('addInvBtn').addEventListener('click', ()=>openInventoryEditor())
  refreshInventory()
}

function refreshInventory(){
  const list = document.getElementById('invList')
  list.innerHTML = ''
  if(!state.inventory || state.inventory.length===0){ list.innerHTML = '<p class="small-muted">Sin insumos.</p>'; return }
  const table = document.createElement('table'); table.className='table'
  table.innerHTML = `<thead><tr><th>Insumo</th><th>Cantidad</th><th>Unidad</th><th></th></tr></thead><tbody>${state.inventory.map((it,idx)=>`<tr><td>${escapeHtml(it.itemName)}</td><td>${it.qty}</td><td>${escapeHtml(it.unit||'')}</td><td><button data-idx="${idx}" class="btn">Editar</button> <button data-idx="${idx}" class="btn">Eliminar</button></td></tr>`).join('')}</tbody>`
  list.appendChild(table)
  list.querySelectorAll('button').forEach(b=> b.addEventListener('click', ()=>{
    const idx = Number(b.getAttribute('data-idx'))
    if(b.textContent.trim()==='Eliminar'){ if(confirm('Eliminar insumo?')){ state.inventory.splice(idx,1); save(); refreshInventory() } }
    else openInventoryEditor(state.inventory[idx], idx)
  }))
}

function openInventoryEditor(item=null, idx=null){
  const modal = createModal(item? 'Editar insumo':'Nuevo insumo')
  const card = modal.querySelector('.modal-card')
  card.innerHTML = `
    <h3>${item? 'Editar insumo':'Nuevo insumo'}</h3>
    <label>Nombre del insumo</label>
    <input id="inv_name" class="input" value="${item?escapeHtml(item.itemName||''):''}">
    <div class="form-row">
      <input id="inv_qty" class="input" type="number" placeholder="Cantidad" value="${item?item.qty||0:0}">
      <input id="inv_unit" class="input" placeholder="Unidad (kg, gr, unid)" value="${item?escapeHtml(item.unit||''):''}">
    </div>
    <div class="actions">
      <button id="saveInv" class="btn primary">Guardar</button>
      <button id="cancelInv" class="btn">Cancelar</button>
    </div>
  `
  document.body.appendChild(modal)
  modal.querySelector('#cancelInv').addEventListener('click', ()=>modal.remove())
  modal.querySelector('#saveInv').addEventListener('click', ()=>{
    const name = modal.querySelector('#inv_name').value.trim(); if(!name) return alert('Nombre requerido')
    const qty = Number(modal.querySelector('#inv_qty').value) || 0
    const unit = modal.querySelector('#inv_unit').value.trim()
    const obj = {itemName: name, qty, unit}
    if(idx==null) state.inventory.push(obj)
    else state.inventory[idx] = obj
    save(); modal.remove(); refreshInventory()
  })
}

// Orders
function renderOrders(container){
  const card = document.createElement('div'); card.className='card'
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3>Pedidos</h3>
      <button id="addOrderBtn" class="btn primary">+ Nuevo pedido</button>
    </div>
    <div id="ordersList" style="margin-top:12px"></div>
  `
  container.appendChild(card)
  document.getElementById('addOrderBtn').addEventListener('click', ()=>openOrderEditor())
  refreshOrders()
}

function refreshOrders(){
  const list = document.getElementById('ordersList')
  list.innerHTML = ''
  if(!state.orders || state.orders.length===0){ list.innerHTML = '<p class="small-muted">Sin pedidos.</p>'; return }
  state.orders.forEach((o,idx)=>{
    const el = document.createElement('div'); el.className='card'
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong>${escapeHtml(o.customer||'Pedido')}</strong>
          <div class="small-muted">${new Date(o.created).toLocaleString()}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn" data-idx="${idx}" data-act="view">Ver</button>
          <button class="btn" data-idx="${idx}" data-act="del">Eliminar</button>
        </div>
      </div>
      <div style="margin-top:8px">${o.items.map(i=>`<div>${escapeHtml(i.name)} x ${i.qty}</div>`).join('')}</div>
    `
    list.appendChild(el)
  })
  list.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{
      const idx = Number(b.getAttribute('data-idx'))
      const act = b.getAttribute('data-act')
      if(act==='view') viewOrder(state.orders[idx])
      if(act==='del'){ if(confirm('Eliminar pedido?')){ state.orders.splice(idx,1); save(); refreshOrders() } }
    })
  })
}

function openOrderEditor(){
  const modal = createModal('Nuevo pedido')
  const card = modal.querySelector('.modal-card')
  // product options
  const options = (state.products||[]).map((p,idx)=>`<option value="${idx}">${escapeHtml(p.name)}</option>`).join('')
  card.innerHTML = `
    <h3>Nuevo pedido</h3>
    <label>Cliente</label>
    <input id="o_customer" class="input" placeholder="Nombre del cliente">
    <label>Producto</label>
    <div class="form-row">
      <select id="o_product" class="input" style="flex:2">${options}</select>
      <input id="o_qty" class="input" type="number" placeholder="Cantidad" style="width:100px">
      <button id="o_add" class="btn">Agregar</button>
    </div>
    <div id="o_items" style="margin-top:8px"></div>
    <div class="actions">
      <button id="saveOrder" class="btn primary">Guardar pedido</button>
      <button id="cancelOrder" class="btn">Cancelar</button>
    </div>
  `
  document.body.appendChild(modal)
  const items = []
  const elItems = modal.querySelector('#o_items')
  modal.querySelector('#o_add').addEventListener('click', ()=>{
    const pIdx = Number(modal.querySelector('#o_product').value)
    const qty = Number(modal.querySelector('#o_qty').value) || 0
    if(isNaN(pIdx) || !state.products[pIdx]) return alert('Selecciona un producto')
    if(qty<=0) return alert('Cantidad > 0')
    const prod = state.products[pIdx]
    items.push({name: prod.name, qty})
    elItems.innerHTML = items.map((it,i)=>`<div>${escapeHtml(it.name)} x ${it.qty} <button data-i="${i}" class="btn">Eliminar</button></div>`).join('')
    // attach remove
    elItems.querySelectorAll('button').forEach(b=> b.addEventListener('click', ()=>{ items.splice(Number(b.getAttribute('data-i')),1); elItems.innerHTML = items.map((it,i)=>`<div>${escapeHtml(it.name)} x ${it.qty} <button data-i="${i}" class="btn">Eliminar</button></div>`).join('') }))
  })
  modal.querySelector('#cancelOrder').addEventListener('click', ()=>modal.remove())
  modal.querySelector('#saveOrder').addEventListener('click', ()=>{
    const customer = modal.querySelector('#o_customer').value.trim() || 'Cliente'
    if(items.length===0) return alert('Agrega al menos un item')
    const obj = {customer, items, created: Date.now()}
    // deduct stock if product stock present
    items.forEach(it=>{
      const prod = state.products.find(p=>p.name===it.name)
      if(prod && typeof prod.stock === 'number') prod.stock = Math.max(0, prod.stock - it.qty)
    })
    state.orders.push(obj); save(); modal.remove(); refreshOrders(); refreshProductsList()
  })
}

function refreshRecipesList(){
  const list = document.getElementById('recipesList')
  list.innerHTML = ''
  if(state.recipes.length===0){ list.innerHTML = '<p class="small-muted">Sin recetas.</p>'; return }
  state.recipes.forEach((r,idx)=>{
    const el = document.createElement('div'); el.className='card'
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong>${escapeHtml(r.title)}</strong>
          <div class="small-muted">${escapeHtml(r.description||'')}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn" data-idx="${idx}" data-act="view">Ver</button>
          <button class="btn" data-idx="${idx}" data-act="edit">Editar</button>
          <button class="btn" data-idx="${idx}" data-act="del">Eliminar</button>
        </div>
      </div>
    `
    list.appendChild(el)
  })
  list.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{
      const idx = Number(b.getAttribute('data-idx'))
      const act = b.getAttribute('data-act')
      if(act==='view') viewRecipe(state.recipes[idx])
      if(act==='edit') openRecipeEditor(state.recipes[idx], idx)
      if(act==='del'){ state.recipes.splice(idx,1); save(); refreshRecipesList() }
    })
  })
}

function openRecipeEditor(item=null, idx=null){
  const modal = createModal(item? 'Editar receta':'Nueva receta')
  const ingr = (item && item.ingredients)? item.ingredients.join('\n') : ''
  const steps = (item && item.steps)? item.steps.join('\n') : ''
  const card = modal.querySelector('.modal-card')
  card.innerHTML = `
    <h3>${item? 'Editar receta' : 'Nueva receta'}</h3>
    <label>Título</label>
    <input id="r_title" class="input" value="${item?escapeHtml(item.title||''):''}" placeholder="Nombre de la receta">
    <label>Descripción</label>
    <input id="r_desc" class="input" value="${item?escapeHtml(item.description||''):''}" placeholder="Breve descripción">
    <label>Ingredientes (uno por línea)</label>
    <textarea id="r_ingr" class="input" rows="4" placeholder="Ej. 200g harina">${escapeHtml(ingr)}</textarea>
    <label>Pasos (uno por línea)</label>
    <textarea id="r_steps" class="input" rows="6" placeholder="Paso 1\nPaso 2">${escapeHtml(steps)}</textarea>
    <div class="actions">
      <button id="saveRecipe" class="btn primary">Guardar</button>
      <button id="cancelRecipe" class="btn">Cancelar</button>
    </div>
  `
  document.body.appendChild(modal)
  const btnCancel = modal.querySelector('#cancelRecipe')
  const btnSave = modal.querySelector('#saveRecipe')
  btnCancel.addEventListener('click', ()=>modal.remove())
  btnSave.addEventListener('click', ()=>{
    const title = modal.querySelector('#r_title').value.trim()
    if(!title) return alert('El título es obligatorio')
    const description = modal.querySelector('#r_desc').value.trim()
    const ingredients = modal.querySelector('#r_ingr').value.split('\n').map(s=>s.trim()).filter(Boolean)
    const steps = modal.querySelector('#r_steps').value.split('\n').map(s=>s.trim()).filter(Boolean)
    const obj = {title,description,ingredients,steps}
    if(idx==null) state.recipes.push(obj)
    else state.recipes[idx] = obj
    save(); modal.remove(); refreshRecipesList()
  })
}

function viewRecipe(r){
  const modal = createModal(r.title)
  modal.innerHTML = `
    <h4>${escapeHtml(r.title)}</h4>
    <div class="small-muted">${escapeHtml(r.description||'')}</div>
    <h5>Ingredientes</h5>
    <ul>${r.ingredients.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ul>
    <h5>Pasos</h5>
    <ol>${r.steps.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ol>
    <div style="text-align:right;margin-top:8px">
      <button id="closeView" class="btn">Cerrar</button>
    </div>
  `
  document.body.appendChild(modal)
  document.getElementById('closeView').addEventListener('click', ()=>modal.remove())
}

// Reminders
function renderReminders(container){
  const card = document.createElement('div'); card.className='card'
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3>Recordatorios</h3>
      <button id="addRemBtn" class="btn primary">+ Nuevo</button>
    </div>
    <div id="remList" style="margin-top:12px"></div>
  `
  container.appendChild(card)
  document.getElementById('addRemBtn').addEventListener('click', ()=>openRemEditor())
  refreshReminders()
}

function refreshReminders(){
  const list = document.getElementById('remList')
  list.innerHTML = ''
  if(state.reminders.length===0){ list.innerHTML = '<p class="small-muted">Sin recordatorios.</p>'; return }
  state.reminders.forEach((r,idx)=>{
    const el = document.createElement('div'); el.className='list-item'
    el.innerHTML = `
      <div>
        <div style="font-weight:700">${escapeHtml(r.title)} <span class="small-muted">· ${new Date(r.when).toLocaleString()}</span></div>
        <div class="small-muted">${escapeHtml(r.notes||'')}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="icon-btn" data-idx="${idx}" data-act="del">🗑️</button>
      </div>
    `
    list.appendChild(el)
  })
  list.querySelectorAll('button').forEach(b=> b.addEventListener('click', ()=>{
    const idx = Number(b.getAttribute('data-idx'))
    state.reminders.splice(idx,1); save(); refreshReminders()
  }))
}

function openRemEditor(){
  const modal = createModal('Nuevo recordatorio')
  const card = modal.querySelector('.modal-card')
  card.innerHTML = `
    <h3>Nuevo recordatorio</h3>
    <label>Título</label>
    <input id="r_title2" class="input" placeholder="Ej. Retirar pedido">
    <label>Notas</label>
    <textarea id="r_notes2" class="input" rows="3" placeholder="Detalles..."></textarea>
    <div class="form-row">
      <label style="flex:1">Fecha y hora</label>
      <input id="r_when" type="datetime-local" class="input" style="flex:1">
    </div>
    <div class="actions">
      <button id="saveRem" class="btn primary">Guardar</button>
      <button id="cancelRem" class="btn">Cancelar</button>
    </div>
  `
  document.body.appendChild(modal)
  const btnCancel = modal.querySelector('#cancelRem')
  const btnSave = modal.querySelector('#saveRem')
  btnCancel.addEventListener('click', ()=>modal.remove())
  btnSave.addEventListener('click', ()=>{
    const title = modal.querySelector('#r_title2').value.trim()
    if(!title) return alert('El título es obligatorio')
    const notes = modal.querySelector('#r_notes2').value.trim()
    const whenV = modal.querySelector('#r_when').value
    const when = whenV ? new Date(whenV).getTime() : Date.now()
    const obj = {title,notes,when}
    state.reminders.push(obj); save(); modal.remove(); refreshReminders(); scheduleCheck()
  })
}

// simple scheduler to check reminders every minute
let schedulerTimer = null
function scheduleCheck(){
  if(schedulerTimer) return
  schedulerTimer = setInterval(()=>{
    const now = Date.now()
    state.reminders.forEach((r,idx)=>{
      if(!r.fired && r.when <= now){
        notify(`Recordatorio: ${r.title}`,'¡Es hora!', r.notes || '')
        r.fired = true; save()
        refreshReminders()
      }
    })
  }, 1000*30)
}

function notify(title, body, extra=''){
  if(Notification && Notification.permission === 'granted'){
    new Notification(title,{body: body + ' ' + extra})
  } else if(Notification && Notification.permission !== 'denied'){
    Notification.requestPermission().then(p=>{ if(p==='granted') new Notification(title,{body:body + ' ' + extra}) })
  } else {
    alert(title + '\n' + body)
  }
}

// settings
function renderSettings(container){
  const card = document.createElement('div'); card.className='card'
  card.innerHTML = `
    <h3>Ajustes</h3>
    <p class="small-muted">Opciones de respaldo y ayuda</p>
    <div style="margin-top:12px">
      <button id="clearBtn" class="btn">Borrar datos locales</button>
    </div>
  `
  container.appendChild(card)
  document.getElementById('clearBtn').addEventListener('click', ()=>{
    if(confirm('Esto borrará todos los datos guardados localmente. ¿Continuar?')){
      localStorage.removeItem(STORAGE_KEY); location.reload()
    }
  })
}

// utilities
function createModal(title){
  const el = document.createElement('div'); el.className='modal'; el.setAttribute('aria-hidden','false')
  const card = document.createElement('div'); card.className='modal-card'
  card.innerHTML = `<h3>${escapeHtml(title)}</h3>`
  el.appendChild(card)
  return el
}

function escapeHtml(s){
  if(!s && s!==0) return ''
  return String(s).replace(/[&<>\"]/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]))
}

// small export/import
selectors.exportBtn.addEventListener('click', ()=>{
  const data = JSON.stringify(state, null, 2)
  const blob = new Blob([data], {type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = (state.profile.name||'ladycakes') + '_backup.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
})
selectors.importBtn.addEventListener('click', ()=>selectors.fileInput.click())
selectors.fileInput.addEventListener('change', (e)=>{
  const f = e.target.files[0]; if(!f) return
  const reader = new FileReader(); reader.onload = ev =>{
    try{ const parsed = JSON.parse(ev.target.result); Object.assign(state, parsed); save(); applyProfile(); renderView(currentView); alert('Importado con éxito') }catch(err){alert('Error al importar: '+err.message)}
  }
  reader.readAsText(f)
})

// init nav listeners
selectors.navBtns.forEach(b=> b.addEventListener('click', ()=>setActive(b.getAttribute('data-view'))))

// init
load();

// Si la lista de 'needs' está vacía, inicializar con los items proporcionados por el usuario
function seedNeedsIfEmpty(){
  if(state.needs && state.needs.length) return
  const seed = [
    {name: 'Batidora', description: '', price: 0, urgency: 5, status: 'Listo'},
    {name: 'Espatulas de silicona', description: '', price: 0, urgency: 5, status: 'Listo'},
  {name: 'Mangas descartables', description: '', price: 0, urgency: 5, status: 'Pendiente'},
    {name: 'Batidor de mano', description: '', price: 0, urgency: 5},
    {name: 'Picos', description: '', price: 0, urgency: 5},
    {name: 'Rayador', description: '', price: 0, urgency: 5},
    {name: 'Bowls', description: '', price: 0, urgency: 5},
    {name: 'Moldes de tortas', description: '', price: 0, urgency: 5},
    {name: 'Moldes de tartas', description: '', price: 0, urgency: 5},
    {name: 'Medidor', description: '', price: 0, urgency: 5},
    {name: 'Tamizador', description: '', price: 0, urgency: 5},
    {name: 'Mini procesadora', description: '', price: 0, urgency: 5},
    {name: 'Palo de amazar (grande)', description: '', price: 0, urgency: 5},
    {name: 'Lámina antiadherente de silicona', description: '', price: 0, urgency: 5},
    {name: 'Cortantes', description: '', price: 0, urgency: 5},
    {name: 'Pincel de silicona', description: '', price: 0, urgency: 5},
    {name: 'Espatulas de acero', description: '', price: 0, urgency: 5},
    {name: 'Alisador', description: '', price: 0, urgency: 5},
    {name: 'Balanza', description: '', price: 0, urgency: 5},
    {name: 'Base giratoria', description: '', price: 0, urgency: 5},
    {name: 'Soplete + Gas', description: '', price: 0, urgency: 5},
    {name: 'Molde de cupcakes', description: '', price: 0, urgency: 5},
    {name: 'Rejilla con patitas de fierro', description: '', price: 0, urgency: 5},
    {name: 'Termómetro', description: '', price: 0, urgency: 5},
    {name: 'Caja de colorantes', description: '', price: 0, urgency: 5},
    {name: 'Mueble para guardar', description: '', price: 0, urgency: 5},
    {name: 'Trapos', description: '', price: 0, urgency: 5},
    {name: 'Guantes de latex', description: '', price: 0, urgency: 5},
    {name: 'Moldes de acetato de chocolates', description: '', price: 0, urgency: 5},
    {name: 'Cucharas medidoras', description: '', price: 0, urgency: 5},
    {name: 'Exprimidor de limón', description: '', price: 0, urgency: 5},
    {name: 'Cuchillos de pasteleria', description: '', price: 0, urgency: 5},
  {name: 'Tuppers', description: '', price: 0, urgency: 5, status: 'Pendiente'}
  ]
  state.needs = seed
  save()
}

seedNeedsIfEmpty();

// Agregar en bloque items proporcionados por el usuario sin duplicados
function addBulkNeeds(items){
  const existing = new Set((state.needs||[]).map(n=>String(n.name||'').trim().toLowerCase()))
  let added = 0
  items.forEach(it=>{
    const name = String(it.name||'').trim()
    if(!name) return
    if(existing.has(name.toLowerCase())) return
    const base = {description:'', price:0, urgency:5, status: 'Pendiente'}
    const entry = Object.assign(base, it)
    state.needs.push(entry)
    existing.add(name.toLowerCase())
    added++
  })
  if(added>0) save()
  return added
}

// Lista enviada por el usuario (dos primeros marcados LISTO)
const userNeeds = [
  {name: 'Batidora', status: 'Listo'},
  {name: 'Espatulas de silicona', status: 'Listo'},
  {name: 'Mangas descartables'},
  {name: 'Batidor de mano'},
  {name: 'Picos'},
  {name: 'Rayador'},
  {name: 'Bowls'},
  {name: 'Moldes de tortas'},
  {name: 'Moldes de tartas'},
  {name: 'Medidor'},
  {name: 'Tamizador'},
  {name: 'Mini procesadora'},
  {name: 'Palo de amazar (grande)'},
  {name: 'Lámina antiadherente de silicona'},
  {name: 'Cortantes'},
  {name: 'Pincel de silicona'},
  {name: 'Espatulas de acero'},
  {name: 'Alisador'},
  {name: 'Balanza'},
  {name: 'Base giratoria'},
  {name: 'Soplete + Gas'},
  {name: 'Molde de cupcakes'},
  {name: 'Rejilla con patitas de fierro'},
  {name: 'Termómetro'},
  {name: 'Caja de colorantes'},
  {name: 'Mueble para guardar'},
  {name: 'Trapos'},
  {name: 'Guantes de latex'},
  {name: 'Moldes de acetato de chocolates'},
  {name: 'Cucharas medidoras'},
  {name: 'Exprimidor de limón'},
  {name: 'Cuchillos de pasteleria'},
  {name: 'Tuppers'}
]

const addedCount = addBulkNeeds(userNeeds)
if(addedCount>0){
  // Si la vista actual es 'needs', refrescar la lista; en cualquier caso re-render
  if(currentView === 'needs') refreshNeedsList()
  else renderView(currentView)
}

applyProfile(); setActive('dashboard'); scheduleCheck()

// small helpers
function nowISO(){ return new Date().toISOString() }

// expose for debugging
window.Lady = {state, save}
