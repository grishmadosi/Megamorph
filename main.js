// LOGIN STATE
let loggedIn=false;
document.getElementById("loginBtn").addEventListener("click",()=>{
    loggedIn=true; document.getElementById("exportBtn").disabled=false; alert("Logged in!");
});
document.getElementById("signupBtn").addEventListener("click",()=>{
    loggedIn=true; document.getElementById("exportBtn").disabled=false; alert("Signed up!");
});

// KONVA SETUP
const stage=new Konva.Stage({container:'container',width:window.innerWidth,height:window.innerHeight-80,draggable:true});
const layer=new Konva.Layer(); stage.add(layer);

const transformer=new Konva.Transformer({rotateEnabled:true,borderStroke:'#00eaff',borderDash:[6,4]});
layer.add(transformer);

let selected=null, mode='select', points=[], connectorStart=null;

// TOOLBAR
document.getElementById("connectBtn").addEventListener("click",()=>{
    mode='connect'; 
    connectorStart=null;
    alert("Click on a shape to start, then click another shape to connect");
});
document.getElementById("deleteBtn").addEventListener("click",()=>{
    if(selected){
        selected.destroy();
        transformer.nodes([]);
        selected=null;
        layer.draw();
    }
});
document.getElementById("exportBtn").addEventListener("click",()=>{
    if(loggedIn){
        const dataURL=stage.toDataURL({pixelRatio:2});
        const a=document.createElement('a'); a.href=dataURL; a.download='megamorph.png'; a.click();
    } else { alert("Login to export!"); }
});

// SHAPE CREATION
function createShape(type,x=stage.width()/2,y=stage.height()/2){
    let shape;
    const common={x,y,draggable:true,shadowColor:'#00ffff',shadowBlur:20,shadowOpacity:0.4,shadowOffset:{x:0,y:0},shadowForStrokeEnabled:false};
    if(type==='rect') shape=new Konva.Rect({...common,width:120,height:70,cornerRadius:10,fill:'#10e7ff22',stroke:'#10e7ff',strokeWidth:3,shadowBlur:15});
    if(type==='circle') shape=new Konva.Circle({...common,radius:50,fill:'#ff00f522',stroke:'#ff00f5',strokeWidth:3,shadowBlur:15});
    if(type==='diamond') shape=new Konva.Line({...common,points:[0,-50,60,0,0,50,-60,0],closed:true,fill:'#00ff8a22',stroke:'#00ff8a',strokeWidth:3,shadowBlur:15});
    addListeners(shape); layer.add(shape); layer.draw();
}

// CONNECTORS
function createConnector(start,end){
    const group=new Konva.Group({draggable:true,name:'connector'});
    const line=new Konva.Line({points:[0,0,end.x-start.x,end.y-start.y],stroke:'#fff',strokeWidth:2,name:'connectorLine'});
    const startDot=new Konva.Circle({x:0,y:0,radius:5,fill:'#fff',name:'connectorDot'}), endDot=new Konva.Circle({x:end.x-start.x,y:end.y-start.y,radius:5,fill:'#fff',name:'connectorDot'});
    group.x(start.x); group.y(start.y);
    group.add(line,startDot,endDot);
    addListeners(group);
    layer.add(group);
    layer.draw();
}

// STICKY NOTE
document.getElementById("stickyBtn").addEventListener("click",()=>{
    const note=new Konva.Group({x:100,y:100,draggable:true});
    const rect=new Konva.Rect({width:200,height:150,fill:'#ffff88',cornerRadius:10,shadowBlur:10});
    const text=new Konva.Text({text:'Write here...',width:180,wrap:'word',x:10,y:10,fontSize:16});
    note.add(rect,text); layer.add(note); layer.draw();

    // RESIZE HANDLE
    const tr=new Konva.Transformer({nodes:[rect],enabledAnchors:['bottom-right'],rotateEnabled:false});
    note.add(tr);

    // EDIT TEXT
    note.on('dblclick',()=>{
        const textarea=document.createElement('textarea');
        textarea.value=text.text(); document.body.appendChild(textarea);
        textarea.style.position='absolute';
        const pos=note.getClientRect();
        textarea.style.left=pos.x+'px'; textarea.style.top=pos.y+'px';
        textarea.style.width=rect.width()+'px'; textarea.style.height=rect.height()+'px';
        textarea.focus();
        textarea.addEventListener('blur',()=>{
            text.text(textarea.value); textarea.remove(); layer.draw();
        });
    });

    note.on('click',()=>{selected=note; transformer.nodes([note]);});
});

// RANGER STICKER
function createRangerSticker(rangerType,x=stage.width()/2,y=stage.height()/2){
    const rangerImageUrl='whiteRanger.png';
    
    const img=new Image();
    img.onload=()=>{
        const sticker=new Konva.Group({x,y,draggable:true,name:'ranger'});
        const imgNode=new Konva.Image({image:img,width:120,height:120,x:0,y:0});
        sticker.add(imgNode);
        addListeners(sticker);
        layer.add(sticker);
        layer.draw();
    };
    img.onerror=()=>{
        alert('Failed to load ranger image');
    };
    img.src=rangerImageUrl;
}

// LISTENERS
function addListeners(shape){
    shape.on('click', e=>{ 
        e.cancelBubble=true; 
        if(mode==='connect' && shape.attrs.name!=='connector'){
            if(!connectorStart){
                connectorStart=shape;
                shape.stroke('#ffff00');
                layer.draw();
            } else if(connectorStart!==shape){
                const start={x:connectorStart.x(),y:connectorStart.y()};
                const end={x:shape.x(),y:shape.y()};
                createConnector(start,end);
                const originalStroke=connectorStart.attrs.originalStroke||'#10e7ff';
                connectorStart.stroke(originalStroke);
                connectorStart=null;
                mode='select';
                layer.draw();
            }
        } else {
            selected=shape; 
            transformer.nodes([shape]);
            if(shape.attrs.name==='connector'){
                shape.children.forEach(child=>{
                    if(child.attrs.name==='connectorLine') child.stroke('#00ffff');
                });
            }
        }
    });
    
    shape.on('mouseover', e=>{
        if(shape.attrs.name==='connector'){
            shape.children.forEach(child=>{
                if(child.attrs.name==='connectorLine') child.stroke('#00ffff');
            });
            layer.draw();
        }
    });
    
    shape.on('mouseout', e=>{
        if(shape.attrs.name==='connector' && selected!==shape){
            shape.children.forEach(child=>{
                if(child.attrs.name==='connectorLine') child.stroke('#fff');
            });
            layer.draw();
        }
    });
}

// CREATE SHAPES ON CLICK
stage.on('click', e=>{
    if(mode==='rect'||mode==='circle'||mode==='diamond'){
        const p=stage.getPointerPosition(); createShape(mode,p.x,p.y); mode='select';
    }
});

// ZOOM + PAN
stage.on('wheel', e=>{
    e.evt.preventDefault();
    const scaleBy=1.1, oldScale=stage.scaleX(), pointer=stage.getPointerPosition();
    const mp={x:(pointer.x-stage.x())/oldScale,y:(pointer.y-stage.y())/oldScale};
    const newScale=e.evt.deltaY>0?oldScale/scaleBy:oldScale*scaleBy;
    stage.scale({x:newScale,y:newScale});
    stage.position({x:pointer.x-mp.x*newScale,y:pointer.y-mp.y*newScale}); stage.batchDraw();
});

// DROPDOWNS
const menuDot=document.getElementById("menuDot"); const dropdown=document.getElementById("dropdown");
menuDot.addEventListener("click",()=>{ dropdown.style.display=dropdown.style.display==='flex'?'none':'flex'; });
document.addEventListener("click",(e)=>{ if(!menuDot.contains(e.target)&&!dropdown.contains(e.target)) dropdown.style.display='none'; });

const shapesBtn=document.getElementById("shapesBtn"); const shapesDropdown=document.getElementById("shapesDropdown");
shapesBtn.addEventListener("click",()=>{ shapesDropdown.style.display=shapesDropdown.style.display==='flex'?'none':'flex'; });
document.addEventListener("click",(e)=>{ if(!shapesBtn.contains(e.target)&&!shapesDropdown.contains(e.target)) shapesDropdown.style.display='none'; });
document.querySelectorAll('.shapes-dropdown button').forEach(btn=>{ btn.addEventListener('click',()=>{mode=btn.dataset.shape; shapesDropdown.style.display='none'; }); });

const rangersBtn=document.getElementById("rangersBtn"); const rangersDropdown=document.getElementById("rangersDropdown");
rangersBtn.addEventListener("click",()=>{ rangersDropdown.style.display=rangersDropdown.style.display==='flex'?'none':'flex'; });
document.addEventListener("click",(e)=>{ if(!rangersBtn.contains(e.target)&&!rangersDropdown.contains(e.target)) rangersDropdown.style.display='none'; });
document.querySelectorAll('#rangersDropdown button').forEach(btn=>{ btn.addEventListener('click',()=>{createRangerSticker(btn.dataset.ranger); rangersDropdown.style.display='none'; }); });
