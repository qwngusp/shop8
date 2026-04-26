// ===== P1: 상품 리스트 페이지 =====

const ListPage = (() => {
  let products = [];

  const CATEGORIES = ['전체'];
  let activeCategory = '전체';

  // ── 리스트 쿠폰 바텀시트 ──────────────────────────
  const COUPON_RATE = 0.1;

  const getAppliedMap = () => {
    try { return JSON.parse(sessionStorage.getItem('coupon_applied_products') || '{}'); } catch { return {}; }
  };
  const isCouponApplied = (productId) => !!getAppliedMap()[productId];
  const setApplied = (productId) => {
    const map = getAppliedMap();
    map[productId] = true;
    sessionStorage.setItem('coupon_applied_products', JSON.stringify(map));
  };

  const openCouponSheet = (productId, basePrice) => {
    const discounted = Math.floor(basePrice * (1 - COUPON_RATE));

    // 이미 존재하는 시트가 있으면 제거
    const existing = document.getElementById('list-coupon-overlay');
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.id = 'list-coupon-overlay';
    wrap.innerHTML = `
      <div class="overlay show" id="list-overlay" onclick="ListPage.closeCouponSheet()"></div>
      <div class="bottom-sheet show" id="list-coupon-sheet">
        <div class="bottom-sheet__handle"></div>
        <div class="coupon-sheet-header">
          <div>
            <h3>쿠폰 적용</h3>
            <p style="font-size:13px;color:#999;margin-top:2px;">사용 가능한 쿠폰 1장</p>
          </div>
          <button onclick="ListPage.closeCouponSheet()" style="font-size:22px;color:#999;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>
        <div style="padding:0 16px 16px;">
          <div class="coupon-card">
            <div class="coupon-card__left">
              <span class="coupon-card__rate">10%</span>
              <span class="coupon-card__unit">할인</span>
            </div>
            <div class="coupon-card__divider"></div>
            <div class="coupon-card__right">
              <p class="coupon-card__name">쇼핑 할인 쿠폰</p>
              <p class="coupon-card__desc">${basePrice.toLocaleString()}원 → ${discounted.toLocaleString()}원</p>
              <p class="coupon-card__expire">유효기간 ~2026.12.31 · 구매금액 제한없음</p>
            </div>
          </div>
          <button class="btn btn-primary" style="margin-top:16px;"
            onclick="ListPage.applyAndClose('${productId}', ${basePrice})">
            받고 바로 적용하기
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
    document.body.style.overflow = 'hidden';
  };

  const closeCouponSheet = () => {
    const wrap = document.getElementById('list-coupon-overlay');
    if (wrap) wrap.remove();
    document.body.style.overflow = '';
  };

  const applyAndClose = (productId, basePrice) => {
    setApplied(productId);
    closeCouponSheet();

    const row = document.querySelector(`.product-row[data-id="${productId}"]`);
    if (row) {
      const discounted = Math.floor(basePrice * (1 - COUPON_RATE));

      // 기존 단위가격 엘리먼트 먼저 제거 (priceEl 밖에 있는 것)
      const perUnitEl = row.querySelector('.product-row__per-unit');
      if (perUnitEl) perUnitEl.remove();

      // 가격 업데이트
      const priceEl = row.querySelector('.product-row__price');
      if (priceEl) {
        const product = products.find(p => p.id === productId);
        const perUnitStr = product ? formatPerUnit(product, true) : null;
        priceEl.innerHTML = `
          <span class="product-row__price-original">${basePrice.toLocaleString()}원</span>
          <div class="product-row__price-discounted">
            <span class="product-row__price-rate">10%</span>
            <span class="product-row__price-amount">${discounted.toLocaleString()}원</span>
            ${perUnitStr ? `<span class="product-row__per-unit">(${perUnitStr})</span>` : ''}
          </div>
        `;
      }

      // 배송비 아래 쿠폰 뱃지 업데이트
      const badgeRow = row.querySelector('.product-row__coupon-badge-row');
      if (badgeRow) {
        badgeRow.innerHTML = `<span class="list-coupon-applied-tag">✓ 쿠폰 적용됨</span>`;
      }

      // 3열 쿠폰 버튼 → 제거
      const couponCol = row.querySelector('.product-row__coupon-col');
      if (couponCol) couponCol.remove();

      // 세로 구분선도 제거
      const divider = row.querySelector('.product-row__col-divider');
      if (divider) divider.remove();
    }

    Utils.showToast('10% 할인 쿠폰이 적용되었습니다 🎉');
  };

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

  // 단위가격 문자열 생성 (쿠폰 적용 여부에 따라 계산)
  const formatPerUnit = (p, applied) => {
    if (!p.pricePer100ml) return p.pricePerUnit || null;
    const perUnit = applied
      ? Math.floor(p.pricePer100ml * (1 - COUPON_RATE))
      : p.pricePer100ml;
    return `100ml당 ${perUnit.toLocaleString()}원`;
  };

  // ── 배송비 토글 ──────────────────────────────────
  // 상품별 토글 깊이 설정
  // p001=C단품(6위,강도1), p002=B묶음(3위,강도2), p003=A단품(4위,강도2)
  // p004=A묶음(1위,강도3), p005=C묶음(2위,강도2), p006=B단품(5위,강도2)
  const TOGGLE_DEPTH = {
    'p001': 1,
    'p002': 1,
    'p003': 1,
    'p004': 1,
    'p005': 1,
    'p006': 1,
  };

  // 상품별 배송비 색상 설정
  const SHIPPING_COLOR = {
    'p001': '#ddd',
    'p002': '#ddd',
    'p003': '#ddd',
    'p004': '#ddd',
    'p005': '#ddd',
    'p006': '#ddd',
  };

  // 토글 깊이에 따른 배송비 HTML 생성
  const shippingToggleHTML = (p) => {
    const depth = TOGGLE_DEPTH[p.id] || 1;
    const id = p.id;
    const shippingColor = SHIPPING_COLOR[p.id] || '';
    const colorStyle = shippingColor ? ` style="color:${shippingColor};"` : '';

    if (depth === 1) {
      return `
        <div class="product-row__shipping-box">
          <div class="product-row__shipping-toggle" onclick="event.stopPropagation(); ListPage.toggleShipping('${id}', 1)">
            🔽 배송 정보
          </div>
          <div id="list-shipping-inner-${id}" class="product-row__shipping-detail" style="display:none;">
            <span class="product-row__shipping"${colorStyle}><span class="shipping-box-icon"></span>${p.shipping}</span>
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
              <span class="product-row__shipping"${colorStyle}><span class="shipping-box-icon"></span>${p.shipping}</span>
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
                <span class="product-row__shipping"${colorStyle}><span class="shipping-box-icon"></span>${p.shipping}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  };

  const productRow = (p) => {
    const applied = isCouponApplied(p.id);
    const discounted = Math.floor(p.originalPrice * (1 - 0.1));
    const perUnit = formatPerUnit(p, applied);

    const priceHTML = applied
      ? `<span class="product-row__price-original">${p.originalPrice.toLocaleString()}원</span>
         <div class="product-row__price-discounted">
           <span class="product-row__price-rate">10%</span>
           <span class="product-row__price-amount">${discounted.toLocaleString()}원</span>
           ${perUnit ? `<span class="product-row__per-unit">(${perUnit})</span>` : ''}
         </div>`
      : `${p.originalPrice.toLocaleString()}원`;

    const couponBadgeHTML = applied
      ? `<span class="list-coupon-applied-tag">✓ 쿠폰 적용됨</span>`
      : `<span class="list-coupon-badge">🏷️ 쿠폰 적용가능</span>`;

    const rightColHTML = applied ? `` : `
      <div class="product-row__col-divider"></div>
      <div class="product-row__coupon-col">
        <button class="list-coupon-btn" onclick="event.stopPropagation(); ListPage.openCouponSheet('${p.id}', ${p.originalPrice})">
          <span class="list-coupon-btn__label">쿠폰<br>다운</span>
          <span class="list-coupon-btn__icon">↓</span>
        </button>
      </div>
    `;

    return `
    <div class="product-row" data-id="${p.id}">
      <div class="product-row__img">
        <img src="${p.image}" alt="${p.name}"
          onerror="this.parentNode.style.background='#f0f0f0';this.style.display='none';" />
      </div>
      <div class="product-row__info">
        <p class="product-row__name">[브랜드${p.brand}] ${p.name}</p>
        <p class="product-row__capacity"> ${p.capacity}</p>
        <div class="product-row__price-row">
          <span class="product-row__price">${priceHTML}</span>
          ${!applied && perUnit ? `<span class="product-row__per-unit">(${perUnit})</span>` : ''}
        </div>
        <div class="product-row__footer">
          <div class="product-row__coupon-badge-row">${couponBadgeHTML}</div>
          <div class="product-row__shipping-wrap">
            ${shippingToggleHTML(p)}
          </div>
        </div>
      </div>
      ${rightColHTML}
    </div>
  `;
  };

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

  return { init, getProducts: () => products, openCouponSheet, closeCouponSheet, applyAndClose, toggleShipping, showShippingFinal };
})();