import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { House, CalendarDays, Users, LogOut, Plus, Pencil, Trash2, MapPin, Trees, BedDouble, X, Search, Check, Menu } from 'lucide-react';
import './style.css';
const money = value => new Intl.NumberFormat('es-AR', { style:'currency', currency:'ARS', maximumFractionDigits:0 }).format(value);
const day = value => value.slice(0,10);
const nights = (start,end) => Math.max(0, (new Date(day(end)) - new Date(day(start))) / 86400000);
const formatDate = value => new Date(value).toLocaleDateString('es-AR', { day:'2-digit', month:'short', timeZone:'UTC' });
const today = new Date().toLocaleDateString('en-CA', { timeZone:'America/Argentina/Buenos_Aires' });
function App() {
  const [token,setToken] = useState(() => sessionStorage.getItem('token') || '');
  const [view,setView] = useState(token ? 'Reservas' : 'Catálogo');
  const [cabanas,setCabanas] = useState([]);
  const [reservas,setReservas] = useState([]);
  const [huespedes,setHuespedes] = useState([]);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [modal,setModal] = useState(null);
  const [search,setSearch] = useState('');
  const [status,setStatus] = useState('Todas');
  const [range,setRange] = useState({ entrada:'', salida:'' });
  function logout() { sessionStorage.removeItem('token'); setToken(''); setReservas([]); setHuespedes([]); setView('Catálogo'); setModal(null); }
  async function api(path,options={}) {
    const response = await fetch('/api'+path,{ ...options, headers:{ 'Content-Type':'application/json', ...(token ? { Authorization:'Bearer '+token } : {}), ...options.headers } });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) { if (response.status === 401 && path !== '/auth/login') logout(); throw new Error(data?.error || 'No se pudo completar la solicitud.'); }
    return data;
  }
  async function refresh() {
    setLoading(true); setError('');
    try {
      const cabins = await api('/cabanas'); setCabanas(cabins);
      if (token) { const [bookings, guests] = await Promise.all([api('/reservas'),api('/huespedes')]); setReservas(bookings); setHuespedes(guests); }
    } catch(e) { setError(e.message || 'No hay conexión con el servidor.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); },[token]);
  const active = reservas.filter(r => r.estado !== 'Cancelada');
  const occupied = new Set(active.filter(r => day(r.entrada) <= today && day(r.salida) > today).map(r => r.cabanaId));
  const filtered = reservas.filter(r => (status === 'Todas' || r.estado === status) && (r.huesped.nombre+' '+r.cabana.nombre).toLowerCase().includes(search.toLowerCase()) && (!range.entrada || day(r.salida) > range.entrada) && (!range.salida || day(r.entrada) < range.salida));
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (modal.type === 'login') {
        const result = await api('/auth/login',{method:'POST',body:JSON.stringify(data)});
        sessionStorage.setItem('token',result.token); setToken(result.token); setView('Reservas');
      } else if (modal.type === 'guest') {
        await api('/huespedes',{method:'POST',body:JSON.stringify(data)}); await refresh(); setNotice('Huésped registrado.');
      } else {
        const record = modal.record;
        const payload = {...data,cabanaId:Number(data.cabanaId),huespedId:Number(data.huespedId),personas:Number(data.personas)};
        await api('/reservas'+(record ? '/'+record.id : ''),{method:record ? 'PUT':'POST',body:JSON.stringify(payload)});
        await refresh(); setNotice(record ? 'Reserva actualizada.' : 'Reserva creada.');
      }
      setModal(null);
    } catch(e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError('');
    try { await api('/reservas/'+modal.record.id,{method:'DELETE'}); setModal(null); await refresh(); setNotice('Reserva eliminada.'); }
    catch(e) { setError(e.message); } finally { setBusy(false); }
  }
  const open = value => { setError(''); setModal(value); };
  return <div className="app">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={e => {e.preventDefault();setView(token?'Reservas':'Catálogo');}}><span className="brand-icon"><House size={28}/></span><span>Cabañas<strong>Puerto Yeruá</strong></span></a>
      <div className="nav-label">TU ESPACIO</div>
      <nav>{(token ? [[CalendarDays,'Reservas'],[House,'Cabañas'],[Users,'Huéspedes']] : [[House,'Catálogo']]).map(([Icon,label]) => <button className={view===label?'selected':''} key={label} onClick={()=>{setView(label);setNotice('');}}><Icon size={20}/>{label}</button>)}</nav>
      <div className="side-bottom"><div className="location"><MapPin size={18}/><span>Puerto Yeruá<br/><small>Entre Ríos, Argentina</small></span></div>{token ? <button onClick={logout}><LogOut size={18}/>Cerrar sesión</button> : <button onClick={()=>open({type:'login'})}><Users size={18}/>Acceso del encargado</button>}</div>
    </aside>
    <main>
      <header className="topbar"><span>Gestión de alojamientos</span><span className="profile"><span className="avatar">{token?'A':'V'}</span>{token?'Administrador':'Visitante'}</span></header>
      <div className="content">
        <div className="heading"><div><p className="eyebrow">PUERTO YERUÁ · ENTRE RÍOS</p><h1>{view==='Reservas'?'Tus reservas, en un lugar':view==='Huéspedes'?'Huéspedes':view==='Cabañas'?'Nuestras cabañas':'Un descanso cerca del río'}</h1><p>{view==='Reservas'?'Organizá las estadías y encontrá lugar para cada descanso.':view==='Huéspedes'?'Los datos que necesitás para recibir a tus visitantes.':'Conocé los alojamientos y planificá la próxima estadía.'}</p></div>{token && view==='Reservas' && <button className="primary" onClick={()=>open({type:'booking'})}><Plus size={19}/>Nueva reserva</button>}{token && view==='Huéspedes' && <button className="primary" onClick={()=>open({type:'guest'})}><Plus size={19}/>Nuevo huésped</button>}</div>
        {error && !modal && <div role="alert" className="alert">{error}<button onClick={refresh}>Reintentar</button></div>}
        {notice && <div role="status" className="notice"><Check size={18}/>{notice}<button aria-label="Cerrar aviso" onClick={()=>setNotice('')}><X size={16}/></button></div>}
        {loading ? <div className="empty">Cargando información…</div> : <>
        {view==='Reservas' && <>
          <div className="stats"><Stat label="Reservas activas" value={active.length} icon={<CalendarDays/>}/><Stat label="Cabañas libres hoy" value={cabanas.length-occupied.size} icon={<House/>}/><Stat label="Huéspedes registrados" value={huespedes.length} icon={<Users/>}/></div>
          <div className="panel"><div className="panel-title"><h2>Listado de reservas</h2><span>{filtered.length} reservas</span></div>
          <div className="filters"><label className="search"><Search size={18}/><input aria-label="Buscar huésped o cabaña" placeholder="Buscar huésped o cabaña" value={search} onChange={e=>setSearch(e.target.value)}/></label><select aria-label="Estado" value={status} onChange={e=>setStatus(e.target.value)}>{['Todas','Confirmada','Pendiente','Cancelada'].map(s=><option key={s}>{s}</option>)}</select><label>Desde<input type="date" value={range.entrada} onChange={e=>setRange({...range,entrada:e.target.value})}/></label><label>Hasta<input type="date" value={range.salida} onChange={e=>setRange({...range,salida:e.target.value})}/></label></div>
          <div className="table-wrap"><table><thead><tr>{['Huésped','Cabaña','Estadía','Total','Estado','Acciones'].map(s=><th key={s}>{s}</th>)}</tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td><strong>{r.huesped.nombre}</strong><small>Reserva #{r.id}</small></td><td>{r.cabana.nombre}<small>{r.personas} personas</small></td><td>{formatDate(r.entrada)} — {formatDate(r.salida)}<small>{nights(r.entrada,r.salida)} noches</small></td><td><strong>{money(Number(r.tarifaNoche)*nights(r.entrada,r.salida))}</strong></td><td><span className={'badge '+r.estado.toLowerCase()}>{r.estado}</span></td><td><div className="actions"><button aria-label={'Editar reserva '+r.id} onClick={()=>open({type:'booking',record:r})}><Pencil size={17}/></button><button aria-label={'Eliminar reserva '+r.id} onClick={()=>open({type:'delete',record:r})}><Trash2 size={17}/></button></div></td></tr>)}</tbody></table></div>{!filtered.length && <div className="empty"><CalendarDays size={30}/><h3>{reservas.length?'No hay coincidencias':'Todavía no hay reservas'}</h3><p>{reservas.length?'Probá con otros filtros.':'Registrá un huésped y creá tu primera reserva.'}</p></div>}</div>
          <div className="tip"><Trees size={27}/><div><strong>Todo listo para recibirlos</strong><p>Consultá la disponibilidad al cargar cada reserva. Las fechas superpuestas se verifican al guardar.</p></div></div>
        </>}
        {(view==='Cabañas'||view==='Catálogo') && <><div className="landscape"><div><span>VIVÍ PUERTO YERUÁ</span><h2>Tiempo para bajar un cambio.</h2><p>Descanso, naturaleza y días para disfrutar.</p></div><Trees size={100} strokeWidth={1}/></div><div className="cabins">{cabanas.map((c,i)=><article className="cabin" key={c.id}><div className={'cabin-art art-'+i}><House size={80} strokeWidth={1}/><span>Cabaña {String(i+1).padStart(2,'0')}</span></div><div className="cabin-body"><h2>{c.nombre}</h2><p>{c.descripcion}</p><div className="capacity"><BedDouble size={18}/>Hasta {c.capacidad} personas</div><div className="cabin-price"><strong>{money(c.precioNoche)}<small> / noche</small></strong><button className="secondary" onClick={()=>token?open({type:'booking',cabanaId:c.id}):open({type:'login'})}>{token?'Reservar':'Acceso del encargado'}</button></div></div></article>)}</div><p className="footnote">Alojamientos y tarifas ficticios para demostración académica.</p></>}
        {view==='Huéspedes' && <div className="panel"><div className="panel-title"><h2>Huéspedes registrados</h2><span>{huespedes.length} personas</span></div><div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Documento</th><th>Teléfono</th></tr></thead><tbody>{huespedes.map(h=><tr key={h.id}><td><strong>{h.nombre}</strong></td><td>{h.documento}</td><td>{h.telefono}</td></tr>)}</tbody></table></div>{!huespedes.length&&<div className="empty">Registrá el primer huésped para comenzar.</div>}</div>}
        </>}
        <footer>Cabañas Puerto Yeruá <span>Proyecto académico · Gestión de reservas</span></footer>
      </div>
    </main>
    {modal && <div className="overlay" onClick={e=>{if(e.target===e.currentTarget&&!busy)setModal(null);}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="close" aria-label="Cerrar" disabled={busy} onClick={()=>setModal(null)}><X/></button><h2 id="modal-title">{modal.type==='login'?'Bienvenido de nuevo':modal.type==='guest'?'Registrar huésped':modal.type==='delete'?'Eliminar reserva':modal.record?'Editar reserva':'Nueva reserva'}</h2><p>{modal.type==='login'?'Ingresá al panel de administración.':modal.type==='delete'?'Se eliminará la reserva #'+modal.record.id+'. Esta acción libera sus fechas.':'Completá los datos para continuar.'}</p>{error&&<div role="alert" className="alert">{error}</div>}{modal.type==='delete'?<div className="form-actions"><button className="secondary" disabled={busy} onClick={()=>setModal(null)}>Volver</button><button className="danger" disabled={busy} onClick={remove}>{busy?'Eliminando…':'Eliminar reserva'}</button></div>:<form onSubmit={submit}>
      {modal.type==='login'?<><label>Email<input name="email" type="email" required autoFocus autoComplete="username"/></label><label>Contraseña<input name="password" type="password" required autoComplete="current-password"/></label></>:modal.type==='guest'?<><label>Nombre y apellido<input name="nombre" required minLength={2} maxLength={100} autoFocus/></label><label>Documento<input name="documento" required minLength={3} maxLength={30}/></label><label>Teléfono<input name="telefono" required minLength={3} maxLength={40}/></label></>:<><label>Cabaña<select name="cabanaId" defaultValue={modal.record?.cabanaId||modal.cabanaId||''} required autoFocus><option value="" disabled>Seleccioná una cabaña</option>{cabanas.map(c=><option key={c.id} value={c.id}>{c.nombre} · {money(c.precioNoche)} / noche · {c.capacidad} personas</option>)}</select></label><label>Huésped<select name="huespedId" defaultValue={modal.record?.huespedId||''} required><option value="" disabled>Seleccioná un huésped</option>{huespedes.map(h=><option key={h.id} value={h.id}>{h.nombre}</option>)}</select></label><p className="field-help">Podés registrar un huésped desde la sección Huéspedes.</p><div className="form-row"><label>Entrada<input name="entrada" type="date" required defaultValue={modal.record?day(modal.record.entrada):''}/></label><label>Salida<input name="salida" type="date" required defaultValue={modal.record?day(modal.record.salida):''}/></label></div><div className="form-row"><label>Personas<input name="personas" type="number" min="1" max="100" required defaultValue={modal.record?.personas||1}/></label><label>Estado<select name="estado" defaultValue={modal.record?.estado||'Confirmada'}>{['Confirmada','Pendiente','Cancelada'].map(s=><option key={s}>{s}</option>)}</select></label></div><p className="field-help">El precio de la noche se conserva al editar una reserva de la misma cabaña. Las reservas pendientes también ocupan fechas.</p></>}
      <div className="form-actions"><button type="button" className="secondary" disabled={busy} onClick={()=>setModal(null)}>Cancelar</button><button className="primary" disabled={busy}>{busy?'Guardando…':modal.type==='login'?'Ingresar':'Guardar'}</button></div>
    </form>}</section></div>}
  </div>;
}
function Stat({label,value,icon}) {return <div className="stat"><div><span>{label}</span><strong>{value}</strong></div><span className="stat-icon">{icon}</span></div>;}
createRoot(document.getElementById('root')).render(<App/>);
