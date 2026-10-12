const assert=require('node:assert/strict'),{Meter,coefficients,integrated}=require('../src/loudness-core.js');
assert.ok(Math.abs(coefficients(48000)[0].b[0]-1.53512485958697)<1e-12);
assert.ok(Math.abs(coefficients(48000)[1].a[0]+1.99004745483398)<1e-12);
for(const rate of [44100,48000,96000])for(const channels of [1,2]){
 const meter=new Meter(rate);let reading;
 for(let i=0;i<rate*4;i+=128){const a=Float32Array.from({length:128},(_,j)=>.1*Math.sin(2*Math.PI*1000*(i+j)/rate));reading=meter.process(Array.from({length:channels},()=>a))||reading;}
 const target=-23.01+(channels===2?3.0103:0);
 for(const key of ['momentary','shortTerm','integrated'])assert.ok(Math.abs(reading[key]-target)<.1,`${rate}/${channels} ${key} ${reading[key]}`);
 meter.reset();assert.equal(meter.blocks.length,0);
}
const energy=10**((-23+.691)/10),quiet=10**((-60+.691)/10);
assert.ok(Math.abs(integrated([...Array(20).fill(energy),...Array(20).fill(quiet),...Array(20).fill(0)])+23)<1e-9);
assert.equal(integrated([0,1e-12]),-Infinity);
console.log('PASS: published 48 kHz coefficients, 1 kHz mono/stereo reference at 44.1/48/96 kHz, silence and relative gating, reset.');

