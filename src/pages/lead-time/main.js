import { demoProducts } from '../wheels/demo-products.js';
import './style.css';
const $=(s,root=document)=>root.querySelector(s);
const $all=(s,root=document)=>[...root.querySelectorAll(s)];
const fmt=d=>new Intl.DateTimeFormat('en-US',{month:'short',day:'2-digit',year:'numeric'}).format(d);
const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
let loading=false;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function initForm(){
  for(const p of demoProducts){const o=document.createElement('p-select-option');o.value=p.id;o.textContent=p.model+' · '+p.construction;$('#lead-product').append(o);}
  $('#lead-order-date').value=iso(new Date());
}
function setLoadingStep(index,percent){
  const items=$all('#loading-steps li');
  items.forEach((item,i)=>{item.classList.toggle('is-active',i===index);item.classList.toggle('is-complete',i<index);});
  $('#loading-percent').textContent=percent+'%';
  $('#loading-progress').style.width=percent+'%';
}
function renderGantt(data){
  const dates=data.dates;
  const htmlHead='<div class="gantt-head"><div class="gantt-line-label">PRODUCTION LINE / ORDER</div><div class="gantt-days">'+dates.map((d,i)=>'<span class="'+(i===data.todayOffset?'is-today':'')+'"><b>'+d.day+'</b><small>'+d.weekday+'</small></span>').join('')+'</div></div>';
  const rows=data.lines.map(line=>{
    const jobs=line.jobs.map(job=>{
      const hue=job.customer?42:(job.color*47+188)%360;
      const color=job.customer?'#a17a3d':'hsl('+hue+' 31% 54%)';
      const bars=job.segments.map(seg=>{
        const left=seg.offset/dates.length*100,width=seg.duration/dates.length*100;
        return '<span class="gantt-segment" style="left:'+left+'%;width:'+width+'%;background:'+color+'" title="'+job.orderId+' · '+seg.name+'">'+(seg.duration>=1?'<b>'+seg.short+'</b>':'')+'</span>';
      }).join('');
      return '<div class="gantt-job '+(job.customer?'is-customer':'')+'" style="--job-color:'+color+'">'+bars+'</div>';
    }).join('');
    return '<div class="gantt-row"><div class="gantt-row__name"><strong>'+line.id+'</strong><small>'+line.jobs.length+' scheduled orders</small></div><div class="gantt-track"><div class="gantt-grid">'+dates.map((_,i)=>'<i class="'+(i===data.todayOffset?'is-today':'')+'"></i>').join('')+'</div>'+jobs+'</div></div>';
  }).join('');
  $('#gantt-chart').innerHTML=htmlHead+rows;
}
async function runLoadingSequence(){
  $('#lead-loading').hidden=false;
  $('#production-results').hidden=true;
  $('#loading-steps li').forEach?.(()=>{});
  setLoadingStep(0,0);
  const steps=[{ms:1500,pct:21},{ms:2500,pct:57},{ms:1500,pct:79},{ms:1500,pct:100}];
  for(let i=0;i<steps.length;i++){await wait(steps[i].ms);setLoadingStep(i+1,steps[i].pct);}
  await wait(180);
}
async function submit(e){
  e.preventDefault();
  if(loading)return;
  const id=$('#lead-product').value;
  if(!id){$('#lead-form-status').textContent='Select a product to continue.';return;}
  const product=demoProducts.find(p=>p.id===id);
  const quantity=Number($('#lead-quantity').value||4);
  const orderDate=$('#lead-order-date').value||iso(new Date());
  // Manufacturing route is derived from the selected product; no process choice is exposed to customers.
  const process=String(product?.construction||'Forged').toLowerCase()==='cast'?'casting':'forging';
  loading=true;
  $('#lead-submit').disabled=true;
  $('#lead-form-status').textContent='Checking production availability…';
  try{
    const scheduleRequest=fetch('/api/lead-time/simulate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({productId:id,process,quantity,orderDate})});
    await runLoadingSequence();
    const response=await scheduleRequest;
    if(!response.ok)throw Error('Production schedule service unavailable.');
    const payload=await response.json();
    const start=new Date(payload.startDate+'T00:00:00');
    const finish=new Date(payload.finishDate+'T00:00:00');
    $('#result-product').textContent=product.model;
    $('#result-quantity').textContent=quantity+' WHEELS';
    $('#result-start').textContent=fmt(start);
    $('#result-finish').textContent=fmt(finish);
    $('#result-duration').textContent=payload.targetWorkingDays+' WORKING DAYS';
    renderGantt(payload);
    $('#lead-loading').hidden=true;
    $('#production-results').hidden=false;
    $('#lead-form-status').textContent='Schedule generated · '+payload.lines.length+' production lines';
    $('#production-results').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(err){
    $('#lead-loading').hidden=true;
    $('#lead-form-status').textContent=err.message||'Unable to generate the production schedule.';
  }finally{
    loading=false;
    $('#lead-submit').disabled=false;
  }
}
$('#lead-form').addEventListener('submit',submit);
initForm();
