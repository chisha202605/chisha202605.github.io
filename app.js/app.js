const defaultCategories = [
  {id:1,name:"素菜"},
  {id:2,name:"荤菜"},
  {id:3,name:"汤"},
  {id:4,name:"炖肉"}
]

function initData(){
  if(!localStorage.getItem('categories')) localStorage.setItem('categories',JSON.stringify(defaultCategories))
  if(!localStorage.getItem('dishes')) localStorage.setItem('dishes','[]')
  if(!localStorage.getItem('mealHistory')) localStorage.setItem('mealHistory','[]')
  if(!localStorage.getItem('usedDishIds')) localStorage.setItem('usedDishIds','[]')
}
initData()

function showPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'))
  document.getElementById('page-'+name).classList.remove('hidden')
  renderCategory()
  renderDish()
}

function renderCategory(){
  const cats = JSON.parse(localStorage.getItem('categories'))
  const nav = document.getElementById('categoryNav')
  const select = document.getElementById('dishCategory')
  nav.innerHTML = ''
  select.innerHTML = ''
  cats.forEach(c=>{
    nav.innerHTML += `<span onclick="setCate(${c.id})">${c.name}</span>`
    select.innerHTML += `<option value="${c.id}">${c.name}</option>`
  })
}

function renderDish(){
  const keyword = document.getElementById('searchInput').value
  const dishes = JSON.parse(localStorage.getItem('dishes')).filter(d=>!d.isDelete)
  const list = document.getElementById('dishList')
  list.innerHTML = ''
  dishes.filter(d=>d.name.includes(keyword)).forEach(d=>{
    list.innerHTML += `
      <div class="dish-item">
        <div><b>${d.name}</b> ${d.diff} · ${d.time}</div>
        <div>分类：${getCateName(d.cateId)}</div>
        <button onclick="deleteDish('${d.id}')">删除</button>
      </div>`
  })
}
function getCateName(id){
  const cats = JSON.parse(localStorage.getItem('categories'))
  return cats.find(c=>c.id==id)?.name||'素菜'
}

function saveDish(){
  const name = document.getElementById('dishName').value.trim()
  const cateId = document.getElementById('dishCategory').value
  const diff = document.getElementById('dishDiff').value
  const time = document.getElementById('dishTime').value
  const people = document.getElementById('dishPeople').value
  const ing = document.getElementById('dishIng').value
  const step = document.getElementById('dishStep').value
  const video = document.getElementById('dishVideo').value
  if(!name)return alert('请输入菜名')
  const dishes = JSON.parse(localStorage.getItem('dishes'))
  dishes.push({
    id:Date.now().toString(),name,cateId,diff,time,people,ing,step,video,
    isDelete:false,deleteTime:null
  })
  localStorage.setItem('dishes',JSON.stringify(dishes))
  alert('保存成功')
  showPage('home')
}

function deleteDish(id){
  if(!confirm('确定删除？7天内可在回收站恢复'))return
  const dishes = JSON.parse(localStorage.getItem('dishes'))
  const d = dishes.find(x=>x.id===id)
  d.isDelete = true
  d.deleteTime = Date.now()
  localStorage.setItem('dishes',JSON.stringify(dishes))
  renderDish()
}

function randomMeal(){
  const dishes = JSON.parse(localStorage.getItem('dishes')).filter(d=>!d.isDelete)
  const usedIds = JSON.parse(localStorage.getItem('usedDishIds'))
  const threeDay = Date.now()-3*24*60*60*1000
  const validUsed = usedIds.filter(x=>x.time>threeDay).map(x=>x.id)
  const meat = dishes.filter(d=>d.cateId==2&&!validUsed.includes(d.id))
  const soup = dishes.filter(d=>d.cateId==3&&!validUsed.includes(d.id))
  const other = dishes.filter(d=>[1,4].includes(Number(d.cateId))&&!validUsed.includes(d.id))
  if(meat.length<1||soup.length<1||other.length<3)return alert('菜品不足或3天内重复限制')
  const m = meat[Math.floor(Math.random()*meat.length)]
  const s = soup[Math.floor(Math.random()*soup.length)]
  const o = other.sort(()=>Math.random()-0.5).slice(0,3)
  const meal = [m,...o,s]
  usedIds.push(...meal.map(x=>({id:x.id,time:Date.now()})))
  localStorage.setItem('usedDishIds',JSON.stringify(usedIds))
  renderMeal(meal)
}

function renderMeal(meal){
  let html = ''
  meal.forEach(d=>{
    html += `<div class="dish-item"><b>${d.name}</b></div>`
    const ings = d.ing.split('\n').filter(i=>i.trim())
    ings.forEach((ing,idx)=>{
      html += `
        <div class="ingredient-item" onclick="toggleIng(${idx})">
          <span>${ing}</span>
          <span id="ing${idx}" class="green">✓</span>
        </div>`
    })
  })
  document.getElementById('mealResult').innerHTML = html
}
function toggleIng(idx){
  const el = document.getElementById('ing'+idx)
  el.classList.toggle('green')
  el.classList.toggle('red')
  el.innerText = el.classList.contains('green')?'✓':'✗'
}

function showRecycle(){
  const dishes = JSON.parse(localStorage.getItem('dishes')).filter(d=>d.isDelete)
  let html = ''
  dishes.forEach(d=>{
    const day = (Date.now()-d.deleteTime)/1000/60/60/24
    html += `<div class="dish-item">${d.name} ${day>7?'已过期':'可恢复'}
      <button onclick="restoreDish('${d.id}')" ${day>7?'disabled':''}>恢复</button>
    </div>`
  })
  document.getElementById('recycleList').innerHTML = html
}
function restoreDish(id){
  const dishes = JSON.parse(localStorage.getItem('dishes'))
  const d = dishes.find(x=>x.id===id)
  d.isDelete = false
  d.deleteTime = null
  localStorage.setItem('dishes',JSON.stringify(dishes))
  showRecycle()
}

function exportData(){
  const data = JSON.stringify({
    categories:JSON.parse(localStorage.getItem('categories')),
    dishes:JSON.parse(localStorage.getItem('dishes')),
    mealHistory:JSON.parse(localStorage.getItem('mealHistory'))
  })
  const blob = new Blob([data],{type:'application/json'})
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = '家庭菜谱备份.json'
  a.click()
}

function importData(){
  const input = document.createElement('input')
  input.type='file'
  input.onchange=e=>{
    const fr = new FileReader()
    fr.onload=ev=>{
      const data = JSON.parse(ev.target.result)
      localStorage.setItem('categories',JSON.stringify(data.categories))
      localStorage.setItem('dishes',JSON.stringify(data.dishes))
      alert('导入成功')
      showPage('home')
    }
    fr.readAsText(e.target.files[0])
  }
  input.click()
}

showPage('home')
