// 替换为你的GitHub仓库data.json地址
const DATA_URL = 'https://raw.githubusercontent.com/liuyang042/topt-dye-water-ratio-calculator/main/data.json';

// 全局状态
let isFixed = true; // 初始为定胚
let groups = [];

// DOM元素
const btnFixed = document.getElementById('btn-fixed');
const btnNonFixed = document.getElementById('btn-non-fixed');
const clearBtn = document.getElementById('clear-btn');
const groupList = document.getElementById('group-list');

// 初始化
async function init() {
  // 获取配置数据
  await fetchData();
  // 渲染染工作中心组
  renderGroups();
  // 绑定事件
  bindEvents();
}

// 获取GitHub上的配置数据
async function fetchData() {
  try {
    const response = await fetch(DATA_URL);
    const data = await response.json();
    groups = data;
  } catch (error) {
    console.error('获取数据失败:', error);
    alert('获取配置数据失败，请检查网络或GitHub仓库配置');
  }
}

// 渲染染工作中心组
function renderGroups() {
  groupList.innerHTML = '';
  groups.forEach(group => {
    const groupEl = document.createElement('div');
    groupEl.className = 'bg-neutral rounded-lg p-4 card-shadow';
    groupEl.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-medium">${group.group} - ${group.description}</h3>
        <span class="text-sm text-gray-500">计算方式: ${group.calcType}</span>
      </div>
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <label class="block text-gray-700 mb-1">输入数量</label>
          <input type="number" class="w-full px-4 py-2 border border-gray-300 rounded-lg input-focus" 
                 data-group="${group.group}" placeholder="输入整数">
        </div>
        <div class="flex-1">
          <label class="block text-gray-700 mb-1">水比</label>
          <input type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100" 
                 data-group="${group.group}" readonly>
        </div>
      </div>
    `;
    groupList.appendChild(groupEl);
  });
}

// 绑定事件
function bindEvents() {
  // 定胚/非定胚切换
  btnFixed.addEventListener('click', () => {
    isFixed = true;
    btnFixed.className = 'px-6 py-3 bg-primary text-white rounded-lg btn-hover';
    btnNonFixed.className = 'px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200';
    calculateAll();
  });

  btnNonFixed.addEventListener('click', () => {
    isFixed = false;
    btnNonFixed.className = 'px-6 py-3 bg-primary text-white rounded-lg btn-hover';
    btnFixed.className = 'px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200';
    calculateAll();
  });

  // 清空按钮事件
  clearBtn.addEventListener('click', () => {
    // 清除所有输入框内容
    document.querySelectorAll('input[type="number"]').forEach(input => {
      input.value = '';
    });
    // 清除所有结果框内容
    document.querySelectorAll('input[type="text"]').forEach(input => {
      input.value = '';
    });
  });

  // 输入框变化事件（修复手动删除时水比未清除的问题）
  groupList.addEventListener('input', (e) => {
    if (e.target.type === 'number') {
      const groupName = e.target.getAttribute('data-group');
      const value = e.target.value.trim();
      
      // 当输入为空时，同步清空水比结果
      if (value === '') {
        const resultEl = document.querySelector(`input[data-group="${groupName}"][type="text"]`);
        if (resultEl) resultEl.value = '';
        return;
      }
      
      calculateGroup(groupName, value);
    }
  });

  // 处理删除键导致的输入框为空情况（额外保障）
  groupList.addEventListener('keydown', (e) => {
    if (e.target.type === 'number' && e.key === 'Backspace') {
      // 延迟检查，确保输入框已更新
      setTimeout(() => {
        const groupName = e.target.getAttribute('data-group');
        const value = e.target.value.trim();
        if (value === '') {
          const resultEl = document.querySelector(`input[data-group="${groupName}"][type="text"]`);
          if (resultEl) resultEl.value = '';
        }
      }, 0);
    }
  });
}

// 计算所有组的水比
function calculateAll() {
  groups.forEach(group => {
    const inputEl = document.querySelector(`input[data-group="${group.group}"][type="number"]`);
    if (inputEl && inputEl.value) {
      calculateGroup(group.group, inputEl.value);
    }
  });
}

// 计算单个组的水比
function calculateGroup(groupName, quantity) {
  const group = groups.find(g => g.group === groupName);
  if (!group || isNaN(quantity) || quantity <= 0) {
    return;
  }

  let waterRatio;
  const q = parseInt(quantity);

  if (group.calcType === 'A') {
    if (isFixed) {
      // 定胚，计算方式A
      const numerator = q * 0.95 * 2.35 + group.additionalWater;
      const denominator = q * 0.95;
      waterRatio = numerator / denominator;
    } else {
      // 非定胚，计算方式A
      const numerator = q * 2.35 + group.additionalWater;
      const denominator = q;
      waterRatio = numerator / denominator;
    }
  } else { // 计算方式B
    if (isFixed) {
      // 定胚，计算方式B
      waterRatio = group.minWater / (q * 0.95) - 1;
    } else {
      // 非定胚，计算方式B
      waterRatio = group.minWater / q - 1;
    }
  }

  // 四舍五入到一位小数
  waterRatio = Math.round(waterRatio * 10) / 10;
  // 处理最低水比
  const finalRatio = Math.max(waterRatio, group.minWaterRatio);

  // 更新显示
  const resultEl = document.querySelector(`input[data-group="${group.group}"][type="text"]`);
  if (resultEl) {
    resultEl.value = finalRatio.toFixed(1);
  }
}

// 启动初始化
init();
