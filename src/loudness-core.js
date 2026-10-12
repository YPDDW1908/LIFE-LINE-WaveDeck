/* BS.1770 K weighting and dual-gated integration; mono/stereo source channels. */
(function(root){
function coefficients(rate){
 const k=Math.tan(Math.PI*1681.974450955533/rate),q=.7071752369554196,vh=10**(3.999843853973347/20),vb=vh**.4996667741545416,a=1+k/q+k*k;
 const shelf={b:[(vh+vb*k/q+k*k)/a,2*(k*k-vh)/a,(vh-vb*k/q+k*k)/a],a:[2*(k*k-1)/a,(1-k/q+k*k)/a]};
 const h=Math.tan(Math.PI*38.13547087602444/rate),hq=.5003270373238773,ha=1+h/hq+h*h;
 return [shelf,{b:[1,-2,1],a:[2*(h*h-1)/ha,(1-h/hq+h*h)/ha]}];
}
function filter(c){let x1=0,x2=0,y1=0,y2=0;return x=>{const y=c.b[0]*x+c.b[1]*x1+c.b[2]*x2-c.a[0]*y1-c.a[1]*y2;x2=x1;x1=x;y2=y1;y1=y;return y;};}
const lufs=e=>e>0?-.691+10*Math.log10(e):-Infinity;
function integrated(blocks){const absolute=blocks.filter(e=>lufs(e)>-70);if(!absolute.length)return -Infinity;const mean=absolute.reduce((a,b)=>a+b,0)/absolute.length;const gate=Math.max(-70,lufs(mean)-10);let sum=0,n=0;for(const e of absolute)if(lufs(e)>gate){sum+=e;n++;}return n?lufs(sum/n):-Infinity;}
class Meter{
 constructor(rate){this.rate=rate;this.reset();}
 reset(){this.filters=[];this.ring=new Float64Array(Math.round(this.rate*3));this.m=Math.round(this.rate*.4);this.s=this.ring.length;this.hop=Math.round(this.rate*.1);this.count=0;this.sumM=0;this.sumS=0;this.blocks=[];this.i=-Infinity;this.ticks=0;this.last=null;}
 process(channels){if(!channels.length)return null;if(channels.length>2)return {unsupported:true};if(this.filters.length!==channels.length){this.reset();this.filters=channels.map(()=>coefficients(this.rate).map(filter));}
 let reading=null;
 for(let n=0;n<channels[0].length;n++){
  let energy=0;for(let c=0;c<channels.length;c++){const f=this.filters[c],y=f[1](f[0](channels[c][n]));energy+=y*y;}
  const index=this.count%this.s,oldS=this.count>=this.s?this.ring[index]:0,oldM=this.count>=this.m?this.ring[(this.count-this.m)%this.s]:0;
  this.sumS+=energy-oldS;this.sumM+=energy-oldM;this.ring[index]=energy;this.count++;
  if(this.count%this.hop===0){if(this.count>=this.m)this.blocks.push(Math.max(0,this.sumM/this.m));this.ticks++;
   if(this.ticks%10===0||this.count===this.m)this.i=integrated(this.blocks);
   reading={momentary:this.count>=this.m?lufs(Math.max(0,this.sumM/this.m)):null,shortTerm:this.count>=this.s?lufs(Math.max(0,this.sumS/this.s)):null,integrated:this.i};
  }
 }
 if(reading)this.last=reading;return reading;
 }
}
const api={coefficients,lufs,integrated,Meter};if(typeof module!=='undefined')module.exports=api;else root.LoudnessCore=api;
})(globalThis);
