const defaultCategories = [
  {id:1,name:"素菜"},
  {id:2,name:"荤菜"},
  {id:3,name:"汤"},
  {id:4,name:"炖肉"}
]

let currentViewDishId = null;
let currentFilterCategory = null;

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
  if(name === 'home'){
    currentFilterCategory = null;
    renderCategory();
    renderDish();
  }
  if(name === 'categoryManage'){
    renderCategoryManage();
  }
}

function renderCategory(){
  const cats = JSON.parse(localStorage.getItem('categories'))
  const nav = document.getElementById('categoryNav')
  const select = document.getElementById('dishCategory')
  nav.innerHTML = ''
  select.innerHTML = ''
  cats.forEach(c=>{
    nav.innerHTML += `<span onclick="filterByCategory(${c.id})">${c.name}</span>`
    select.innerHTML += `<option value="${c.id}">${c.name}</option>`
  })
}

function filterByCategory(catId){
  currentFilterCategory = catId;
  renderDish();
}

function renderDish(){
  const keyword = document.getElementById('searchInput').value
  const dishes = JSON.parse(localStorage.getItem('dishes')).filter(d=>!d.isDelete)
  const cats = JSON.parse(localStorage.getItem('categories'))
  const list = document.getElementById('dishList')
  list.innerHTML = ''
  dishes.filter(d=>{
    const matchKeyword = d.name.includes(keyword)
    const matchCategory = currentFilterCategory === null || d.cateId == currentFilterCategory
    return matchKeyword && matchCategory
  }).forEach(d=>{
    const catName = cats.find(c=>c.id==d.cateId)?.name||'未知分类'
    list.innerHTML += `
      <div class="dish-item">
        <div>
          <b style="cursor:pointer;color:#07c160;" onclick="viewDishDetail('${d.id}')">${d.name}</b>
          <span>分类：${catName}</span>
        </div>
        <div>
          <button onclick="editDish('${d.id}')">编辑</button>
          <button onclick="deleteDish('${d.id}')">删除</button>
        </div>
      </div>`
  })
}

// ========== 分类管理 新增/删除 ==========
function renderCategoryManage(){
  const cats = JSON.parse(localStorage.getItem('categories'))
  let html = ''
  cats.forEach(c=>{
    html += `
      <div class="dish-item" style="display:flex;justify-content:space-between;align-items:center;">
        <span>${c.name}</span>
        <button onclick="delCategory(${c.id})">删除该分类</button>
      </div>
    `
  })
  document.getElementById('cateManageList').innerHTML = html
}

function addCategory(){
  const name = document.getElementById('newCateName').value.trim()
  if(!name) return alert('请输入分类名称')
  const cats = JSON.parse(localStorage.getItem('categories'))
  const newId = Date.now()
  cats.push({id:newId, name:name})
  localStorage.setItem('categories', JSON.stringify(cats))
  document.getElementById('newCateName').value = ''
  renderCategoryManage()
  alert('新增分类成功')
}

function delCategory(catId){
  if(!confirm('确定删除该分类？分类下菜品会保留，但不再归属此分类')) return
  let cats = JSON.parse(localStorage.getItem('categories'))
  let dishes = JSON.parse(localStorage.getItem('dishes'))
  // 移除分类
  cats = cats.filter(c => c.id !== catId)
  // 把原该分类菜品清空分类ID
  dishes.forEach(d => {
    if(d.cateId == catId) d.cateId = ''
  })
  localStorage.setItem('categories', JSON.stringify(cats))
  localStorage.setItem('dishes', JSON.stringify(dishes))
  renderCategoryManage()
  alert('分类已删除')
}
// =======================================

function viewDishDetail(id){
  const dishes = JSON.parse(localStorage.getItem('dishes'))
  const d = dishes.find(x=>x.id===id)
  if(!d) return
  currentViewDishId = id
  const cats = JSON.parse(localStorage.getItem('categories'))
  const catName = cats.find(c=>c.id==d.cateId)?.name||'未知分类'

  document.getElementById('detailName').innerText = d.name
  document.getElementById('detailCategory').innerText = `分类：${catName}`
  document.getElementById('detailIngredients').innerHTML = `
    <h4>食材：</h4>
    <ul>${d.ing.split('\n').filter(i=>i.trim()).map(i=>`<li>${i}</li>`).join('')}</ul>
  `
  document.getElementById('detailSteps').innerHTML = `
    <h4>做法：</h4>
    <p>${d.step||'暂无做法'}</p>
  `
  document.getElementById('detailVideos').innerHTML = `
    <h4>视频链接：</h4>
    <div>${d.video.split('\n').filter(i=>i.trim()).map(i=>`<a href="${i}" target="_blank">${i}</a><br>`).join('')}</div>
  `
  showPage('detail')
}

function editDish(id){
  const dishes = JSON.parse(localStorage.getItem('dishes'))
  const d = dishes.find(x=>x.id===id)
  if(!d) return
  document.getElementById('addEditTitle').innerText = '编辑菜品'
  document.getElementById('dishName').value = d.name
  document.getElementById('dishCategory').value = d.cateId
  document.getElementById('dishIng').value = d.ing||''
  document.getElementById('dishStep').value = d.step||''
  document.getElementById('dishVideo').value = d.video||''
  document.getElementById('editDishId').value = id
  showPage('addDish')
}

function editCurrentDish(){
  if(currentViewDishId) editDish(currentViewDishId)
}

function saveDish(){
  const name = document.getElementById('dishName').value.trim()
  const cateId = document.getElementById('dishCategory').value
  const ing = document.getElementById('dishIng').value
  const step = document.getElementById('dishStep').value
  const video = document.getElementById('dishVideo').value
  const editId = document.getElementById('editDishId').value

  if(!name)return alert('请输入菜名')

  const dishes = JSON.parse(localStorage.getItem('dishes'))
  if(editId){
    const idx = dishes.findIndex(d=>d.id===editId)
    dishes[idx] = {...dishes[idx], name, cateId, ing, step, video}
  }else{
    dishes.push({
      id:Date.now().toString(),name,cateId,ing,step,video,
      isDelete:false,deleteTime:null
    })
  }
  localStorage.setItem('dishes',JSON.stringify(dishes))
  alert('保存成功')
  document.getElementById('editDishId').value = ''
  document.getElementById('addEditTitle').innerText = '新增菜品'
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
  renderMealWithEdit(meal)
}

function renderMealWithEdit(meal){
  let html = '<div style="padding:10px;"><h3>今日配餐（可点击更换菜品）</h3>'
  meal.forEach((d,idx)=>{
    html += `
      <div class="dish-item" style="display:flex;justify-content:space-between;align-items:center;">
        <div><b>${d.name}</b></div>
        <button onclick="changeMealDish(${idx})" style="font-size:12px;padding:4px 8px;">更换菜品</button>
      </div>
      <div class="ingredient-list">
        ${d.ing.split('\n').filter(i=>i.trim()).map((ing,i)=>`
          <div class="ingredient-item" onclick="toggleIngredient(${idx}_${i})">
            <span>${ing}</span>
            <span id="ing_${idx}_${i}" class="green">✓</span>
          </div>
        `).join('')}
      </div>
    `
  })
  html += '</div>'
  document.getElementById('mealResult').innerHTML = html
  window.currentMeal = meal
}

function changeMealDish(index){
  const dishes = JSON.parse(localStorage.getItem('dishes')).filter(d=>!d.isDelete)
  const dishNames = dishes.map((d,i)=>`${i+1}. ${d.name}`).join('\n')
  const selectedIdx = prompt(`请输入要更换的菜品序号：\n${dishNames}`)
  if(!selectedIdx)return
  const newDish = dishes[parseInt(selectedIdx)-1]
  if(!newDish)return alert('无效序号')
  window.currentMeal[index] = newDish
  renderMealWithEdit(window.currentMeal)
}

function toggleIngredient(id){
  const el = document.getElementById('ing_'+id)
  el.classList.toggle('green')
  el.classList.toggle('red')
  el.innerText = el.classList.contains('green')?'✓':'✗'
}

function manualMeal() {
  const dishes = JSON.parse(localStorage.getItem('dishes')).filter(d => !d.isDelete)
  let html = `
    <div style="padding:10px;">
      <h3>自由选菜（无数量和荤菜限制）</h3>
      <div id="manual-dish-list">
  `
  dishes.forEach(d => {
    html += `
      <div style="padding:10px;border-bottom:1px solid #eee;">
        <label>
          <input type="checkbox" value="${d.id}">
          ${d.name}
        </label>
      </div>
    `
  })
  html += `
      </div>
      <button onclick="confirmManualMeal()" style="margin-top:20px;">确认配餐</button>
    </div>
  `
  document.getElementById('mealResult').innerHTML = html
}

function confirmManualMeal() {
  const checkboxes = document.querySelectorAll('#manual-dish-list input:checked')
  const selectedIds = Array.from(checkboxes).map(cb => cb.value)
  const selectedDishes = JSON.parse(localStorage.getItem('dishes')).filter(d => selectedIds.includes(d.id))
  renderMealWithEdit(selectedDishes)
}

function showRecycle(){
  const dishes = JSON.parse(localStorage.getItem('dishes')).filter(d=>d.isDelete)
  let html = ''
  dishes.forEach(d=>{
    const day = (Date.now()-d.deleteTime)/1000/60/60/24
    html += `<div class="dish-item">
      <span>${d.name}（删除${Math.floor(day)}天）</span>
      <button onclick="restoreDish('${d.id}')" ${day>7?'disabled':''}>还原</button>
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
