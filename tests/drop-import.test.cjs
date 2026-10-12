const assert=require('node:assert/strict');
const {install,getDroppedFile}=require('../src/drop-import.js');
const audio={name:'测试音频.wav',size:200,type:'',arrayBuffer:async()=>new ArrayBuffer(200)};
const item={kind:'file',getAsFile:()=>audio,webkitGetAsEntry:()=>({isDirectory:false})};
assert.equal(getDroppedFile({files:[audio]}),audio);
assert.equal(getDroppedFile({files:[],items:[item]}),audio);
assert.equal(getDroppedFile({files:[],items:[{...item,webkitGetAsEntry:()=>({isDirectory:true})}]}),null);
assert.equal(getDroppedFile({files:[{name:'empty.wav',size:0,arrayBuffer:audio.arrayBuffer}]}),null);
assert.equal(getDroppedFile({files:[{...audio,name:'cover.jpg'},audio]}),audio);
const events={},winEvents={},classes=new Set(),imports=[],errors=[];let ready=true;
const doc={body:{classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)}},documentElement:{contains:()=>false},addEventListener:(name,callback,capture)=>{assert.equal(capture,true);events[name]=callback;}};
const win={innerWidth:1180,innerHeight:760,addEventListener:(name,cb)=>winEvents[name]=cb};
install(doc,win,{canImport:()=>ready,onFile:file=>imports.push(file),onError:m=>errors.push(m)});
function fire(name,transfer={types:['Files'],files:[]},options={}){
 const e={dataTransfer:transfer,clientX:100,clientY:100,relatedTarget:null,preventDefault(){this.prevented=true},stopPropagation(){this.stopped=true},...options};events[name](e);return e;
}
let e=fire('dragenter');assert.equal(e.prevented,true);assert.equal(e.stopped,true);assert.equal(e.dataTransfer.dropEffect,'copy');assert.ok(classes.has('dragging'));
e=fire('dragover');assert.equal(e.prevented,true);
fire('drop',{types:['Files'],files:[audio]});assert.deepEqual(imports,[audio]);assert.equal(classes.has('dragging'),false);
fire('drop',{types:['Files'],files:[],items:[item]});assert.equal(imports.length,2);
fire('drop',{types:['text/uri-list'],files:[]});assert.equal(imports.length,2);assert.ok(errors.at(-1).includes('没有收到'));
ready=false;e=fire('dragover');assert.equal(e.dataTransfer.dropEffect,'none');fire('drop',{types:['Files'],files:[audio]});assert.equal(imports.length,2);assert.ok(errors.at(-1).includes('正在导入'));
ready=true;fire('dragenter');fire('dragleave',undefined,{clientX:0});assert.equal(classes.has('dragging'),false);
fire('dragenter');winEvents.blur();assert.equal(classes.has('dragging'),false);
e=fire('dragenter',{types:['text/plain'],files:[]});assert.equal(e.prevented,undefined);assert.equal(classes.has('dragging'),false);
fire('drop',{files:[],items:[{kind:'file',getAsFile(){throw Error('provider failure')}}]});assert.ok(errors.at(-1).includes('未能读取'));
console.log('PASS: capture-stage acceptance, native FileList and items fallback, nested state cleanup, directories/empty/link errors, busy rejection, provider errors.');
