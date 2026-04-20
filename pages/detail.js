// ===== P2: 상품 상세 페이지 =====

const DetailPage = (() => {
  const COUPON_RATE = 0.1;          // 쿠폰 할인율 10%
  const COUPON = { id: 'COUPON_10PCT', label: '10% 할인', name: '쇼핑 할인 쿠폰' };

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

  // 상품의 기준 가격 (discountedPrice 사용)
  const getBasePrice = () => currentProduct.discountedPrice;

  const getCurrentPrice = () =>
    isCouponApplied(currentProduct.id)
      ? Math.floor(getBasePrice() * (1 - COUPON_RATE))
      : getBasePrice();

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
        <div class="detail-rating-row">
          <span style="color:var(--star);font-size:13px;">★★★★★</span>
          <strong>${p.rating}</strong>
          <span class="detail-review-count">(리뷰 ${p.reviewCount.toLocaleString()}개)</span>
        </div>
        <div class="detail-price-wrap" id="detail-price-wrap">
          ${priceHTML(applied)}
        </div>
      </div>

      <div class="divider"></div>

      <!-- 배송 토글 -->
      <div class="detail-delivery-toggle" id="delivery-toggle" onclick="DetailPage.toggleDelivery()">
        <span class="detail-delivery-label">배송 정보</span>
        <svg class="delivery-toggle-icon" id="delivery-toggle-icon" width="20" height="20" viewBox="0 0 12 12" fill="#999">
          <polygon points="2,2 10,2 6,10"/>
        </svg>
        <div class="detail-delivery-summary">
          <span class="detail-delivery-type-text">배송비 및 배송일자 관련 정보</span>
        </div>
        
      </div>
      <div class="detail-delivery-detail" id="delivery-detail" style="display:none;">
        <p class="detail-delivery-addr">  > 배송 받을 주소 › <strong>우리집</strong></p>
        <p class="detail-delivery-note"></br>  > ${p.shipping} </p>
      </div>

      <div class="divider"></div>

      <!-- 쿠폰 영역 -->
      <div class="detail-coupon-row" id="detail-coupon-row">
        ${couponRowHTML(applied)}
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

  // ── 가격 HTML ────────────────────────────────────
  const priceHTML = (applied) => {
    const basePrice = getBasePrice();
    if (applied) {
      const discounted = Math.floor(basePrice * (1 - COUPON_RATE));
      return `
        <div class="detail-price-row">
          <span class="detail-discount-rate">${currentProduct.discountRate + COUPON_RATE * 100}%</span>
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
        <span class="detail-discount-rate">${currentProduct.discountRate}%</span>
        <span class="detail-price">${basePrice.toLocaleString()}원</span>
      </div>
      <div style="margin-top:2px;">
        <span class="detail-original-price">${currentProduct.originalPrice.toLocaleString()}원</span>
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
      <button class="detail-coupon-btn" id="btn-open-coupon">쿠폰 적용 <span>›</span></button>
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

    // 초기 금액 표시
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
  
  // 배송 정보 토글
  const toggleDelivery = () => {
    const detail = document.getElementById('delivery-detail');
    const icon   = document.getElementById('delivery-toggle-icon');
    const isOpen = detail.style.display !== 'none';
    detail.style.display = isOpen ? 'none' : 'block';
    icon.style.transform  = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
  }; 

  // ── 수량/금액 표시 업데이트 ─────────────────────
  const updateQtyDisplay = () => {
    document.getElementById('qty-value').textContent = quantity;
    const totalEl = document.getElementById('qty-total');
    if (totalEl) {
      totalEl.textContent = (getCurrentPrice() * quantity).toLocaleString() + '원';
    }
  };

  return { init, applyAndClose, closeCouponSheet, toggleDelivery };
})();