const scene=document.querySelector('.experience');
const star=document.querySelector('#orbit-star');
const labelHost=document.querySelector('.orbit-labels');
const panel=document.querySelector('.selected-project');
const host=document.querySelector('.video-host');
const title=document.querySelector('#selected-title');
const play=document.querySelector('.play-selected');
const stop=document.querySelector('.stop-video');
const count=document.querySelector('#project-count');
const announcement=document.querySelector('#announcement');
// This turn is explicitly requested by a navigation click; never skip its frames.
const TURN_DURATION=550;
let works=[],labels=[],target=0,position=0,current=0,raf=0,playing=false,geometry={};
let turn=null;
const wrap=(n,length)=>((n%length)+length)%length;
function distance(index){let d=position-index;d-=Math.round(d/works.length)*works.length;return d;}
function layout(){
 const w=scene.clientWidth,scale=w/8547;
 // These are the original star centre and radius in the Figma canvas.
 const half=9063.0458984375/2,angle=88.630585*Math.PI/180;
 geometry={scale,radius:half*scale,cx:(4255.457+half*(Math.cos(angle)-Math.sin(angle)))*scale,cy:(780+half*(Math.sin(angle)+Math.cos(angle)))*scale};
 document.querySelectorAll('.star-control').forEach(button=>button.style.setProperty('--navigation-scale',2459*scale/2459));
 draw();
}
function draw(){
 if(!works.length)return;
 const {radius,cx,cy,scale}=geometry;
 star.style.left=`${cx}px`;star.style.top=`${cy}px`;
 star.style.transform=`translate(-50%,-50%) rotate(${88.630585+position*30}deg) scale(${radius*2/9063.05})`;
 labels.forEach((button,index)=>{
  const d=distance(index),angle=(d*30-1.369415)*Math.PI/180;
  const visible=Math.abs(d)<2.7;
  const selected=current===index;
  const opacity=visible?Math.min(1,(2.7-Math.abs(d))*3):0;
  button.style.left=`${cx+Math.cos(angle)*radius}px`;
  button.style.top=`${cy+Math.sin(angle)*radius+(Math.sin(angle)<0?-45:45)*scale}px`;
  button.style.transform=Math.sin(angle)<0?'translate(-50%,-100%)':'translate(-50%,0)';
  let labelOpacity = selected ? 0 : opacity;
  if (turn?.morph) {
   const {outgoingIndex, incomingScale, outgoingScale} = turn.morph;
   if (selected) labelOpacity = opacity * Math.max(0, 1 - incomingScale * 4);
   if (index === outgoingIndex) labelOpacity = opacity * Math.max(0, 1 - outgoingScale * 4);
  }
  button.style.opacity = String(labelOpacity);
  button.style.visibility = visible && labelOpacity > 0 ? 'visible' : 'hidden';
  button.tabIndex = visible && labelOpacity > 0 && !selected ? 0 : -1;
  button.setAttribute('aria-current',String(wrap(target,works.length)===index));
 });
}
function animate(now){
 if(!turn){raf=0;return;}
 const progress=Math.min(1,Math.max(0,(now-turn.started)/TURN_DURATION));
 const eased=(1-Math.cos(progress*Math.PI))/2;
 position=turn.from+(turn.to-turn.from)*eased;
 drawMorph(eased);
 draw();
 if (progress < 1) {
  raf = requestAnimationFrame(animate);
 } else {
  clearMorph();
  turn = null;
  raf = 0;
  draw();
 }
}

function poster(work){
 host.replaceChildren();
 const img=document.createElement('img');img.src=work.image;img.alt=work.title;img.width=640;img.height=360;
 host.append(img);playing=false;play.hidden=!(work.video||work.fileVideo||work.embed);stop.hidden=true;
}
function startVideo(){
 if(!works.length)return;
 const work=works[current];
 if(!(work.video||work.fileVideo||work.embed))return;
 const player=document.createElement(work.fileVideo?'video':'iframe');
 if(work.fileVideo){player.src=work.fileVideo;player.controls=true;player.autoplay=true;player.playsInline=true;player.muted=true;player.poster=work.image;}
 else{
  const url=new URL(work.video?`https://player.vimeo.com/video/${work.video}`:work.embed);
  url.searchParams.set('autoplay','1');
  const youtube=url.hostname==='www.youtube.com'||url.hostname==='www.youtube-nocookie.com';
  url.searchParams.set(youtube?'mute':'muted','1');
  if(url.hostname.endsWith('vimeo.com'))url.searchParams.set('dnt','1');
  player.referrerPolicy='strict-origin-when-cross-origin';
  player.src=url.href;player.title=work.title;player.allow='autoplay; fullscreen; picture-in-picture';player.allowFullscreen=true;
 }
 host.replaceChildren(player);play.hidden=true;stop.hidden=false;playing=true;
 if(work.fileVideo){const promise=player.play();if(promise)promise.catch(()=>{ /* Native controls remain available if autoplay is blocked. */ });}
}
function clearMorph() {
 turn?.morph?.outgoing.remove();
 panel.style.transform = '';
 panel.style.transformOrigin = '';
 panel.style.visibility = '';
 panel.style.pointerEvents = '';
}
function rayTip(index) {
 const angle = (distance(index) * 30 - 1.369415) * Math.PI / 180;
 const sceneRect = scene.getBoundingClientRect();
 return {
  x: sceneRect.left + geometry.cx + Math.cos(angle) * geometry.radius,
  y: sceneRect.top + geometry.cy + Math.sin(angle) * geometry.radius
 };
}
function drawMorph(progress) {
 const morph = turn.morph;
 const rect = morph.destination;
 const scroll = window.scrollY - morph.scroll;
 const outgoingTip = rayTip(morph.outgoingIndex);
 const incomingTip = rayTip(current);
 // The two frames briefly coexist as their rays pass the center.
 const outgoingScale = Math.pow(1 - progress, 1.55);
 const incomingProgress = Math.max(0, (progress - .21) / .79);
 const incomingScale = Math.pow(incomingProgress, 1.35);
 const gap = rect.width * .045;
 const outgoingX = outgoingTip.x + gap + morph.outgoingOffsetX * outgoingScale;
 const outgoingY = outgoingTip.y - rect.height * outgoingScale / 2 + morph.outgoingOffsetY * outgoingScale;
 morph.outgoing.style.left = `${outgoingX}px`;
 morph.outgoing.style.top = `${outgoingY}px`;
 morph.outgoing.style.transform = `scale(${outgoingScale})`;
 morph.outgoing.style.visibility = outgoingScale > .04 ? 'visible' : 'hidden';

 const incomingX = (incomingTip.x + gap) * (1 - incomingScale) + rect.left * incomingScale;
 const incomingY = (incomingTip.y - rect.height * incomingScale / 2) * (1 - incomingScale) + (rect.top - scroll) * incomingScale;
 panel.style.transform = `translate(${incomingX - rect.left}px, ${incomingY - rect.top + scroll}px) scale(${incomingScale})`;
 panel.style.visibility = incomingScale > .04 ? 'visible' : 'hidden';
 morph.incomingScale = incomingScale;
 morph.outgoingScale = outgoingScale;
}
function select(next) {
 if (!works.length || next === target) return;
 clearMorph();
 const rect = panel.getBoundingClientRect();
 const oldTip = rayTip(current);
 const outgoing = panel.cloneNode(true);
 outgoing.removeAttribute('aria-label');
 outgoing.setAttribute('aria-hidden', 'true');
 outgoing.inert = true;
 outgoing.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
 outgoing.querySelectorAll('button, .project-navigation').forEach(node => node.remove());
 const image = document.createElement('img');
 image.src = works[current].image;
 image.alt = '';
 outgoing.querySelector('.video-host').replaceChildren(image);
 Object.assign(outgoing.style, {
  position:'fixed', width:`${rect.width}px`, transformOrigin:'top left',
  pointerEvents:'none', zIndex:'6'
 });
 document.body.append(outgoing);

 target = next;
 const outgoingIndex = current;
 current = wrap(next, works.length);
 const work = works[current];
 title.textContent = work.title;
 poster(work);
 startVideo();
 count.textContent = `${String(current+1).padStart(2,'0')} / ${String(works.length).padStart(2,'0')}`;
 announcement.textContent = `${current+1} of ${works.length}: ${work.title}`;
 const destination = panel.getBoundingClientRect();
 turn = {
  from:position, to:target, started:performance.now(),
  morph:{
   outgoing, outgoingIndex, destination, scroll:window.scrollY,
   outgoingOffsetX:rect.left - oldTip.x - destination.width * .045,
   outgoingOffsetY:rect.top - oldTip.y + destination.height / 2
  }
 };
 panel.style.transformOrigin = 'top left';
 panel.style.pointerEvents = 'none';
 drawMorph(0);
 draw();
 if (!raf) raf = requestAnimationFrame(animate);
}
function step(delta){select(target+delta);}
document.addEventListener('keydown',event=>{
 if(event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,textarea,select,[contenteditable=true]'))return;
 if(event.key==='Escape'&&playing){poster(works[current]);play.focus();}
});
document.querySelector('#previous').addEventListener('click',()=>step(-1));
document.querySelector('#next').addEventListener('click',()=>step(1));
play.addEventListener('click',()=>startVideo());
stop.addEventListener('click',()=>{poster(works[current]);play.focus();});
window.addEventListener('resize',layout,{passive:true});
fetch('works.json').then(r=>{if(!r.ok)throw Error('Could not load projects');return r.json();}).then(data=>{
 works=data;
 labels=works.map((work,index)=>{
  const button=document.createElement('button');button.type='button';button.className='orbit-label';button.textContent=work.title;button.title=work.title;button.setAttribute('aria-label',`Open ${work.title}`);
  button.addEventListener('click',()=>{const d=distance(index);const nearest=Math.round(position-d);if(nearest===target)startVideo();else select(nearest);});
  labelHost.append(button);return button;
 });
 title.textContent=works[0].title;poster(works[0]);count.textContent=`01 / ${String(works.length).padStart(2,'0')}`;
 layout();
 startVideo();
 const upcoming=works.slice(1,4);upcoming.forEach(work=>{const img=new Image();img.src=work.image;});
}).catch(()=>{title.textContent='Explore the work on Vimeo';const link=document.createElement('a');link.href='https://vimeo.com/ruslantikh';link.textContent='open portfolio ↗';host.replaceChildren(link);play.hidden=true;});
