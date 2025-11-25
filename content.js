console.log('🛡️ Cyberbullying Detector - Content Script Loaded');

const HIGHLIGHT_COLORS = { harassment:'rgba(245,101,101,0.2)', safe:'rgba(72,187,120,0.1)' };
let analyzedComments = new Map();

chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
  if(request.action==='extractComments'){ extractComments().then(c=>sendResponse({success:true,comments:c})).catch(e=>sendResponse({success:false,error:e.message})); return true; }
  if(request.action==='highlightComments'){ highlightComments(request.predictions); sendResponse({success:true}); return true; }
  if(request.action==='clearHighlights'){ clearHighlights(); sendResponse({success:true}); return true; }
});

// Extract comments
async function extractComments(){
  await waitForComments();
  return [...document.querySelectorAll('#content-text')].map(el=>el.textContent.trim()).filter(t=>t.length>0 && t.length<5000);
}

// Wait comments
function waitForComments(timeout=10000){
  return new Promise((resolve,reject)=>{
    const start=Date.now();
    const check=()=>{
      const comments=document.querySelectorAll('#content-text');
      if(comments.length>0) resolve();
      else if(Date.now()-start>timeout) reject(new Error('Timeout: Comments not found'));
      else setTimeout(check,100);
    }; check();
  });
}

// Highlight
function highlightComments(predictions){
  const commentEls=document.querySelectorAll('#content-text');
  predictions.forEach((p,i)=>{
    if(i>=commentEls.length) return;
    const el=commentEls[i];
    const parent=el.closest('ytd-comment-renderer'); if(!parent) return;
    if(!parent.dataset.originalStyle) parent.dataset.originalStyle=parent.style.cssText;
    parent.style.backgroundColor=p.is_harassment?HIGHLIGHT_COLORS.harassment:HIGHLIGHT_COLORS.safe;
    parent.style.borderLeft=p.is_harassment?'4px solid #f56565':'4px solid #48bb78';
    parent.style.paddingLeft='8px';
    parent.style.transition='background-color 0.3s ease, border-left 0.3s ease';
    addBadge(parent,p);
    analyzedComments.set(el,p);
  });
}

function addBadge(parent,p){
  parent.querySelector('.cyberbully-badge')?.remove();
  const badge=document.createElement('div'); badge.className='cyberbully-badge';
  badge.style.cssText=`display:inline-flex;align-items:center;gap:4px;padding:4px 10px;margin-left:8px;border-radius:12px;font-size:11px;font-weight:700;background:${p.is_harassment?'rgba(245,101,101,0.1)':'rgba(72,187,120,0.1)'};color:${p.is_harassment?'#f56565':'#48bb78'};`;
  badge.textContent=`${p.is_harassment?'⚠️':'✓'} ${p.is_harassment?'Harcèlement détecté':'Commentaire sain'} (${(p.confidence*100).toFixed(0)}%)`;
  const header=parent.querySelector('#header')||parent;
  header.appendChild(badge);
}

function clearHighlights(){
  analyzedComments.clear();
  document.querySelectorAll('.cyberbully-badge').forEach(b=>b.remove());
  document.querySelectorAll('ytd-comment-renderer[data-original-style]').forEach(el=>{ el.style.cssText=el.dataset.originalStyle; delete el.dataset.originalStyle; });
}

// Init
function init(){
  const style=document.createElement('style');
  style.textContent=`
    .cyberbully-badge{animation:fadeIn 0.3s ease;}
    @keyframes fadeIn{from{opacity:0;transform:translateY(-5px);}to{opacity:1;transform:translateY(0);}}
    ytd-comment-renderer[data-original-style]{transition:background-color 0.3s ease,border-left 0.3s ease !important;}
  `;
  document.head.appendChild(style);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
