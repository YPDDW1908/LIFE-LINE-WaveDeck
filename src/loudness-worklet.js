import './loudness-core.js';
class SourceLoudness extends AudioWorkletProcessor{
 constructor(){super();this.meter=new LoudnessCore.Meter(sampleRate);this.epoch=0;this.port.onmessage=e=>{if(e.data.reset!=null){this.epoch=e.data.reset;this.meter.reset();}else if(e.data==='finalize'&&this.meter.last){this.port.postMessage({...this.meter.last,integrated:LoudnessCore.integrated(this.meter.blocks),epoch:this.epoch});}};}
 process(inputs){const reading=this.meter.process(inputs[0]||[]);if(reading)this.port.postMessage({...reading,epoch:this.epoch});return true;}
}
registerProcessor('source-loudness',SourceLoudness);
