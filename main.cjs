const {app,BrowserWindow,Menu,session,protocol,net,screen,nativeTheme}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
protocol.registerSchemesAsPrivileged([{scheme:'wavedeck',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
app.setName('LIFE LINE WaveDeck');
nativeTheme.themeSource='system';
app.whenReady().then(()=>{
  protocol.handle('wavedeck',request=>{
    const url=new URL(request.url);
    const files={'/index.html':'index.html','/app.js':'app.js','/audio-core.js':'audio-core.js','/style.css':'style.css','/drop-import.js':'drop-import.js','/loudness-core.js':'loudness-core.js','/loudness-worklet.js':'loudness-worklet.js'};
    if(url.host!=='app'||!files[url.pathname])return new Response('Not found',{status:404});
    return net.fetch(pathToFileURL(path.join(__dirname,'src',files[url.pathname])).toString());
  });
  Menu.setApplicationMenu(null);
  const workarea=screen.getPrimaryDisplay().workAreaSize;
  const win=new BrowserWindow({width:Math.min(1328,workarea.width),height:Math.min(533,workarea.height),minWidth:800,minHeight:482,title:'LIFE LINE WaveDeck',backgroundColor:nativeTheme.shouldUseDarkColors?'#1b1d22':'#f4f5f7',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
  const updateBackground=()=>{if(!win.isDestroyed())win.setBackgroundColor(nativeTheme.shouldUseDarkColors?'#1b1d22':'#f4f5f7');};
  nativeTheme.on('updated',updateBackground);
  win.on('closed',()=>nativeTheme.removeListener('updated',updateBackground));
  session.defaultSession.setPermissionCheckHandler(()=>false);
  session.defaultSession.setPermissionRequestHandler((wc,p,done)=>done(false));
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',(e,url)=>{if(url!=='wavedeck://app/index.html')e.preventDefault();});
  win.loadURL('wavedeck://app/index.html');
});
app.on('window-all-closed',()=>app.quit());
