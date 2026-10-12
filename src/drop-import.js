/* Accept native file drops before nested controls/default browser actions. */
(function(root){
  function getDroppedFile(transfer){
    if(!transfer)return null;
    const files=Array.from(transfer.files||[]);
    if(!files.length){
      for(const item of Array.from(transfer.items||[])){
        if(item.kind!=='file')continue;
        const entry=typeof item.webkitGetAsEntry==='function'?item.webkitGetAsEntry():null;
        if(entry&&entry.isDirectory)continue;
        const file=item.getAsFile();
        if(file)files.push(file);
      }
    }
    // Some shell providers give directory-like objects. They cannot be decoded.
    const actual=files.filter(file=>file&&typeof file.arrayBuffer==='function'&&file.size>0);
    return actual.find(file=>/^audio\//i.test(file.type||'')||/\.(mp3|wav|flac|m4a|aac|ogg|opus|aiff?|ape|wma|dsf|dff)$/i.test(file.name||''))||actual[0]||null;
  }
  function install(doc,win,handlers){
    let depth=0;
    const clear=()=>{depth=0;doc.body.classList.remove('dragging');};
    const isFileDrag=e=>{
      const transfer=e.dataTransfer;
      if(!transfer)return false;
      const types=Array.from(transfer.types||[]);
      return types.includes('Files')||Array.from(transfer.items||[]).some(item=>item.kind==='file')||(!types.length);
    };
    const accept=e=>{
      e.preventDefault();
      e.stopPropagation();
      if(e.dataTransfer)e.dataTransfer.dropEffect=handlers.canImport()?'copy':'none';
    };
    doc.addEventListener('dragenter',e=>{
      if(!isFileDrag(e))return;
      accept(e);depth++;
      if(handlers.canImport())doc.body.classList.add('dragging');
    },true);
    doc.addEventListener('dragover',e=>{
      if(!isFileDrag(e))return;
      accept(e);
      if(handlers.canImport())doc.body.classList.add('dragging');
    },true);
    doc.addEventListener('dragleave',e=>{
      e.preventDefault();
      if(e.relatedTarget&&doc.documentElement.contains(e.relatedTarget))return;
      depth=Math.max(0,depth-1);
      if(depth===0||e.clientX<=0||e.clientY<=0||e.clientX>=win.innerWidth||e.clientY>=win.innerHeight)clear();
    },true);
    doc.addEventListener('drop',e=>{
      accept(e);clear();
      if(!handlers.canImport()){handlers.onError('正在导入，请完成后再拖入音频。');return;}
      // Obtain the File inside the drop event, while its data store is readable.
      let file;
      try{file=getDroppedFile(e.dataTransfer);}catch(error){handlers.onError('未能读取拖入的文件，请从资源管理器拖入本地音频文件。');return;}
      if(!file){handlers.onError('没有收到可读取的音频文件，请拖入文件本身，而不是文件夹或链接。');return;}
      Promise.resolve(handlers.onFile(file)).catch(()=>handlers.onError('拖放导入失败，请重试或使用导入按钮。'));
    },true);
    doc.addEventListener('dragend',clear,true);
    win.addEventListener('blur',clear);
  }
  const api={install,getDroppedFile};
  if(typeof module!=='undefined')module.exports=api;else root.DropImport=api;
})(globalThis);
