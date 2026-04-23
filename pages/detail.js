// ===== P2: 상품 상세 페이지 =====

const DetailPage = (() => {
  const COUPON_RATE = 0.1;
  const COUPON = { id: 'COUPON_10PCT', label: '10% 할인', name: '쇼핑 할인 쿠폰' };

  // 상품별 중첩 토글 깊이 설정 (T5 조건 - 토글 조작)
  // 강도1 = 토글 1개(클릭 1번에 배송정보 노출)
  // 강도2 = 토글 2중첩(토글1 → [주소토글]+[배송비토글] → 각각 클릭하면 내용 노출)
  // 강도3 = 토글 3중첩(토글1 → [주소토글]+[배송비토글] → 각각 클릭하면 [내용확인하기] → 클릭 시 노출)
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

  // 상품별 배송비 색상 설정 (T5 조건 - 색상 조작)
  const SHIPPING_COLOR = {
    'p001': '#6e6e6e',
    'p002': '#b4b3b3',
    'p003': '#b4b3b3',
    'p004': '#eee',
    'p005': '#b4b3b3',
    'p006': '#a8a8a8',
  };

  let currentProduct = null;
  let selectedOption = null;
  let quantity = 1;

  // ── 상품별 쿠폰 적용 상태 관리 ──────────────────
  const getAppliedMap = () => {
    try { return JSON.parse(sessionStorage.getItem('coupon_applied_products') || '{}'); } catch { return {}; }
  };
  const setApplied = (productId, val) => {
    const map = getAppliedMap();
    map[productId] = val;
    sessionStorage.setItem('coupon_applied_products', JSON.stringify(map));
  };
  const isCouponApplied = (productId) => !!getAppliedMap()[productId];

  // 상품의 기준 가격 (originalPrice 사용)
  const getBasePrice = () => currentProduct.originalPrice;

  const getCurrentPrice = () =>
    isCouponApplied(currentProduct.id)
      ? Math.floor(getBasePrice() * (1 - COUPON_RATE))
      : getBasePrice();

  // ── 배송 정보 HTML 생성 ─────────────────────────
  const buildDeliveryToggleHTML = (p, depth) => {
    const color = SHIPPING_COLOR[p.id] || '#111111';

    if (depth === 1) {
      return `
        <div class="detail-delivery-toggle" id="delivery-toggle-1"
             onclick="DetailPage.toggleDeliveryLevel(1)">
          <span class="detail-delivery-label">배송 정보</span>
          <div class="detail-delivery-summary">
            <span class="detail-delivery-type-text" id="delivery-toggle-text-1">🔽 상세 정보</span>
          </div>
        </div>
        <div class="delivery-inner" id="delivery-inner-1">
          <div class="delivery-content">
            <p class="detail-delivery-addr">&nbsp;&nbsp;> 배송 받을 주소 › <strong>우리집</strong></p>
            <p class="detail-delivery-note" style="color:${color};"><br>&nbsp;&nbsp;> ${p.shipping}</p>
          </div>
        </div>
      `;
    }

    if (depth === 2) {
      return `
        <div class="detail-delivery-toggle" id="delivery-toggle-1"
             onclick="DetailPage.toggleDeliveryLevel(1)">
          <span class="detail-delivery-label">배송 정보</span>
          <div class="detail-delivery-summary">
            <span class="detail-delivery-type-text" id="delivery-toggle-text-1">🔽 상세 정보</span>
          </div>
        </div>
        <div class="delivery-inner" id="delivery-inner-1">

          <!-- 주소 토글 -->
          <div class="detail-delivery-toggle--sub"
               onclick="DetailPage.toggleSubSection('addr')">
            <span class="detail-delivery-sub-label">주소</span>
            <span class="detail-delivery-sub-text" id="delivery-toggle-text-addr">🔽 상세 정보</span>
          </div>
          <div class="delivery-sub-inner" id="delivery-inner-addr">
            <p class="detail-delivery-addr">&nbsp;&nbsp;> 배송 받을 주소 › <strong>우리집</strong></p>
          </div>

          <!-- 배송비 토글 -->
          <div class="detail-delivery-toggle--sub"
               onclick="DetailPage.toggleSubSection('fee')">
            <span class="detail-delivery-sub-label">배송비</span>
            <span class="detail-delivery-sub-text" id="delivery-toggle-text-fee">🔽 상세 정보</span>
          </div>
          <div class="delivery-sub-inner" id="delivery-inner-fee">
            <p class="detail-delivery-note" style="color:${color};">&nbsp;&nbsp;>${p.shipping}</p>
          </div>

        </div>
      `;
    }

    if (depth === 3) {
      return `
        <div class="detail-delivery-toggle" id="delivery-toggle-1"
             onclick="DetailPage.toggleDeliveryLevel(1)">
          <span class="detail-delivery-label">배송 정보</span>
          <div class="detail-delivery-summary">
            <span class="detail-delivery-type-text" id="delivery-toggle-text-1">🔽 상세 정보</span>
          </div>
        </div>
        <div class="delivery-inner" id="delivery-inner-1">

          <!-- 주소 토글 -->
          <div class="detail-delivery-toggle--sub"
               onclick="DetailPage.toggleSubSection('addr')">
            <span class="detail-delivery-sub-label">주소</span>
            <span class="detail-delivery-sub-text" id="delivery-toggle-text-addr">🔽 상세 정보</span>
          </div>
          <div class="delivery-sub-inner" id="delivery-inner-addr">
            <button class="btn btn-outline delivery-detail-btn" id="delivery-addr-btn"
                    onclick="DetailPage.showFinalDelivery('addr')">
              내용확인하기
            </button>
            <div class="delivery-final" id="delivery-addr-final">
              <p class="detail-delivery-addr">&nbsp;&nbsp;> 배송 받을 주소 › <strong>우리집</strong></p>
            </div>
          </div>

          <!-- 배송비 토글 -->
          <div class="detail-delivery-toggle--sub"
               onclick="DetailPage.toggleSubSection('fee')">
            <span class="detail-delivery-sub-label">배송비</span>
            <span class="detail-delivery-sub-text" id="delivery-toggle-text-fee">🔽 상세 정보</span>
          </div>
          <div class="delivery-sub-inner" id="delivery-inner-fee">
            <button class="btn btn-outline delivery-detail-btn" id="delivery-fee-btn"
                    onclick="DetailPage.showFinalDelivery('fee')">
              내용확인하기
            </button>
            <div class="delivery-final" id="delivery-fee-final">
              <p class="detail-delivery-note" style="color:${color};">&nbsp;&nbsp;> ${p.shipping}</p>
            </div>
          </div>

        </div>
      `;
    }

    return '';
  };

  // ── 초기화 ──────────────────────────────────────
  const init = async (params) => {
    const productId = params.id;
    const products = ListPage.getProducts();
    currentProduct = products.find((p) => p.id === productId);
    if (!currentProduct) { Router.navigate('list'); return; }
    selectedOption = currentProduct.options?.[0];
    quantity = 1;
    render();
    bindEvents();
    Router.updateCartBadge();
  };

  // ── 렌더 ────────────────────────────────────────
  const render = () => {
    const p = currentProduct;
    const applied = isCouponApplied(p.id);
    const depth = TOGGLE_DEPTH[p.id] || 1;
    const page = document.getElementById('page-detail');

    page.innerHTML = `
      <div class="header">
        <button class="header__back" id="detail-back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#111" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <span class="header__title"></span>
        <button class="header__action" onclick="Router.navigate('cart')">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>
            <line x1="3" y1="6" x2="21" y2="6" stroke="#111" stroke-width="1.8"/>
            <path d="M16 10a4 4 0 01-8 0" stroke="#111" stroke-width="1.8"/>
          </svg>
          <span class="badge" id="cart-badge" style="display:none;">0</span>
        </button>
      </div>

      <div class="detail-img-wrap">
        <img src="${p.image}" alt="${p.name}"
          onerror="this.src='';this.parentNode.style.background='#f0f0f0';"
          style="width:100%;aspect-ratio:1;object-fit:cover;" />
      </div>

      <div class="detail-info">
        <p class="detail-brand">브랜드 ${p.brand}</p>
        <div class="detail-name-row">
          <h1 class="detail-name">${p.name} ${p.capacity}</h1>
          <span class="detail-per-unit">(${p.pricePerUnit})</span>
        </div>
        <div class="detail-price-wrap" id="detail-price-wrap">
          ${priceHTML(applied)}
        </div>
      </div>

      <div class="divider"></div>

      <!-- 쿠폰 영역 -->
      <div class="detail-coupon-row" id="detail-coupon-row">
        ${couponRowHTML(applied)}
      </div>

      <div class="divider"></div>

      <!-- 배송 중첩 토글 영역 -->
      <div id="delivery-toggle-wrap">
        ${buildDeliveryToggleHTML(p, depth)}
      </div>

      <div class="divider"></div>

      <!-- 수량 -->
      <div class="detail-section">
        <div class="quantity-row">
          <button class="qty-btn" id="qty-minus">−</button>
          <span class="qty-value" id="qty-value">1</span>
          <button class="qty-btn" id="qty-plus">+</button>
          <span class="qty-total" id="qty-total" style="margin-left:auto;font-size:16px;font-weight:800;color:var(--primary);"></span>
        </div>
      </div>

      <div style="height:100px;"></div>

      <div class="bottom-bar">
        <button class="btn btn-secondary" id="btn-cart" style="flex:1;">장바구니</button>
        <button class="btn btn-primary"   id="btn-buy"  style="flex:1.5;">구매하기</button>
      </div>

      <!-- 오버레이 -->
      <div class="overlay" id="overlay" onclick="DetailPage.closeCouponSheet()"></div>

      <!-- 쿠폰 바텀시트 -->
      <div class="bottom-sheet" id="coupon-sheet">
        <div class="bottom-sheet__handle"></div>
        <div id="coupon-sheet-content"></div>
      </div>
    `;
  };

  // ── 토글1 열기/닫기 (배송 정보 최상위) ──────────
  const toggleDeliveryLevel = (level) => {
    const innerEl = document.getElementById(`delivery-inner-${level}`);
    const textEl  = document.getElementById(`delivery-toggle-text-${level}`);
    if (!innerEl) return;

    const isOpen = innerEl.style.display === 'block';
    if (isOpen) {
      innerEl.style.display = 'none';
      if (textEl) textEl.textContent = '🔽 상세 정보';
      ['addr', 'fee'].forEach(key => {
        const sub    = document.getElementById(`delivery-inner-${key}`);
        const subTxt = document.getElementById(`delivery-toggle-text-${key}`);
        const btn    = document.getElementById(`delivery-${key}-btn`);
        const final  = document.getElementById(`delivery-${key}-final`);
        if (sub)    sub.style.display = 'none';
        if (subTxt) subTxt.textContent = '🔽 상세 정보';
        if (btn)    btn.style.display = '';
        if (final)  final.style.display = 'none';
      });
    } else {
      innerEl.style.display = 'block';
      if (textEl) textEl.textContent = '🔼 상세 정보';
    }
  };

  // ── 서브 토글 열기/닫기 (주소 / 배송비) ─────────
  const toggleSubSection = (key) => {
    const innerEl = document.getElementById(`delivery-inner-${key}`);
    const textEl  = document.getElementById(`delivery-toggle-text-${key}`);
    if (!innerEl) return;

    const isOpen = innerEl.style.display === 'block';
    if (isOpen) {
      innerEl.style.display = 'none';
      if (textEl) textEl.textContent = '🔽 상세 정보';
      const btn   = document.getElementById(`delivery-${key}-btn`);
      const final = document.getElementById(`delivery-${key}-final`);
      if (btn)   btn.style.display = '';
      if (final) final.style.display = 'none';
    } else {
      innerEl.style.display = 'block';
      if (textEl) textEl.textContent = '🔼 상세 정보';
    }
  };

  // ── 강도3 전용: 내용확인하기 버튼 클릭 시 노출 ──
  const showFinalDelivery = (key) => {
    const btn   = document.getElementById(`delivery-${key}-btn`);
    const final = document.getElementById(`delivery-${key}-final`);
    if (btn)   btn.style.display = 'none';
    if (final) final.style.display = 'block';
  };

  // ── 가격 HTML ────────────────────────────────────
  const priceHTML = (applied) => {
    const basePrice = getBasePrice();
    if (applied) {
      const discounted = Math.floor(basePrice * (1 - COUPON_RATE));
      return `
        <div class="detail-price-row">
          <span class="detail-discount-rate">${COUPON_RATE * 100}%</span>
          <span class="detail-price">${discounted.toLocaleString()}원</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:2px;">
          <span class="detail-original-price">${basePrice.toLocaleString()}원</span>
          <span class="coupon-applied-tag">쿠폰 적용 ✓</span>
        </div>
      `;
    }
    return `
      <div class="detail-price-row">
        <span class="detail-price">${basePrice.toLocaleString()}원</span>
      </div>
    `;
  };

  // ── 쿠폰 버튼 HTML ──────────────────────────────
  const couponRowHTML = (applied) => {
    if (applied) {
      return `
        <span class="detail-coupon-label">쿠폰</span>
        <span class="detail-coupon-applied">10% 할인 쿠폰 적용 ✓</span>
      `;
    }
    return `
      <span class="detail-coupon-label">쿠폰</span>
      <button class="detail-coupon-btn" id="btn-open-coupon"><span>✅</span> 쿠폰 적용하기</button>
    `;
  };

  // ── 이벤트 바인딩 ────────────────────────────────
  const bindEvents = () => {
    const p = currentProduct;

    document.getElementById('detail-back').addEventListener('click', () => Router.navigate('list'));

    document.getElementById('qty-minus').addEventListener('click', () => {
      if (quantity > 1) { quantity--; updateQtyDisplay(); }
    });
    document.getElementById('qty-plus').addEventListener('click', () => {
      if (quantity < 99) { quantity++; updateQtyDisplay(); }
    });

    updateQtyDisplay();

    document.getElementById('btn-cart').addEventListener('click', () => {
      State.addToCart(p, selectedOption, quantity, getCurrentPrice());
      Router.updateCartBadge();
      Utils.showToast('장바구니에 담겼습니다 🛒');
      setTimeout(() => Router.navigate('list'), 900);
    });

    document.getElementById('btn-buy').addEventListener('click', () => {
      State.addToCart(p, selectedOption, quantity, getCurrentPrice());
      Router.navigate('checkout', { productId: p.id, qty: quantity });
    });

    const couponBtn = document.getElementById('btn-open-coupon');
    if (couponBtn) {
      couponBtn.addEventListener('click', () => {
        renderCouponSheet();
        document.getElementById('overlay').classList.add('show');
        document.getElementById('coupon-sheet').classList.add('show');
        document.body.style.overflow = 'hidden';
      });
    }
  };

  // ── 쿠폰 바텀시트 ────────────────────────────────
  const renderCouponSheet = () => {
    const basePrice = getBasePrice();
    const discounted = Math.floor(basePrice * (1 - COUPON_RATE));
    document.getElementById('coupon-sheet-content').innerHTML = `
      <div class="coupon-sheet-header">
        <div>
          <h3>쿠폰 적용</h3>
          <p style="font-size:13px;color:#999;margin-top:2px;">사용 가능한 쿠폰 1장</p>
        </div>
        <button onclick="DetailPage.closeCouponSheet()"
          style="font-size:22px;color:#999;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>
      <div style="padding:0 16px 16px;">
        <div class="coupon-card">
          <div class="coupon-card__left">
            <span class="coupon-card__rate">10%</span>
            <span class="coupon-card__unit">할인</span>
          </div>
          <div class="coupon-card__divider"></div>
          <div class="coupon-card__right">
            <p class="coupon-card__name">${COUPON.name}</p>
            <p class="coupon-card__desc">${basePrice.toLocaleString()}원 → ${discounted.toLocaleString()}원</p>
            <p class="coupon-card__expire">유효기간 ~2026.12.31 · 구매금액 제한없음</p>
          </div>
        </div>
        <button class="btn btn-primary" style="margin-top:16px;" onclick="DetailPage.applyAndClose()">
          받고 바로 적용하기
        </button>
      </div>
    `;
  };

  const closeCouponSheet = () => {
    const overlay = document.getElementById('overlay');
    const sheet   = document.getElementById('coupon-sheet');
    if (overlay) overlay.classList.remove('show');
    if (sheet)   sheet.classList.remove('show');
    document.body.style.overflow = '';
  };

  // 쿠폰 즉시 적용
  const applyAndClose = () => {
    setApplied(currentProduct.id, true);
    document.getElementById('detail-price-wrap').innerHTML = priceHTML(true);
    document.getElementById('detail-coupon-row').innerHTML = couponRowHTML(true);
    closeCouponSheet();
    updateQtyDisplay();
    Utils.showToast('10% 할인 쿠폰이 적용되었습니다 🎉');
  };

  // ── 수량/금액 표시 업데이트 ─────────────────────
  const updateQtyDisplay = () => {
    document.getElementById('qty-value').textContent = quantity;
    const totalEl = document.getElementById('qty-total');
    if (totalEl) {
      totalEl.textContent = (getCurrentPrice() * quantity).toLocaleString() + '원';
    }
  };

  return { init, applyAndClose, closeCouponSheet, toggleDeliveryLevel, toggleSubSection, showFinalDelivery };
})();