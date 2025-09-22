// Demo "Tomador de lista" — Single course, no auth
const { useEffect, useMemo, useState, useRef } = React;
const e = React.createElement;

function uid(prefix){ return (prefix||'id') + '_' + Math.random().toString(36).slice(2,9); }
function todayStr(d=new Date()){ const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
function safeStats(s){ return s && typeof s==='object' ? s : {present:0, absent:0, later:0}; }
function pct(stats){ const s=safeStats(stats); const d=(s.present||0)+(s.absent||0); return d? Math.round((s.present/d)*100):0; }
function avg(arr){ if(!arr||!arr.length) return 0; const nums=arr.map(x=>Number(x.value)).filter(v=>!Number.isNaN(v)); if(!nums.length) return 0; const s=nums.reduce((a,b)=>a+b,0); return Math.round((s/nums.length)*100)/100; }

const LS_KEY = 'demo_tomador_lista_v1';

function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw) return JSON.parse(raw);
  }catch(_){}
  // Estado inicial DEMO
  const courseId = uid('curso');
  const s1 = uid('al'); const s2 = uid('al'); const s3 = uid('al');
  return {
    selectedDate: todayStr(),
    selectedCourseId: courseId,
    courses: {
      [courseId]: {
        id: courseId,
        name: 'Curso DEMO',
        days: ['lun','mie','vie'],
        preceptor: { name: 'Preceptor DEMO', phone: '' },
        students: {
          [s1]: { id:s1, name:'Ana Gómez', condition:'cursa', stats:{present:2, absent:1, later:0}, history:[{id:uid('h'), date: todayStr(), status:'present'}], grades:[{id:uid('g'), date: todayStr(), tipo:'escrito', value:8}] },
          [s2]: { id:s2, name:'Bruno Díaz', condition:'cursa', stats:{present:1, absent:1, later:1}, history:[], grades:[{id:uid('g'), date: todayStr(), tipo:'oral', value:6}] },
          [s3]: { id:s3, name:'Carla Pérez', condition:'recursa', stats:{present:0, absent:2, later:0}, history:[], grades:[] }
        }
      }
    }
  };
}
function saveState(state){ try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(_){ } }

function Header({ selectedDate, onChangeDate }){
  return e('header',
    { className:'w-full p-4 md:p-6 text-white flex items-center justify-between sticky top-0 z-10 shadow',
      style:{ background:'#24496e' } },
    e('div', { className:'flex flex-col gap-1' },
      e('div', { className:'flex items-center gap-3' },
        e('span', { className:'text-2xl md:text-3xl font-bold tracking-tight' }, 'Tomador de lista'),
        e('span', { className:'text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-lg' }, 'MUESTRA DE PRUEBA')
      ),
      e('a', { href:'https://www.instagram.com/docentesbrown', target:'_blank', rel:'noopener',
               className:'text-xs md:text-sm underline', style:{ opacity:.9 } }, 'creado por @docentesbrown')
    ),
    e('div', { className:'flex items-center gap-2' },
      e('label', { className:'text-sm opacity-90 hidden md:block' }, 'Fecha:'),
      e('input', { type:'date', value:selectedDate, onChange:(ev)=>onChangeDate(ev.target.value),
        className:'rounded-md px-2 py-1 text-sm', style:{ color:'#24496e' } })
    )
  );
}

function RollCallCard({ students, onMark, onUndo, selectedDate }){
  const [order, setOrder] = useState(students.map(s=>s.id));
  const [index, setIndex] = useState(0);
  const [ops, setOps] = useState([]);
  useEffect(()=>{ setOrder(students.map(s=>s.id)); setIndex(0); setOps([]); }, [students.map(s=>s.id).join('|')]);

  const currentId = order[index];
  const current = students.find(s=>s.id===currentId) || null;

  function handle(action){
    if(!current) return;
    onMark(current.id, action, selectedDate);
    if(action==='later'){
      const from=index; const arr=order.slice(); const [m]=arr.splice(from,1); arr.push(m);
      setOrder(arr); setOps(o=>o.concat([{id:current.id, action, fromIndex:from, toIndex:arr.length-1}]));
    }else{
      setOps(o=>o.concat([{id:current.id, action}])); setIndex(i=>Math.min(i+1, order.length));
    }
  }
  function undo(){
    if(!ops.length) return;
    const last = ops[ops.length-1];
    onUndo(last.id, last.action, selectedDate);
    if(last.action==='later'){
      const arr = order.slice(); const [m]=arr.splice(last.toIndex,1); arr.splice(last.fromIndex,0,m);
      setOrder(arr); setIndex(last.fromIndex);
    }else{
      setIndex(i=>Math.max(0,i-1));
    }
    setOps(a=>a.slice(0,-1));
  }

  if(!students.length) return e('div', {className:'p-6 text-center text-slate-600'}, 'No hay estudiantes en este curso.');

  const cardPos = Math.min(index+1, order.length);
  return e('div', { className:'p-4 md:p-6' },
    e('div', { className:'max-w-xl mx-auto' },
      e('div', { className:'mb-3 text-sm text-slate-600 text-center' }, `Tarjeta ${cardPos} / ${order.length}`),
      current
        ? e('div', { className:'rounded-3xl border shadow p-6 md:p-8 bg-white', style:{ borderColor:'#d7dbe0' } },
            e('div', { className:'text-center mb-6' },
              e('div', { className:'text-2xl md:4xl font-bold tracking-tight mb-2', style:{ color:'#24496e' } }, current.name),
              e('div', { className:'text-sm md:text-base text-slate-700' }, 'Asistencia acumulada: ',
                e('span', { className:'font-semibold', style:{ color:'#24496e' } }, pct(current.stats)+'%'),
                ' · Fecha sesión: ', e('span', { className:'font-semibold', style:{ color:'#24496e' } }, selectedDate)
              )
            ),
            e('div', { className:'grid grid-cols-2 gap-3 md:gap-4' },
              e('button', { onClick:()=>handle('present'), className:'py-3 md:py-4 rounded-2xl font-semibold border',
                style:{ background:'#e8f7ef', borderColor:'#cdebdc', color:'#166534' } }, 'Presente ✅'),
              e('button', { onClick:()=>handle('absent'), className:'py-3 md:py-4 rounded-2xl font-semibold border',
                style:{ background:'#fdecea', borderColor:'#f7d7d3', color:'#991b1b' } }, 'Ausente ❌'),
              e('button', { onClick:()=>handle('later'), className:'py-3 md:py-4 rounded-2xl font-semibold border col-span-2',
                style:{ background:'#f0eaf5', borderColor:'#e2d7ec', color:'#6c467e' } }, 'Revisar más tarde ⏳'),
              e('button', { onClick:undo, className:'py-2 md:py-2.5 rounded-xl font-medium col-span-2',
                style:{ background:'#f3efdc', color:'#24496e' } }, '← Volver al anterior (deshacer)')
            )
          )
        : e('div', { className:'rounded-3xl border shadow p-6 md:p-8 bg-white text-center', style:{ borderColor:'#d7dbe0' } },
            e('div', { className:'text-xl font-semibold mb-2', style:{ color:'#24496e' } }, '¡Lista completada!'),
            e('div', { className:'text-slate-700' }, 'Ya asignaste estado a todos.')
          )
    )
  );
}

function StudentsTable({ course, students, onAdd, onEdit, onDelete, onShowAbsences }){
  const [cond, setCond] = useState('cursa');
  const [name, setName] = useState('');
  const sorted = useMemo(()=>Object.values(students).sort((a,b)=>a.name.localeCompare(b.name)),[students]);
  return e('div', { className:'p-4 md:p-6' },
    e('div', { className:'flex flex-col md:flex-row gap-2 md:items-end mb-4' },
      e('div', { className:'flex-1' },
        e('label', { className:'block text-sm font-medium mb-1', style:{ color:'#24496e' } }, 'Agregar estudiante'),
        e('input', { placeholder:'Nombre y apellido', value:name, onChange:(ev)=>setName(ev.target.value),
          className:'w-full max-w-md px-3 py-2 border rounded-xl', style:{ borderColor:'#d7dbe0' } })
      ),
      e('div', { className:'flex items-center gap-2' },
        e('select', { value:cond, onChange:(ev)=>setCond(ev.target.value), className:'px-3 py-2 border rounded-xl', style:{ borderColor:'#d7dbe0' } },
          e('option', {value:'cursa'}, 'Cursa'),
          e('option', {value:'recursa'}, 'Recursa')
        )
      ),
      e('button', { onClick:()=>{ if(!name.trim()) return; onAdd(name.trim(), cond); setName(''); },
        className:'px-4 py-2 rounded-xl text-white', style:{ background:'#6c467e' } }, '+ Agregar')
    ),
    e('div', { className:'overflow-x-auto' },
      e('table', { className:'w-full text-left border rounded-xl overflow-hidden', style:{ borderColor:'#cbd5e1' } },
        e('thead', { style:{ background:'#24496e', color:'#ffffff' } },
          e('tr', null,
            e('th', { className:'p-3 text-sm' }, 'Estudiante'),
            e('th', { className:'p-3 text-sm' }, '% Asistencia'),
            e('th', { className:'p-3 text-sm' }, 'Presente'),
            e('th', { className:'p-3 text-sm' }, 'Ausente'),
            e('th', { className:'p-3 text-sm' }, 'Acciones')
          )
        ),
        e('tbody', null,
          ...(sorted.length? sorted.map((s,idx)=>{
            const st = safeStats(s.stats);
            const rowBg = idx%2===0 ? '#ffffff' : '#f3efdc';
            const isLow = pct(st) < 15;
            return e('tr', { key:s.id, style:{ background:rowBg, borderTop:'1px solid #cbd5e1' } },
              e('td', { className:'p-3' },
                e('div', { className:'flex items-center gap-2' },
                  e('span', { className:'font-medium' }, s.name),
                  e('span', { className:'text-[10px] px-2 py-0.5 rounded-full',
                    style:{ background: s.condition==='recursa' ? '#fde2e0' : '#e8f7ef', color: s.condition==='recursa' ? '#da6863' : '#166534' } },
                    s.condition==='recursa' ? 'Recursa' : 'Cursa'
                  )
                )
              ),
              e('td', { className:'p-3 font-semibold', style: isLow ? { background:'#fdecea', color:'#991b1b', borderRadius:'8px' } : { color:'#24496e' } }, pct(st)+'%'),
              e('td', { className:'p-3' }, st.present || 0),
              e('td', { className:'p-3' },
                e('div', { className:'flex items-center gap-2' },
                  e('span', null, st.absent || 0),
                  e('button', { onClick:()=>onShowAbsences(s), className:'text-xs px-2 py-1 rounded',
                    style:{ background:'#f3efdc', color:'#24496e' } }, 'Fechas')
                )
              ),
              e('td', { className:'p-3 text-right' },
                e('div', {className:'flex gap-2 justify-end'},
                  e('button', { onClick:()=>{
                      const nuevo = prompt('Editar nombre', s.name) || s.name;
                      const cond = prompt('Condición (cursa/recursa)', s.condition || 'cursa') || (s.condition || 'cursa');
                      const norm = (cond||'').toLowerCase()==='recursa' ? 'recursa' : 'cursa';
                      onEdit(s.id, { name: nuevo.trim(), condition: norm });
                    },
                    className:'text-xs px-2 py-1 rounded', style:{ background:'#f3efdc', color:'#24496e' } }, 'Editar'),
                  e('button', { onClick:()=>{ if(confirm('¿Eliminar estudiante y sus datos?')) onDelete(s.id); },
                    className:'text-xs px-3 py-1 rounded', style:{ background:'#fde2e0', color:'#da6863' } }, 'Eliminar')
                )
              )
            );
          }) : [e('tr', { key:'empty' }, e('td', { colSpan:5, className:'p-4 text-center text-slate-500' }, 'Sin estudiantes.'))])
        )
      )
    )
  );
}

function Modal({ open, title, onClose, children }){
  if(!open) return null;
  return e('div', { className:'fixed inset-0 z-50 flex items-end sm:items-center justify-center' },
    e('div', { className:'absolute inset-0', onClick:onClose, style:{ background:'rgba(0,0,0,.4)' } }),
    e('div', { className:'relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-lg p-4 sm:p-6 m-0 sm:m-4', style:{ background:'#ffffff', border:'1px solid #d7dbe0' } },
      e('div', { className:'flex items-center justify-between mb-3' },
        e('h3', { className:'text-lg font-semibold', style:{ color:'#24496e' } }, title),
        e('button', { onClick:onClose, className:'px-2 py-1 rounded', style:{ background:'#f3efdc', color:'#24496e' } }, '✕')
      ),
      e('div', null, children)
    )
  );
}

function AbsencesModal({ open, student, onClose, onApplyChange }){
  const [choices, setChoices] = useState({});
  useEffect(()=>{ setChoices({}); }, [open, student && student.id]);
  if(!open || !student) return null;
  const history = (student.history || []).map(h => h.id ? h : Object.assign({}, h, { id: uid('hist') }));
  const rows = history.filter(h => h.status==='absent' || h.status==='tarde').slice().sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  const totalAus = rows.filter(r => r.status==='absent').length;
  function labelFor(r){ if(r.status==='tarde') return 'Tarde'; return 'Ausente'; }
  return e(Modal, { open, title:`Inasistencias – ${student.name}`, onClose },
    e('div', null,
      e('div', { className:'mb-3 text-sm text-slate-700' }, 'Total de ausencias: ', e('strong', {style:{color:'#24496e'}}, totalAus)),
      e('div', { className:'max-h-72 overflow-auto border rounded-xl', style:{borderColor:'#d7dbe0'} },
        e('table', { className:'w-full text-left' },
          e('thead', { style:{background:'#24496e', color:'#fff'} },
            e('tr', null, e('th',{className:'p-2 text-sm'},'Fecha'), e('th',{className:'p-2 text-sm'},'Estado'),
              e('th',{className:'p-2 text-sm'},'Cambiar a'), e('th',{className:'p-2 text-sm'}))
          ),
          e('tbody', null,
            ...(rows.length? rows.map(r =>
              e('tr', { key:r.id, className:'border-t', style:{borderColor:'#e2e8f0'} },
                e('td', { className:'p-2' }, r.date || ''),
                e('td', { className:'p-2' }, labelFor(r)),
                e('td', { className:'p-2' },
                  e('select', { className:'px-2 py-1 border rounded', style:{borderColor:'#d7dbe0'},
                    value:choices[r.id] || '', onChange:(ev)=>setChoices(ch=>Object.assign({}, ch, { [r.id]: ev.target.value })) },
                    e('option', {value:''}, 'Seleccionar...'),
                    e('option', {value:'tarde'}, 'Tarde'),
                    e('option', {value:'erronea'}, 'Errónea (eliminar)')
                  )
                ),
                e('td', { className:'p-2 text-right' },
                  e('button', { className:'text-xs px-2 py-1 rounded', style:{background:'#fde2e0', color:'#da6863'},
                    onClick:()=>{ const ch = choices[r.id]; if(!ch){ alert('Elegí una opción en "Cambiar a".'); return; } onApplyChange(r.id, ch); } }, 'Aplicar')
                )
              )
            ): [e('tr', { key:'empty' }, e('td', { colSpan:4, className:'p-2 text-center text-slate-500' }, 'Sin registros.'))])
          )
        )
      )
    )
  );
}

function ExportModal({ open, onClose, onExportJSON, onImportJSON, onExportXLSX }){
  const fileRef = useRef(null);
  function onFile(ev){
    const file = ev.target.files && ev.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{ try{ onImportJSON(reader.result); } finally { ev.target.value=''; } };
    reader.readAsText(file);
  }
  if(!open) return null;
  return e(Modal, { open, title:'Exportar / Importar', onClose },
    e('div', { className:'grid grid-cols-1 gap-3' },
      e('button', { onClick:onExportXLSX, className:'px-4 py-2 rounded-xl text-white font-semibold', style:{ background:'#24496e' } }, 'Exportar .xlsx'),
      e('button', { onClick:onExportJSON, className:'px-4 py-2 rounded-xl font-semibold', style:{ background:'#f3efdc', color:'#24496e' } }, 'Exportar a PC (.json)'),
      e('button', { onClick:()=> fileRef.current && fileRef.current.click(), className:'px-4 py-2 rounded-xl font-semibold', style:{ background:'#f3efdc', color:'#24496e' } }, 'Importar desde PC (.json)'),
      e('input', { ref:fileRef, type:'file', accept:'.json,application/json', className:'hidden', onChange:onFile })
    )
  );
}

function App(){
  const [state, setState] = useState(loadState());
  const [exportOpen, setExportOpen] = useState(false);
  const [absencesOpen, setAbsencesOpen] = useState(false);
  const [absencesStudentId, setAbsencesStudentId] = useState(null);

  useEffect(()=>{ saveState(state); }, [state]);
  useEffect(()=>{ window.__openExport = () => setExportOpen(true); return () => { try{ delete window.__openExport; }catch(_){}}; }, []);

  const selectedCourse = state.courses[state.selectedCourseId];
  const studentsArr = useMemo(()=>Object.values(selectedCourse.students).sort((a,b)=>a.name.localeCompare(b.name)), [selectedCourse]);

  function setSelectedDate(dateStr){ setState(s => Object.assign({}, s, { selectedDate: dateStr || todayStr() })); }
  function addStudent(name, condition){
    const id = uid('al');
    setState(s=>{
      const next = structuredClone(s);
      next.courses[s.selectedCourseId].students[id] = { id, name, condition, stats:{present:0, absent:0, later:0}, history:[], grades:[] };
      return next;
    });
  }
  function editStudent(id, payload){
    setState(s=>{
      const next = structuredClone(s);
      const st = next.courses[s.selectedCourseId].students[id];
      if(typeof payload==='string'){ st.name = payload; }
      else { if(payload.name) st.name = payload.name; if(payload.condition) st.condition = payload.condition; }
      return next;
    });
  }
  function deleteStudent(id){
    if(!confirm('¿Seguro que querés eliminar a este estudiante y toda su información?')) return;
    setState(s=>{
      const next = structuredClone(s);
      delete next.courses[s.selectedCourseId].students[id];
      return next;
    });
  }
  function markAttendance(studentId, action, dateStr){
    setState(s=>{
      const next = structuredClone(s);
      const st = next.courses[s.selectedCourseId].students[studentId];
      const stats = safeStats(st.stats);
      if(action==='present') stats.present += 1;
      if(action==='absent')  stats.absent  += 1;
      if(action==='later')   stats.later   += 1;
      st.stats = stats;
      const hist = st.history? st.history.slice():[];
      hist.push({ id: uid('hist'), date: dateStr || todayStr(), status: action });
      st.history = hist;
      return next;
    });
  }
  function undoAttendance(studentId, action, dateStr){
    setState(s=>{
      const next = structuredClone(s);
      const st = next.courses[s.selectedCourseId].students[studentId];
      const stats = safeStats(st.stats);
      const hist = st.history? st.history.slice():[];
      for(let i=hist.length-1;i>=0;i--){
        const h = hist[i];
        if(h.status===action && (dateStr? h.date===dateStr: true)){
          hist.splice(i,1);
          if(action==='present' && stats.present>0) stats.present -= 1;
          if(action==='absent'  && stats.absent>0)  stats.absent  -= 1;
          if(action==='later'   && stats.later>0)   stats.later   -= 1;
          break;
        }
      }
      st.stats = stats; st.history = hist;
      return next;
    });
  }
  function openAbsences(student){ setAbsencesStudentId(student.id); setAbsencesOpen(true); }
  function applyAbsenceChange(studentId, histId, reason){
    setState(s=>{
      const next = structuredClone(s);
      const st = next.courses[s.selectedCourseId].students[studentId];
      const stats = safeStats(st.stats);
      const hist = (st.history || []).slice();
      const idx = hist.findIndex(h => h.id === histId);
      if(idx === -1) return s;
      const entry = Object.assign({}, hist[idx]);
      if (reason === 'erronea') {
        if (entry.status === 'absent' && stats.absent > 0) stats.absent -= 1;
        if (entry.status === 'tarde'  && stats.later  > 0) stats.later  -= 1;
        entry.status = 'present';
        stats.present = (stats.present || 0) + 1;
        hist[idx] = entry;
      } else if (reason === 'tarde') {
        if (entry.status === 'absent') { if (stats.absent > 0) stats.absent -= 1; }
        if (entry.status !== 'tarde') { stats.later = (stats.later || 0) + 1; }
        stats.present = (stats.present || 0) + 1;
        entry.status = 'tarde';
        hist[idx] = entry;
      }
      st.history = hist;
      st.stats = { present: stats.present||0, absent: stats.absent||0, later: stats.later||0 };
      return next;
    });
  }

  function exportStateJSON(){
    try{
      const data = JSON.stringify(state, null, 2);
      const blob = new Blob([data], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'demo_backup.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      alert('Exportación lista: se descargó demo_backup.json');
    } catch(err){ alert('No se pudo exportar: ' + (err && err.message ? err.message : err)); }
  }
  function importStateFromText(text){
    try{
      const parsed = JSON.parse(text);
      setState(parsed);
      alert('Importación exitosa.');
    } catch(_){ alert('Archivo inválido.'); }
  }
  function exportXLSX(){
    const course = selectedCourse;
    const rowsHist = [['Estudiante','Fecha','Estado']];
    Object.values(course.students).forEach(st => { (st.history || []).forEach(h => rowsHist.push([st.name, h.date || '', h.status || ''])); });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rowsHist), 'Historial');
    XLSX.writeFile(wb, `asistencia_demo.xlsx`);
  }

  const absencesStudent = selectedCourse && absencesStudentId ? selectedCourse.students[absencesStudentId] || null : null;

  return e('div', null,
    e(Header, { selectedDate: state.selectedDate, onChangeDate: setSelectedDate }),
    e('main', { className:'max-w-5xl mx-auto' },
      e('div', { className:'w-full overflow-x-auto border-b border-slate-300 bg-white' },
        e('div', { className:'flex items-center gap-2 p-3 min-w-max' },
          e('div', { className:'flex items-center gap-2 px-3 py-2 rounded-2xl border', style:{ borderColor:'#24496e', background:'#f0f4f8' } },
            e('span', { className:'text-sm font-medium', style:{ color:'#24496e' } }, selectedCourse.name),
            e('span', { className:'ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full', style:{ background:'#24496e', color:'#fff' } }, 'MUESTRA')
          )
        )
      ),
      e('div', null,
        e(RollCallCard, { students:studentsArr, selectedDate: state.selectedDate, onMark:markAttendance, onUndo:undoAttendance }),
        e(StudentsTable, { course:selectedCourse, students:selectedCourse.students,
          onAdd:addStudent, onEdit:editStudent, onDelete:deleteStudent, onShowAbsences:openAbsences })
      )
    ),
    e(ExportModal, { open:exportOpen, onClose:()=>setExportOpen(false), onExportJSON:exportStateJSON, onImportJSON:importStateFromText, onExportXLSX:exportXLSX }),
    e(AbsencesModal, { open:absencesOpen, student:absencesStudent, onClose:()=>setAbsencesOpen(false),
      onApplyChange:(histId, reason)=>applyAbsenceChange(absencesStudentId, histId, reason) })
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(e(App));