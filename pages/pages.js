// ===== P4: 쿠폰 페이지 =====

const CouponPage = (() => {
  const init = (params) => {
    const fromProductId = params.productId;
    const page = document.getElementById('page-coupon');
    const applied = State.getCoupon();
    const coupons = DetailPage.getCoupons();

    page.innerHTML = `
      <div class="header">
        <button class="header__back" onclick="history.back()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#111" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <span class="header__title">쿠폰함</span>
        <div style="width:36px;"></div>
      </div>

      <div class="section-title">보유 쿠폰 ${coupons.length}개</div>

      <div class="coupon-page-list">
        ${coupons.map((c) => `
          <div class="coupon-page-item ${applied?.id === c.id ? 'applied' : ''}">
            <div class="coupon-page-item__badge">${c.label}</div>
            <div class="coupon-page-item__info">
              <p class="coupon-page-item__name">${c.name}</p>
              <p class="coupon-page-item__expire">유효기간: ${c.expire}</p>
            </div>
            <button class="coupon-page-item__btn ${applied?.id === c.id ? 'applied' : ''}"
              onclick="CouponPage.applyAndBack('${c.id}', '${fromProductId}')">
              ${applied?.id === c.id ? '✓ 적용됨' : '적용하기'}
            </button>
          </div>
        `).join('')}
      </div>

      ${fromProductId ? `
        <div style="padding:16px;">
          <button class="btn btn-primary" onclick="Router.navigate('detail',{id:'${fromProductId}'})">
            상품으로 돌아가기
          </button>
        </div>
      ` : ''}
    `;
  };

  const applyAndBack = (couponId, productId) => {
    const coupons = DetailPage.getCoupons();
    const coupon = coupons.find((c) => c.id === couponId);
    if (coupon) {
      State.applyCoupon(coupon);
      Utils.showToast(`${coupon.label} 쿠폰이 적용되었습니다`);
      if (productId) {
        setTimeout(() => Router.navigate('detail', { id: productId }), 800);
      }
    }
  };

  return { init, applyAndBack };
})();


// ===== P5: 장바구니 페이지 =====

const CartPage = (() => {
  const init = () => {
    render();
    Router.updateCartBadge();
  };

  const render = () => {
    const cart = State.getCart();
    const page = document.getElementById('page-cart');

    if (cart.length === 0) {
      page.innerHTML = `
        <div class="header">
          <button class="header__back" onclick="history.back()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#111" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <span class="header__title">장바구니</span>
          <div style="width:36px;"></div>
        </div>
        <div class="empty-state">
          <div class="empty-state__icon">🛒</div>
          <p class="empty-state__text">장바구니가 비어있습니다</p>
          <button class="btn btn-primary" style="margin-top:24px;width:160px;"
            onclick="Router.navigate('list')">쇼핑 계속하기</button>
        </div>
      `;
      return;
    }

    const total = State.getCartTotal();
    const shippingTotal = State.getCartShipping();
    const coupon = State.getCoupon();
    let discount = 0;
    if (coupon) {
      if (coupon.label.includes('%')) {
        const pct = parseInt(coupon.label);
        discount = Math.floor(total * pct / 100);
      } else {
        discount = parseInt(coupon.label.replace(/[^0-9]/g, ''));
      }
    }
    const finalTotal = Math.max(0, total - discount) + shippingTotal;

    page.innerHTML = `
      <div class="header">
        <button class="header__back" onclick="history.back()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#111" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <span class="header__title">장바구니</span>
        <div style="width:36px;"></div>
      </div>

      <div class="cart-list">
        ${cart.map((item, i) => `
          <div class="cart-item">
            <div class="cart-item__img-wrap">
              <img src="${item.image}" alt="${item.name}"
                onerror="this.parentNode.style.background='#eee';this.style.display='none';"
              />
            </div>
            <div class="cart-item__info">
              <p class="cart-item__name">${item.name}</p>
              <p class="cart-item__option">${item.option}</p>
              <p class="cart-item__price">${(item.unitPrice * item.quantity).toLocaleString()}원</p>
              <p class="cart-item__qty">수량: ${item.quantity}개</p>
            </div>
            <button class="cart-item__delete" onclick="CartPage.removeItem(${i})" aria-label="삭제">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#999" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        `).join('')}
      </div>

      <div class="divider"></div>

      <div class="cart-summary">
        <div class="cart-summary__row">
          <span>상품금액</span>
          <span>${total.toLocaleString()}원</span>
        </div>
        ${coupon ? `
          <div class="cart-summary__row discount">
            <span>쿠폰 할인 (${coupon.label})</span>
            <span>-${discount.toLocaleString()}원</span>
          </div>
        ` : ''}
        <div class="cart-summary__row">
          <span>배송비</span>
          <span class="${shippingTotal === 0 ? 'free' : ''}">${shippingTotal === 0 ? '무료' : shippingTotal.toLocaleString() + '원'}</span>
        </div>
        <div class="cart-summary__row total">
          <span>결제 예정금액</span>
          <span>${finalTotal.toLocaleString()}원</span>
        </div>
      </div>

      <div style="height:80px;"></div>

      <div class="bottom-bar">
        <button class="btn btn-primary" id="cart-checkout-btn">
          ${finalTotal.toLocaleString()}원 결제하기
        </button>
      </div>
    `;

    document.getElementById('cart-checkout-btn').addEventListener('click', () => {
      const cart = State.getCart();
      if (cart.length > 0) {
        Router.navigate('checkout', {
          productId: cart[cart.length - 1].productId,
          qty: cart[cart.length - 1].quantity,
          fromCart: 'true'
        });
      }
    });
  };

  const removeItem = (index) => {
    State.removeCartItem(index);
    Router.updateCartBadge();
    render();
  };

  return { init, removeItem };
})();


// ===== P6: 결제 페이지 =====

const CheckoutPage = (() => {
  const init = (params) => {
    const fromCart = params.fromCart === 'true';
    const cart = State.getCart();
    const coupon = State.getCoupon();

    const total = State.getCartTotal();
    const shippingTotal = State.getCartShipping();
    let discount = 0;
    if (coupon) {
      if (coupon.label.includes('%')) {
        discount = Math.floor(total * parseInt(coupon.label) / 100);
      } else {
        discount = parseInt(coupon.label.replace(/[^0-9]/g, ''));
      }
    }
    const finalTotal = Math.max(0, total - discount) + shippingTotal;

    const page = document.getElementById('page-checkout');

    page.innerHTML = `
      <div class="header">
        <button class="header__back" onclick="history.back()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#111" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <span class="header__title">결제</span>
        <div style="width:36px;"></div>
      </div>

      <!-- 배송지 -->
      <div class="checkout-section">
        <p class="checkout-section__title">📦 배송지</p>
        <div class="checkout-address">
          <p class="checkout-address__name">우리집 <span class="default-tag">기본</span></p>
          <p class="checkout-address__addr">서울특별시 강남구 테헤란로 123</p>
        </div>
      </div>

      <div class="divider"></div>

      <!-- 주문 상품 -->
      <div class="checkout-section">
        <p class="checkout-section__title">🛍 주문 상품</p>
        ${cart.map((item) => `
          <div class="checkout-item">
            <img src="${item.image}" alt="${item.name}"
              onerror="this.style.display='none';"
              class="checkout-item__img"
            />
            <div class="checkout-item__info">
              <p class="checkout-item__name">${item.name}</p>
              <p class="checkout-item__detail">${item.option} · ${item.quantity}개</p>
              <p class="checkout-item__price">${(item.unitPrice * item.quantity).toLocaleString()}원</p>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="divider"></div>

      <!-- 결제 수단 -->
      <div class="checkout-section">
        <p class="checkout-section__title">💳 결제 수단</p>
        <div class="checkout-payment">
          <span class="payment-icon">💳</span>
          <span>신한카드 ****1234</span>
          <span class="payment-default">기본</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- 최종 금액 -->
      <div class="checkout-section">
        <p class="checkout-section__title">💰 결제 금액</p>
        <div class="checkout-price-list">
          <div class="checkout-price-row">
            <span>상품금액</span>
            <span>${total.toLocaleString()}원</span>
          </div>
          ${coupon ? `
            <div class="checkout-price-row discount">
              <span>쿠폰 할인</span>
              <span>-${discount.toLocaleString()}원</span>
            </div>
          ` : ''}
          <div class="checkout-price-row">
            <span>배송비</span>
            <span class="${shippingTotal === 0 ? 'free' : ''}">${shippingTotal === 0 ? '무료' : shippingTotal.toLocaleString() + '원'}</span>
          </div>
          <div class="checkout-price-row total">
            <span>최종 결제금액</span>
            <span>${finalTotal.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      <div style="height:90px;"></div>

      <div class="bottom-bar">
        <button class="btn btn-primary" id="btn-confirm-pay">
          ${finalTotal.toLocaleString()}원 결제 완료
        </button>
      </div>

      <!-- 결제 처리중 전체화면 오버레이 -->
      <div class="pay-loading-overlay" id="pay-loading" style="display:none;">
        <div class="pay-loading-box">
          <div class="pay-loading-spinner"></div>
          <p class="pay-loading-title">결제 처리 중</p>
          <p class="pay-loading-sub">잠시만 기다려주세요...</p>
        </div>
      </div>
    `;

    document.getElementById('btn-confirm-pay').addEventListener('click', async () => {
      const btn = document.getElementById('btn-confirm-pay');
      btn.disabled = true;

      // 결제 로딩 오버레이 표시
      document.getElementById('pay-loading').style.display = 'flex';

      // 결제한 상품들 로그
      for (const item of cart) {
        await Logger.logCheckout(item.productId, item.quantity, item.unitPrice * item.quantity);
      }

      // 세션 로그
      await Logger.logSession();

      State.clearCart();
      State.removeCoupon();

      Router.navigate('done');
    });
  };

  return { init };
})();


// ===== P7: 종료 안내 페이지 =====

const DonePage = (() => {
  const init = () => {
    const page = document.getElementById('page-done');

    page.innerHTML = `
      <div class="done-wrap">
        <div class="done-icon">✅</div>
        <h2 class="done-title">결제가 완료되었습니다!</h2>
        <p class="done-sub">쇼핑 실험 환경 참여가 종료되었습니다.</p>

        <div class="done-card">
          <p class="done-card__text">
            🙏 온라인 쇼핑 경험에 참여해 주셔서 감사합니다.<br><br>
            아래 버튼을 눌러 <strong>실험 환경을 종료</strong>하고<br>설문 페이지로 돌아가 응답을 이어주세요.
          </p>
        </div>

        <button class="btn btn-primary done-btn" onclick="DonePage.tryClose()">
          실험 환경 종료하기
        </button>

        <p class="done-hint">버튼을 눌러 이 창을 닫고 설문 페이지로 돌아가주세요</p>
      </div>
    `;
  };

  const tryClose = () => {
    // 창 닫기 시도 (브라우저 정책상 window.open으로 열린 창만 가능)
    try {
      window.close();
    } catch (e) {}

    // 닫히지 않으면 안내 메시지
    setTimeout(() => {
      const hint = document.querySelector('.done-hint');
      if (hint) {
        hint.textContent = '이 창을 직접 닫고 설문 페이지로 돌아가주세요.';
        hint.style.color = 'var(--primary)';
        hint.style.fontWeight = '600';
      }
    }, 500);
  };

  return { init, tryClose };
})();