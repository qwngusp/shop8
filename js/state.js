// ===== STATE MANAGEMENT =====
// sessionStorage 기반 전역 상태 관리

const State = (() => {
  const KEYS = {
    SESSION_ID: 'shop_session_id',
    START_TIME: 'shop_start_time',
    CART: 'shop_cart',
    CLICK_LOG: 'shop_click_log',
    COUPON: 'shop_coupon',
  };

  // 내부 get/set 헬퍼
  const get = (key) => {
    try {
      const val = sessionStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  };

  const set = (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('sessionStorage 저장 실패:', e);
    }
  };

  // ── 세션 ID ──────────────────────────────────
  const getSessionId = () => get(KEYS.SESSION_ID);

  const createSessionId = (birthdate, gender) => {
    // 생년월일(8자리) + 성별(남자=0, 여자=1) + 난수(4자리)
    const rand = Math.floor(1000 + Math.random() * 9000);
    const id = `${birthdate}${gender}${rand}`;
    set(KEYS.SESSION_ID, id);
    return id;
  };

  // ── 체류 시간 ─────────────────────────────────
  const startTimer = () => {
    if (!get(KEYS.START_TIME)) {
      set(KEYS.START_TIME, new Date().toISOString());
    }
  };

  const getStartTime = () => get(KEYS.START_TIME);

  const getDurationSec = () => {
    const start = get(KEYS.START_TIME);
    if (!start) return 0;
    return Math.floor((Date.now() - new Date(start).getTime()) / 1000);
  };

  // ── 상품 클릭 로그 ────────────────────────────
  const getClickLog = () => get(KEYS.CLICK_LOG) || [];

  const addClick = (productId) => {
    const log = getClickLog();
    const entry = {
      product_id: productId,
      clicked_at: new Date().toISOString(),
      click_order: log.length + 1,
    };
    log.push(entry);
    set(KEYS.CLICK_LOG, log);
    return entry;
  };

  // ── 장바구니 ──────────────────────────────────
  const getCart = () => get(KEYS.CART) || [];

  const addToCart = (product, option, quantity, unitPrice) => {
    // unitPrice: 쿠폰 적용 여부가 반영된 최종 단가 (없으면 고정가 10000 사용)
    const price = unitPrice !== undefined ? unitPrice : 10000;
    const shippingFee = product.shippingFee !== undefined ? product.shippingFee : 0;
    const cart = getCart();
    const existing = cart.findIndex(
      (item) => item.productId === product.id && item.option === option
    );
    if (existing >= 0) {
      cart[existing].quantity += quantity;
      cart[existing].unitPrice = price; // 단가 최신화
      cart[existing].totalPrice = price * cart[existing].quantity;
      cart[existing].shippingFee = shippingFee;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        image: product.image,
        option,
        quantity,
        unitPrice: price,
        totalPrice: price * quantity,
        shippingFee,
      });
    }
    set(KEYS.CART, cart);
    return cart;
  };

  // 장바구니 전체 배송비 합계 (같은 productId는 한 번만 계산)
  const getCartShipping = () => {
    const cart = getCart();
    const seen = new Set();
    return cart.reduce((sum, item) => {
      if (!seen.has(item.productId)) {
        seen.add(item.productId);
        return sum + (item.shippingFee || 0);
      }
      return sum;
    }, 0);
  };

  const removeCartItem = (index) => {
    const cart = getCart();
    cart.splice(index, 1);
    set(KEYS.CART, cart);
  };

  const getCartCount = () => {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
  };

  const getCartTotal = () => {
    return getCart().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const clearCart = () => set(KEYS.CART, []);

  // ── 쿠폰 ──────────────────────────────────────
  const getCoupon = () => get(KEYS.COUPON);

  const applyCoupon = (coupon) => set(KEYS.COUPON, coupon);

  const removeCoupon = () => sessionStorage.removeItem(KEYS.COUPON);

  // ── 전체 초기화 ───────────────────────────────
  const clear = () => {
    Object.values(KEYS).forEach((k) => sessionStorage.removeItem(k));
  };

  return {
    getSessionId,
    createSessionId,
    startTimer,
    getStartTime,
    getDurationSec,
    getClickLog,
    addClick,
    getCart,
    addToCart,
    getCartCount,
    getCartTotal,
    getCartShipping,
    removeCartItem,
    clearCart,
    getCoupon,
    applyCoupon,
    removeCoupon,
    clear,
  };
})();