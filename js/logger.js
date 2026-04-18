// ===== LOGGER =====
// Google Apps Script 웹앱으로 로그 전송

const Logger = (() => {
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbzXWTF9tA3kdWd2oVLa_u-23xgWqiLlz2RxI9vdWmMuBJjBYCUwStOEBe5AvhIwG5qI/exec';

  const send = async (type, payload) => {
    try {
      await fetch(ENDPOINT, {
        method: 'POST',
        mode: 'no-cors', // Apps Script CORS 우회
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload }),
      });
    } catch (e) {
      console.warn('[Logger] 전송 실패:', e);
    }
  };

  // 세션 종료 시 한 번 전송
  const logSession = async () => {
    const sessionId = State.getSessionId();
    if (!sessionId) return;

    await send('session', {
      session_id: sessionId,
      start_time: State.getStartTime(),
      end_time: new Date().toISOString(),
      duration_sec: State.getDurationSec(),
    });
  };

  // 상품 클릭 시마다 전송
  const logClick = async (productId) => {
    const sessionId = State.getSessionId();
    if (!sessionId) return;

    const entry = State.addClick(productId);
    await send('click', {
      session_id: sessionId,
      product_id: entry.product_id,
      clicked_at: entry.clicked_at,
      click_order: entry.click_order,
    });
  };

  // 결제 완료 시 전송
  const logCheckout = async (productId, quantity, finalPrice) => {
    const sessionId = State.getSessionId();
    if (!sessionId) return;

    await send('checkout', {
      session_id: sessionId,
      product_id: productId,
      quantity,
      final_price: finalPrice,
      checked_out_at: new Date().toISOString(),
    });
  };

  return { logSession, logClick, logCheckout };
})();
