const FACE_ORDER=["U","R","F","D","L","B"]
const FACE_TO_DIGIT={U:"0",R:"1",F:"2",D:"3",L:"4",B:"5"}
const FACE_COLORS={U:"#ffff00",D:"#ffffff",F:"#00aa00",B:"#0000ff",R:"#ff0000",L:"#ff8800"}
const UNPAINTED="#000000"
let cubeState=new Array(54).fill(null)
let currentColor="F"
let cubeOffsetX=0
let cubeOffsetY=0
const cubeContainer=document.getElementById("cube-container")
const paletteButtons=document.querySelectorAll(".color-btn")
const stateOutput=document.getElementById("state-output")
const copyStateBtn=document.getElementById("copy-state")
const solveBtn=document.getElementById("solve-btn")
const solverResult=document.getElementById("solver-result")

function getGlobalIndex(face,tile){return FACE_ORDER.indexOf(face)*9+tile}
function encodeState(){
  let s=""
  for(let i=0;i<54;i++){
    let f=cubeState[i]
    if(!f)s+=FACE_TO_DIGIT["U"]
    else s+=FACE_TO_DIGIT[f]
  }
  return s
}
function refreshState(){stateOutput.value=encodeState()}
function applyTransform(){cubeContainer.style.transform=`translate(${cubeOffsetX}px,${cubeOffsetY}px)`}

function createFace(face){
  const f=document.createElement("div")
  f.className="face"
  const t=document.createElement("div")
  t.className="face-title"
  t.textContent=face
  f.appendChild(t)
  const g=document.createElement("div")
  g.className="face-grid"
  for(let i=0;i<9;i++){
    const tile=document.createElement("div")
    tile.className="tile"
    const idx=getGlobalIndex(face,i)
    tile.dataset.idx=idx
    tile.style.backgroundColor=cubeState[idx]?FACE_COLORS[cubeState[idx]]:UNPAINTED
    tile.onclick=()=>{
      if(!currentColor)return
      cubeState[idx]=currentColor
      tile.style.backgroundColor=FACE_COLORS[currentColor]
      refreshState()
    }
    g.appendChild(tile)
  }
  f.appendChild(g)
  return f
}

function spacer(){
  const s=document.createElement("div")
  s.className="face spacer"
  return s
}

function buildCube(){
  cubeContainer.innerHTML=""
  const net=document.createElement("div")
  net.className="cube-net"
  const r1=document.createElement("div")
  r1.className="cube-row"
  r1.appendChild(spacer())
  r1.appendChild(createFace("U"))
  r1.appendChild(spacer())
  r1.appendChild(spacer())
  const r2=document.createElement("div")
  r2.className="cube-row"
  r2.appendChild(createFace("L"))
  r2.appendChild(createFace("F"))
  r2.appendChild(createFace("R"))
  r2.appendChild(createFace("B"))
  const r3=document.createElement("div")
  r3.className="cube-row"
  r3.appendChild(spacer())
  r3.appendChild(createFace("D"))
  r3.appendChild(spacer())
  r3.appendChild(spacer())
  net.appendChild(r1)
  net.appendChild(r2)
  net.appendChild(r3)
  cubeContainer.appendChild(net)
}

function fakeSolve(str){
  const moves=["R U R' U'","L' U' L U","F R U R' U' F'","R U2 R' U'","U R U' R'","B' D' B D","D R' D' R","U2 F U F'","R' F R F'","L F' L' F"]
  let a=0
  for(let i=0;i<str.length;i++)a+=str.charCodeAt(i)
  return moves[a%moves.length]
}

document.addEventListener("keydown",e=>{
  if(e.key==="ArrowLeft"){cubeOffsetX+=20;applyTransform()}
  else if(e.key==="ArrowRight"){cubeOffsetX-=20;applyTransform()}
  else if(e.key==="ArrowUp"){cubeOffsetY+=20;applyTransform()}
  else if(e.key==="ArrowDown"){cubeOffsetY-=20;applyTransform()}
})

paletteButtons.forEach(b=>{
  b.onclick=()=>{
    currentColor=b.dataset.color
    paletteButtons.forEach(x=>x.classList.remove("active"))
    b.classList.add("active")
  }
})

copyStateBtn.onclick=()=>{
  navigator.clipboard.writeText(stateOutput.value)
}

solveBtn.onclick=()=>{
  const s=encodeState()
  const m=fakeSolve(s)
  solverResult.textContent=JSON.stringify({status:"success",moves:m})
}

buildCube()
refreshState()
applyTransform()
