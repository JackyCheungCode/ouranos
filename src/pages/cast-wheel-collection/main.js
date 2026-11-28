import { castProducts } from './demo-products.js';
import './style.css';

const grid=document.querySelector('#wheels-grid');
const count=document.querySelector('#product-count');
const empty=document.querySelector('#wheels-empty');
const modelFilter=document.querySelector('#filter-model');
const diameterFilter=document.querySelector('#filter-diameter');
const sortSelect=document.querySelector('#sort-products');

function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function card(product){
  const specs=product.preview.map(([label,value])=>'<div class="wheel-card__spec"><span>'+escapeHtml(label)+'</span><strong>'+escapeHtml(value)+'</strong></div>').join('');
  return '<article class="wheels-product-card" data-product="'+escapeHtml(product.id)+'">'
    +'<div class="wheel-card__image"><img src="'+escapeHtml(product.image)+'" alt="BBS '+escapeHtml(product.model)+' cast wheel" width="900" height="900" loading="lazy" decoding="async"></div>'
    +'<div class="wheel-card__body"><div><p class="wheel-card__eyebrow">'+escapeHtml(product.family)+'</p><h3 class="wheel-card__title">'+escapeHtml(product.model)+' <span>'+escapeHtml(product.part)+'</span></h3><p class="wheel-card__design">'+escapeHtml(product.finish)+'</p></div>'
    +'<div class="wheel-card__specs">'+specs+'</div>'
    +'<div class="wheel-card__stock"><span>Available stock</span><strong>'+escapeHtml(product.stock)+' pcs</strong></div>'
    +'<div class="wheel-card__actions"><p-button href="/wheel-product/?type=cast&id='+encodeURIComponent(product.id)+'" variant="primary">DISCOVER</p-button><p-button href="/wheel-enquiry/?type=cast&id='+encodeURIComponent(product.id)+'&model='+encodeURIComponent(product.part)+'&stock='+encodeURIComponent(product.stock)+'" variant="secondary">ENQUIRE</p-button></div></div></article>';
}
function render(){
  const model=modelFilter.value || 'all';
  const diameter=diameterFilter.value || 'all';
  const sort=sortSelect.value || 'featured';
  let items=castProducts.filter(p=>(model==='all'||p.model===model)&&(diameter==='all'||p.diameter===diameter));
  if(sort==='az')items.sort((a,b)=>(a.model+' '+a.part).localeCompare(b.model+' '+b.part));
  if(sort==='stock')items.sort((a,b)=>b.stock-a.stock);
  grid.innerHTML=items.map(card).join('');
  grid.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.src='/images/wheel-placeholder.svg';},{once:true}));
  count.textContent=items.length+' products';
  empty.hidden=items.length>0;
  grid.hidden=items.length===0;
}
[modelFilter,diameterFilter,sortSelect].forEach(control=>control.addEventListener('change',render));
render();
document.documentElement.dataset.castCatalogueReady='true';
