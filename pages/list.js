// ===== P1: 상품 리스트 페이지 =====

const ListPage = (() => {
  let products = [];

  const CATEGORIES = ['전체'];
  let activeCategory = '전체';

  const init = async () => {
    const page = document.getElementById('page-list');

    page.innerHTML = `
      <!-- 헤더 -->
      <div class="header">
        <span class="header__logo" style="font-size:18px;font-weight:900;color:var(--primary);">ShopLab</span>
        <div class="list-search-bar" onclick="">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#999" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="#999" stroke-width="2" stroke-linecap="round"/></svg>
          <span style="color:#999;font-size:14px;">검색</span>
        </div>
        <button class="header__action" onclick="Router.navigate('cart')">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/><line x1="3" y1="6" x2="21" y2="6" stroke="#111" stroke-width="1.8"/><path d="M16 10a4 4 0 01-8 0" stroke="#111" stroke-width="1.8"/></svg>
          <span class="badge" id="cart-badge" style="display:none;">0</span>
        </button>
      </div>

      <!-- 카테고리 탭 -->
      <div class="list-cat-tabs" id="list-cat-tabs">
        ${CATEGORIES.map(c => `
          <button class="list-cat-tab ${c === activeCategory ? 'active' : ''}" data-cat="${c}">${c}</button>
        `).join('')}
      </div>

      <!-- 검색결과 -->
      <div class="list-label-row">
        <span class="list-label">검색 결과</span>
        <span class="list-total">총 <strong>${products.length || 6}개</strong></span>
      </div>

      <!-- 상품 리스트 -->
      <div class="product-list" id="product-list">
        <div class="spinner"></div>
      </div>
    `;

    if (products.length === 0) {
      products = await loadProducts();
    }

    renderList();
    bindCategoryTabs();
    Router.updateCartBadge();
  };

  const loadProducts = async () => {
    try {
      const res = await fetch('data/products.json');
      return await res.json();
    } catch (e) {
      console.error('상품 데이터 로드 실패:', e);
      return [];
    }
  };

  const renderList = () => {
    const list = document.getElementById('product-list');
    if (!list) return;

    list.innerHTML = products.map((p) => productRow(p)).join('');

    list.querySelectorAll('.product-row').forEach((row) => {
      row.addEventListener('click', () => {
        const id = row.dataset.id;
        Logger.logClick(id);
        Router.navigate('detail', { id });
      });
    });
  };

  const bindCategoryTabs = () => {
    document.querySelectorAll('.list-cat-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.list-cat-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.cat;
        // 실험 환경이라 전체 상품만 보여줌
        renderList();
      });
    });
  };

  // 상품별 배송비 토글 깊이 설정 (T6 조건 - 토글 조작)
  // p001=C단품(6위,강도1), p002=B묶음(3위,강도2), p003=A단품(4위,강도2)
  // p004=A묶음(1위,강도3), p005=C묶음(2위,강도2), p006=B단품(5위,강도2)
  const TOGGLE_DEPTH = {
    'p001': 1,
    'p002': 2,
    'p003': 2,
    'p004': 3,
    'p005': 2,
    'p006': 2,
  };

  // 토글 깊이에 따른 배송비 HTML 생성
  const shippingToggleHTML = (p) => {
    const depth = TOGGLE_DEPTH[p.id] || 1;
    const id = p.id;

    if (depth === 1) {
      return `
        <div class="product-row__shipping-box">
          <div class="product-row__shipping-toggle" onclick="event.stopPropagation(); ListPage.toggleShipping('${id}', 1)">
            🔽 배송 정보
          </div>
          <div id="list-shipping-inner-${id}" class="product-row__shipping-detail" style="display:none;">
            <span class="product-row__shipping">${p.shipping}</span>
          </div>
        </div>
      `;
    }

    if (depth === 2) {
      return `
        <div class="product-row__shipping-box">
          <div class="product-row__shipping-toggle" onclick="event.stopPropagation(); ListPage.toggleShipping('${id}', 1)">
            🔽 배송 정보
          </div>
          <div id="list-shipping-inner-${id}" class="product-row__shipping-detail" style="display:none;">
            <div class="product-row__shipping-toggle--sub" onclick="event.stopPropagation(); ListPage.toggleShipping('${id}', 2)">
              🔽 배송비
            </div>
            <div id="list-shipping-fee-${id}" class="product-row__shipping-detail" style="display:none;">
              <span class="product-row__shipping">${p.shipping}</span>
            </div>
          </div>
        </div>
      `;
    }

    if (depth === 3) {
      return `
        <div class="product-row__shipping-box">
          <div class="product-row__shipping-toggle" onclick="event.stopPropagation(); ListPage.toggleShipping('${id}', 1)">
            🔽 배송 정보
          </div>
          <div id="list-shipping-inner-${id}" class="product-row__shipping-detail" style="display:none;">
            <div class="product-row__shipping-toggle--sub" onclick="event.stopPropagation(); ListPage.toggleShipping('${id}', 2)">
              🔽 배송비
            </div>
            <div id="list-shipping-fee-${id}" class="product-row__shipping-detail" style="display:none;">
              <button class="product-row__shipping-btn" onclick="event.stopPropagation(); ListPage.showShippingFinal('${id}')">
                내용확인하기
              </button>
              <div id="list-shipping-final-${id}" class="product-row__shipping-final" style="display:none;">
                <span class="product-row__shipping">${p.shipping}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  };

  const productRow = (p) => `
    <div class="product-row" data-id="${p.id}">
      <div class="product-row__img">
        <img src="${p.image}" alt="${p.name}"
          onerror="this.parentNode.style.background='#f0f0f0';this.style.display='none';" />
      </div>
      <div class="product-row__info">
        <p class="product-row__name_capacity">[브랜드${p.brand}] ${p.name} ${p.capacity}</p>
        <div class="product-row__price-row">
          <span class="product-row__price">${p.originalPrice.toLocaleString()}원</span>
        </div>
        <div class="product-row__footer">
          ${shippingToggleHTML(p)}
        </div>
      </div>
    </div>
  `;

  // 1단계 토글 열기/닫기
  const toggleShipping = (productId, level) => {
    if (level === 1) {
      const el = document.getElementById(`list-shipping-inner-${productId}`);
      const toggle = el?.previousElementSibling;
      if (!el) return;
      const isOpen = el.style.display === 'block';
      el.style.display = isOpen ? 'none' : 'block';
      if (toggle) toggle.textContent = isOpen ? '🔽 배송 정보' : '🔼 배송 정보';
      // 닫을 때 하위도 초기화
      if (isOpen) {
        const feeEl = document.getElementById(`list-shipping-fee-${productId}`);
        const finalEl = document.getElementById(`list-shipping-final-${productId}`);
        const btnEl = el.querySelector('.product-row__shipping-btn');
        if (feeEl) feeEl.style.display = 'none';
        if (finalEl) finalEl.style.display = 'none';
        if (btnEl) btnEl.style.display = '';
        const subToggle = el.querySelector('.product-row__shipping-toggle--sub');
        if (subToggle) subToggle.textContent = '🔽 배송비';
      }
    } else if (level === 2) {
      const el = document.getElementById(`list-shipping-fee-${productId}`);
      const toggle = el?.previousElementSibling;
      if (!el) return;
      const isOpen = el.style.display === 'block';
      el.style.display = isOpen ? 'none' : 'block';
      if (toggle) toggle.textContent = isOpen ? '🔽 배송비' : '🔼 배송비';
      if (isOpen) {
        const finalEl = document.getElementById(`list-shipping-final-${productId}`);
        const btnEl = el.querySelector('.product-row__shipping-btn');
        if (finalEl) finalEl.style.display = 'none';
        if (btnEl) btnEl.style.display = '';
      }
    }
  };

  // 강도3 전용: 내용확인하기 버튼
  const showShippingFinal = (productId) => {
    const btn = document.querySelector(`#list-shipping-fee-${productId} .product-row__shipping-btn`);
    const final = document.getElementById(`list-shipping-final-${productId}`);
    if (btn) btn.style.display = 'none';
    if (final) final.style.display = 'block';
  };

  return { init, getProducts: () => products, toggleShipping, showShippingFinal };
})();