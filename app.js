const defaultCategories = [
  {id:1,name:"素菜"},
  {id:2,name:"荤菜"},
  {id:3,name:"汤"},
  {id:4,name:"炖肉"}
]

let currentViewDishId = null;
let currentFilterCategory = null;
let currentMealData = [];
let currentChangeMealIndex = null;
let globalEditId = "";

function initData(){
  if(!localStorage.getItem('categories')) localStorage.setItem('categories',JSON.stringify(defaultCategories))
  if(!localStorage.getItem('dishes')) localStorage.setItem('dishes','[]')
  if(!localStorage.getItem('mealHistory')) localStorage.setItem('mealHistory','[]')
  if(!localStorage.getItem('usedDishIds')) localStorage.setItem('usedDishIds','[]')
  
  let dishArr = JSON.parse(localStorage.getItem('dishes'));
  dishArr.forEach(item => {
    if(item.permanentDelete === undefined) item.permanentDelete = false;
  })
  localStorage.setItem('dishes', JSON.stringify(dishArr));
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
  if(name === 'meal'){
    showMealHistory();
  }
  if(name === 'addDish' && globalEditId === ""){
    resetAddDishForm();
  }
}

function renderCategory(){
  const cats = JSON.parse(localStorage.getItem('categories'))
  const nav = document.getElementById('categoryNav')
  const select = document.getElementById('dishCategory')
  nav.innerHTML = '<span onclick="filterByCategory(null)">全部</span>';
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

function renderCategoryManage(){
  const cats = JSON.parse(localStorage.getItem('categories'))
  let html = ''
  cats.forEach(c=>{
    html += `
      <div class="dish-item">
        <span>${c.name}</span>
        <button onclick="delCategory(${c.id})" class="btn-danger btn-small">删除</button>
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
  cats = cats.filter(c => c.id !== catId)
  dishes.forEach(d => {
    if(d.cateId == catId) d.cateId = ''
  })
  localStorage.setItem('categories', JSON.stringify(cats))
  localStorage.setItem('dishes', JSON.stringify(dishes))
  renderCategoryManage()
  alert('分类已删除')
}

function renderDish(){
  const keyword = document.getElementById('searchKeyword').value.trim().toLowerCase()
  const dishes = JSON.parse(localStorage.getItem('dishes')).filter(d=>!d.isDelete && (d.permanentDelete === undefined || !d.permanentDelete))
  const cats = JSON.parse(localStorage.getItem('categories'))
  const list = document.getElementById('dishList')
  list.innerHTML = ''

  const filterList = dishes.filter(d=>{
    const matchKeyword = !keyword || 
      d.name.toLowerCase().includes(keyword) || 
      (d.ingredients && d.ingredients.some(ing => ing.name.toLowerCase().includes(keyword)));
    const matchCategory = currentFilterCategory === null || d.cateId == currentFilterCategory;
    return matchKeyword && matchCategory;
  });

  filterList.forEach((d, idx)=>{
    const catName = cats.find(c=>c.id==d.cateId)?.name||'未知分类'
    list.innerHTML += `
      <div class="dish-item">
        <div>
          <span>${idx+1}. </span>
          <b style="cursor:pointer;color:#07c160;" onclick="viewDishDetail('${d.id}')">${d.name}</b>
          <span>【${catName}】</span>
        </div>
        <div>
          <button onclick="editDish('${d.id}')" class="btn-small">编辑</button>
          <button onclick="deleteDish('${d.id}')" class="btn-danger btn-small">删除</button>
        </div>
      </div>`
  })
}

function viewDishDetail(id){
  const dishes = JSON.parse(localStorage.getItem('dishes'))
  const d = dishes.find(x=>x.id===id)
  if(!d) return
  currentViewDishId = id
  const cats = JSON.parse(localStorage.getItem('categories'))
  const catName = cats.find(c=>c.id==d.cateId)?.name||'未知分类'

  document.getElementById('detailName').innerText = d.name
  document.getElementById('detailCategory').innerText = `分类：${catName}`
  
  let ingHtml = '<h4>食材：</h4><ul>';
  if(d.ingredients && d.ingredients.length > 0){
    d.ingredients.forEach(ing => {
      ingHtml += `<li>${ing.name}：${ing.amount}</li>`;
    });
  } else {
    ingHtml += '<li>暂无食材信息</li>';
  }
  ingHtml += '</ul>';
  document.getElementById('detailIngredients').innerHTML = ingHtml;

  let stepHtml = '<h4>做法：</h4><ol>';
  if(d.steps && d.steps.length > 0){
    d.steps.forEach(step => {
      stepHtml += `<li>${step}</li>`;
    });
  } else {
    stepHtml += '<li>暂无做法信息</li>';
  }
  stepHtml += '</ol>';
  document.getElementById('detailSteps').innerHTML = stepHtml;

  let videoHtml = '<h4>视频链接：</h4><div>';
  if(d.videos && d.videos.length > 0){
    d.videos.forEach(url => {
      videoHtml += `<a href="${url}" target="_blank">${url}</a><br>`;
    });
  } else {
    videoHtml += '暂无视频链接';
  }
  videoHtml += '</div>';
  document.getElementById('detailVideos').innerHTML = videoHtml;

  showPage('detail')
}

function editDish(id){
  const dishes = JSON.parse(localStorage.getItem('dishes'))
  const d = dishes.find(x=>x.id===id)
  if(!d) return;

  globalEditId = id;
  document.getElementById('editDishId').value = id;

  document.getElementById('addEditTitle').innerText = '编辑菜品'
  document.getElementById('dishName').value = d.name
  document.getElementById('dishCategory').value = d.cateId || ''
  
  const ingList = document.getElementById('ingredientList');
  ingList.innerHTML = '';
  if(d.ingredients && d.ingredients.length > 0){
    d.ingredients.forEach(ing => {
      const row = document.createElement('div');
      row.className = 'ingredient-row';
      row.innerHTML = `
        <input type="text" placeholder="食材名称" class="ing-name" value="${ing.name}">
        <input type="text" placeholder="用量" class="ing-amount" value="${ing.amount}">
        <button type="button" class="btn-danger btn-small" onclick="removeIngredient(this)">删除</button>
      `;
      ingList.appendChild(row);
    });
  } else {
    addIngredientRow();
  }

  document.getElementById('dishStep').value = d.steps ? d.steps.join('\n') : '';

  const videoList = document.getElementById('videoList');
  videoList.innerHTML = '';
  if(d.videos && d.videos.length > 0){
    d.videos.forEach(url => {
      const row = document.createElement('div');
      row.className = 'video-row';
      row.innerHTML = `
        <input type="text" placeholder="视频链接" class="video-url" value="${url}">
        <button type="button" class="btn-danger btn-small" onclick="removeVideo(this)">删除</button>
      `;
      videoList.appendChild(row);
    });
  } else {
    addVideoRow();
  }

  showPage('addDish')
}

function editCurrentDish(){
  if(!currentViewDishId) return;
  editDish(currentViewDishId);
}

function resetAddDishForm(){
  document.getElementById('addEditTitle').innerText = '新增菜品';
  document.getElementById('dishName').value = '';
  document.getElementById('dishCategory').value = '';
  document.getElementById('dishStep').value = '';
  document.getElementById('editDishId').value = '';
  globalEditId = "";
  
  const ingList = document.getElementById('ingredientList');
  ingList.innerHTML = '';
  addIngredientRow();

  const videoList = document.getElementById('videoList');
  videoList.innerHTML = '';
  addVideoRow();
}

function addIngredientRow(){
  const ingList = document.getElementById('ingredientList');
  const row = document.createElement('div');
  row.className = 'ingredient-row';
  row.innerHTML = `
    <input type="text" placeholder="食材名称" class="ing-name">
    <input type="text" placeholder="用量" class="ing-amount">
    <button type="button" class="btn-danger btn-small" onclick="removeIngredient(this)">删除</button>
  `;
  ingList.appendChild(row);
}

function removeIngredient(btn){
  const ingList = document.getElementById('ingredientList');
  if(ingList.children.length > 1){
    btn.parentElement.remove();
  } else {
    alert('至少保留一行食材');
  }
}

function addVideoRow(){
  const videoList = document.getElementById('videoList');
  const row = document.createElement('div');
  row.className = 'video-row';
  row.innerHTML = `
    <input type="text" placeholder="视频链接" class="video-url">
    <button type="button" class="btn-danger btn-small" onclick="removeVideo(this)">删除</button>
  `;
  videoList.appendChild(row);
}

function removeVideo(btn){
  const videoList = document.getElementById('videoList');
  if(videoList.children.length > 1){
    btn.parentElement.remove();
  } else {
    alert('至少保留一个视频链接框');
  }
}

function saveDish(){
  const name = document.getElementById('dishName').value.trim()
  const cateId = document.getElementById('dishCategory').value
  const editId = globalEditId || document.getElementById('editDishId').value.trim()

  if(!name) return alert('请输入菜名')
  if(!confirm('确认保存该菜品？')) return;

  const ingredients = [];
  document.querySelectorAll('#ingredientList .ingredient-row').forEach(row => {
    const name = row.querySelector('.ing-name').value.trim();
    const amount = row.querySelector('.ing-amount').value.trim();
    if(name) ingredients.push({name, amount});
  });

  const stepText = document.getElementById('dishStep').value.trim();
  const steps = stepText ? stepText.split('\n').filter(s => s.trim()) : [];

  const videos = [];
  document.querySelectorAll('#videoList .video-row .video-url').forEach(input => {
    const url = input.value.trim();
    if(url) videos.push(url);
  });

  const dishes = JSON.parse(localStorage.getItem('dishes'))

  if(editId){
    const idx = dishes.findIndex(d=>d.id === editId)
    if(idx !== -1){
      dishes[idx] = {...dishes[idx], name, cateId, ingredients, steps, videos}
    }
  }else{
    dishes.push({
      id:Date.now().toString(),name,cateId,ingredients,steps,videos,
      isDelete:false,deleteTime:null,permanentDelete:false
    })
  }

  localStorage.setItem('dishes',JSON.stringify(dishes))
  globalEditId = "";
  document.getElementById('editDishId').value = "";
  alert('保存成功')
  showPage('home')
}

function deleteDish(id){
  if(!confirm('确定删除？删除后30天内可在回收站恢复')) return
  const dishes = JSON.parse(localStorage.getItem('dishes'))
  const d = dishes.find(x=>x.id===id)
  d.isDelete = true
  d.deleteTime = Date.now()
  localStorage.setItem('dishes',JSON.stringify(dishes))
  renderDish()
}

// 随机配餐
function randomMeal(){
  const mealCount = parseInt(document.getElementById('mealCount').value) || 5;
  const minMeat = parseInt(document.getElementById('minMeat').value) || 0;
  const minSoup = parseInt(document.getElementById('minSoup').value) || 0;
  const noRepeatDays = parseInt(document.getElementById('noRepeatDays').value) || 3;

  const dishes = JSON.parse(localStorage.getItem('dishes')).filter(d=>{
    return !d.isDelete && (d.permanentDelete === undefined || !d.permanentDelete);
  });
  const usedIds = JSON.parse(localStorage.getItem('usedDishIds') || '[]')
  const validUsed = usedIds.filter(x=>Date.now() - x.time < noRepeatDays * 24 * 60 * 60 * 1000).map(x=>x.id)

  const meatDishes = dishes.filter(d=>d.cateId == 2 && !validUsed.includes(d.id));
  const soupDishes = dishes.filter(d=>d.cateId == 3 && !validUsed.includes(d.id));
  const otherDishes = dishes.filter(d=>d.cateId != 2 && d.cateId != 3 && !validUsed.includes(d.id));

  if(meatDishes.length < minMeat || soupDishes.length < minSoup || otherDishes.length + meatDishes.length + soupDishes.length < mealCount){
    return alert('菜品不足，请调整生成规则或添加更多菜品');
  }

  const meal = [];
  for(let i=0; i<minMeat; i++){
    const idx = Math.floor(Math.random() * meatDishes.length);
    meal.push(meatDishes.splice(idx, 1)[0]);
  }
  for(let i=0; i<minSoup; i++){
    const idx = Math.floor(Math.random() * soupDishes.length);
    meal.push(soupDishes.splice(idx, 1)[0]);
  }
  const remaining = mealCount - meal.length;
  const pool = [...meatDishes, ...soupDishes, ...otherDishes];
  for(let i=0; i<remaining; i++){
    const idx = Math.floor(Math.random() * pool.length);
    meal.push(pool.splice(idx, 1)[0]);
  }

  meal.forEach(d => {
    usedIds.push({id:d.id, time:Date.now()});
  });
  localStorage.setItem('usedDishIds', JSON.stringify(usedIds));

  renderMealResult(meal);

  try {
    let historyList = JSON.parse(localStorage.getItem('mealHistory') || '[]');
    historyList.unshift({
      id: Date.now(),
      time: new Date().toLocaleString(),
      foods: meal.map(d => d.name)
    });
    if (historyList.length > 50) historyList = historyList.slice(0, 50);
    localStorage.setItem('mealHistory', JSON.stringify(historyList));
    showMealHistory();
  } catch (e) {
    alert('保存记录失败，存储空间不足，请删除部分旧记录');
  }
}

function renderMealResult(meal){
  currentMealData = meal;
  let html = '<div style="padding:10px;"><h3>今日配餐</h3>';
  meal.forEach((d, idx) => {
    html += `
      <div class="dish-item" style="margin-bottom:10px;">
        <div>
          <span>${idx+1}. </span>
          <b style="cursor:pointer;color:#07c160;" onclick="viewMealDishDetail(${idx})">${d.name}</b>
        </div>
        <button onclick="openChangeModal(${idx})" class="btn-small">更换菜品</button>
      </div>
      <div class="ingredient-list" style="margin-left:10px;">
        ${d.ingredients ? d.ingredients.map((ing, i) => `
          <div class="ingredient-item" style="display:flex; align-items:center; gap:8px; margin:4px 0;">
            <input type="checkbox" id="meal-ing-${idx}-${i}" onchange="toggleMealIngredient(this)">
            <span>${ing.name}：${ing.amount}</span>
          </div>
        `).join('') : ''}
      </div>
    `;
  });
  html += '</div>';
  document.getElementById('mealResult').innerHTML = html;
}

function showMealHistory(){
  let historyList = JSON.parse(localStorage.getItem('mealHistory') || '[]');
  let oldBlock = document.getElementById('mealHistoryBlock');
  if(oldBlock) oldBlock.remove();

  let html = '<div id="mealHistoryBlock" style="margin-top:20px;border-top:1px solid #eee;padding-top:15px;"><h3>配餐历史记录</h3>';
  if(historyList.length === 0){
    html += '<p>暂无配餐记录</p>';
  }else{
    historyList.forEach(item => {
      html += `
        <div style="padding:8px 0;border-bottom:1px solid #eee;">
          <div>时间：${item.time}</div>
          <div>菜品：${item.foods.join('、')}</div>
          <button class="btn-danger btn-small" onclick="delMealHistory(${item.id})">删除本条记录</button>
        </div>
      `;
    })
  }
  html += '</div>';
  document.getElementById('mealResult').insertAdjacentHTML('beforeend', html);
}

function delMealHistory(recId){
  if(!confirm('确定删除该条记录？')) return;
  let historyList = JSON.parse(localStorage.getItem('mealHistory') || '[]');
  historyList = historyList.filter(item => item.id !== recId);
  localStorage.setItem('mealHistory', JSON.stringify(historyList));
  showMealHistory();
}

function viewMealDishDetail(idx){
  const d = currentMealData[idx];
  if(d) viewDishDetail(d.id);
}

function toggleMealIngredient(checkbox){
  const span = checkbox.nextElementSibling;
  if(checkbox.checked){
    span.style.textDecoration = 'line-through';
    span.style.color = '#666';
  } else {
    span.style.textDecoration = 'none';
    span.style.color = 'inherit';
  }
}

function openChangeModal(index){
  currentChangeMealIndex = index;
  document.getElementById('changeDishModal').style.display = 'block';
  document.getElementById('changeDishSearch').value = '';
  renderChangeDishList('');
}

function closeChangeModal(){
  document.getElementById('changeDishModal').style.display = 'none';
  currentChangeMealIndex = null;
}

function renderChangeDishList(keyword){
  keyword = keyword.toLowerCase().trim();
  const allDishes = JSON.parse(localStorage.getItem('dishes')).filter(d=>!d.isDelete && (d.permanentDelete === undefined || !d.permanentDelete));
  const list = document.getElementById('changeDishList');
  list.innerHTML = '';

  const filterList = allDishes.filter(d=>{
    if(!keyword) return true;
    const nameMatch = d.name.toLowerCase().includes(keyword);
    const ingMatch = d.ingredients && d.ingredients.some(ing=>ing.name.toLowerCase().includes(keyword));
    return nameMatch || ingMatch;
  });

  filterList.forEach(d=>{
    list.innerHTML += `
      <div style="padding:6px 0; border-bottom:1px solid #eee; cursor:pointer;" onclick="selectChangeDish('${d.id}')">
        ${d.name}
      </div>
    `;
  })
}

function selectChangeDish(dishId){
  const allDishes = JSON.parse(localStorage.getItem('dishes')).filter(d=>!d.isDelete && (d.permanentDelete === undefined || !d.permanentDelete));
  const target = allDishes.find(d=>d.id === dishId);
  if(!target) return;
  if(currentChangeMealIndex !== null){
    currentMealData[currentChangeMealIndex] = target;
    renderMealResult(currentMealData);
  }
  closeChangeModal();
}

// 手动选菜入口
function manualMeal() {
  const dishes = JSON.parse(localStorage.getItem('dishes') || '[]')
    .filter(d => !d.isDelete && (d.permanentDelete === undefined || !d.permanentDelete))
  let html = `
    <div style="padding:10px;">
      <h3>自由选菜（无限制）</h3>
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

// 【最终修复】手动配餐 保存历史+限制条数+异常捕获
function confirmManualMeal() {
  const checkboxes = document.querySelectorAll('#manual-dish-list input:checked')
  const selectedIds = Array.from(checkboxes).map(cb => cb.value)
  const selectedDishes = JSON.parse(localStorage.getItem('dishes') || '[]')
    .filter(d => selectedIds.includes(d.id))

  if (selectedDishes.length === 0) {
    alert('请至少选择一道菜品')
    return
  }

  renderMealResult(selectedDishes);

  try {
    // 保存历史记录，最多保留50条
    let historyList = JSON.parse(localStorage.getItem('mealHistory') || '[]');
    historyList.unshift({
      id: Date.now(),
      time: new Date().toLocaleString(),
      foods: selectedDishes.map(d => d.name)
    });
    if (historyList.length > 50) historyList = historyList.slice(0, 50);
    localStorage.setItem('mealHistory', JSON.stringify(historyList));

    // 同步记录已使用菜品（和随机配餐规则一致）
    let usedIds = JSON.parse(localStorage.getItem('usedDishIds') || '[]');
    selectedDishes.forEach(d => {
      usedIds.push({ id: d.id, time: Date.now() });
    });
    localStorage.setItem('usedDishIds', JSON.stringify(usedIds));

    showMealHistory();
  } catch (e) {
    console.error(e);
    alert('保存失败：本地存储空间已满，请先删除部分旧配餐记录');
  }
}

// 回收站
function showRecycle(){
  const dishes = JSON.parse(localStorage.getItem('dishes')).filter(d=>d.isDelete && (d.permanentDelete === undefined || !d.permanentDelete))
  const now = Date.now();
  const expireDays = 30;
  let html = ''
  dishes.forEach(d=>{
    const dayDiff = (now - d.deleteTime) / (1000*60*60*24);
    const canRestore = dayDiff < expireDays;
    html += `<div class="dish-item">
      <span>${d.name}（删除${Math.floor(dayDiff)}天）</span>
      <button onclick="restoreDish('${d.id}')" ${!canRestore ? 'disabled' : ''} class="btn-small">还原</button>
      <button onclick="delPermanent('${d.id}')" class="btn-danger btn-small">彻底删除</button>
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

function delPermanent(dishId){
  if(!confirm('永久删除后无法恢复，确定继续？')) return;
  let dishArr = JSON.parse(localStorage.getItem('dishes'));
  let target = dishArr.find(d => d.id === dishId);
  if(target) target.permanentDelete = true;
  localStorage.setItem('dishes', JSON.stringify(dishArr));
  showRecycle();
}

// 备份导入
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
      localStorage.setItem('mealHistory', JSON.stringify(data.mealHistory || []))
      alert('导入成功')
      showPage('home')
    }
    fr.readAsText(e.target.files[0])
  }
  input.click()
}

showPage('home')
