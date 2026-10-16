document.addEventListener('DOMContentLoaded', () => {
  const detailScroller = document.querySelector('.work-detail-scroll');
  const mainContainer = document.querySelector('.work-detail-main');

  if (!detailScroller) return;

  // 1. 끝 도달 여부 체크 함수 (그라데이션 온/오프 제어)
  const updateScrollEndState = () => {
    if (!mainContainer) return;

    // 최대 스크롤 가능 범위
    const maxScrollLeft =
      detailScroller.scrollWidth - detailScroller.clientWidth;

    // 브라우저 렌더링 오차를 감안해 20px 여유를 둠
    if (maxScrollLeft <= 5 || detailScroller.scrollLeft >= maxScrollLeft - 20) {
      mainContainer.classList.add('is-at-end');
    } else {
      mainContainer.classList.remove('is-at-end');
    }
  };

  // 2. 휠 이벤트 제어 (텍스트 영역 위에서는 세로 휠 허용, 그 외에는 가로 스크롤 전환)
  detailScroller.addEventListener(
    'wheel',
    (event) => {
      const textBody = event.target.closest('.copy-body');
      if (textBody) {
        return; // 텍스트 위에서는 브라우저 세로 휠 허용
      }

      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        detailScroller.scrollLeft += event.deltaY;
        updateScrollEndState();
      }
    },
    { passive: false },
  );

  // 3. 마우스 드래그 앤 스크롤 (링크 클릭 방해 방지)
  let isDragging = false;
  let dragStartX = 0;
  let dragStartScrollLeft = 0;
  let hasMoved = false;

  detailScroller.addEventListener('pointerdown', (event) => {
    // 텍스트 영역 또는 링크(a 태그)를 누를 때는 드래그 캡처를 걸지 않고 기본 클릭 보장
    if (event.target.closest('.copy-body') || event.target.closest('a')) return;
    if (event.pointerType !== 'mouse' || event.button !== 0) return;

    isDragging = true;
    hasMoved = false;
    dragStartX = event.clientX;
    dragStartScrollLeft = detailScroller.scrollLeft;
    detailScroller.classList.add('is-dragging');
    detailScroller.setPointerCapture(event.pointerId);
  });

  detailScroller.addEventListener('pointermove', (event) => {
    if (isDragging) {
      const distance = event.clientX - dragStartX;
      if (Math.abs(distance) > 5) {
        hasMoved = true;
      }
      detailScroller.scrollLeft = dragStartScrollLeft - distance;
      updateScrollEndState();
    }
  });

  const stopDragging = (event) => {
    if (isDragging) {
      isDragging = false;
      detailScroller.classList.remove('is-dragging');
      if (event && detailScroller.hasPointerCapture(event.pointerId)) {
        detailScroller.releasePointerCapture(event.pointerId);
      }
      updateScrollEndState();
    }
  };

  detailScroller.addEventListener('pointerup', stopDragging);
  detailScroller.addEventListener('pointercancel', stopDragging);

  // 링크 내부를 클릭했을 때 드래그가 아니었다면 자연스러운 페이지 이동 허용
  detailScroller.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (hasMoved) {
        e.preventDefault();
      }
    });
  });

  // 네이티브 스크롤 및 브라우저 크기 변경 감지
  detailScroller.addEventListener('scroll', updateScrollEndState, {
    passive: true,
  });
  window.addEventListener('resize', updateScrollEndState);

  // 이미지 렌더링 완료 후 재측정 (초기 너비 오차 방지)
  window.addEventListener('load', updateScrollEndState);
  setTimeout(updateScrollEndState, 300);

  // 4. 텍스트 조건부 무한 루프 자동 스크롤
  initResponsiveTextScroll();
});

function initResponsiveTextScroll() {
  const copyBody = document.querySelector('.work-detail-copy .copy-body');
  if (!copyBody) return;

  const originalHTML = copyBody.innerHTML.trim();
  const loopGap = 28;
  const scrollSpeed = 0.35;

  let isHovered = false;
  let scrollPos = 0;
  let isLoopingActive = false;
  let animationFrameId = null;

  copyBody.addEventListener('mouseenter', () => {
    isHovered = true;
  });

  copyBody.addEventListener('mouseleave', () => {
    isHovered = false;
    scrollPos = copyBody.scrollTop;
  });

  copyBody.addEventListener(
    'scroll',
    () => {
      if (isHovered) {
        scrollPos = copyBody.scrollTop;
      }
    },
    { passive: true },
  );

  function updateScrollState() {
    const wasLooping = isLoopingActive;
    if (wasLooping) {
      cancelAnimationFrame(animationFrameId);
      copyBody.innerHTML = originalHTML;
      copyBody.scrollTop = 0;
      scrollPos = 0;
    }

    const isActuallyOverflowing =
      copyBody.scrollHeight > copyBody.clientHeight + 4;

    if (isActuallyOverflowing) {
      isLoopingActive = true;
      copyBody.innerHTML = `
        <div class="copy-loop-wrapper">
          <div class="loop-segment segment-1">${originalHTML}</div>
          <div class="loop-segment segment-2" aria-hidden="true" style="margin-top: ${loopGap}px;">${originalHTML}</div>
        </div>
      `;

      const segment1 = copyBody.querySelector('.segment-1');

      function runLoop() {
        if (!isLoopingActive) return;

        const singleSetHeight = segment1.offsetHeight + loopGap;

        if (!isHovered) {
          scrollPos += scrollSpeed;
          if (scrollPos >= singleSetHeight) {
            scrollPos -= singleSetHeight;
          }
          copyBody.scrollTop = scrollPos;
        }

        animationFrameId = requestAnimationFrame(runLoop);
      }

      animationFrameId = requestAnimationFrame(runLoop);
    } else {
      isLoopingActive = false;
      copyBody.innerHTML = originalHTML;
      copyBody.scrollTop = 0;
      scrollPos = 0;
    }
  }

  updateScrollState();
  window.addEventListener('resize', updateScrollState);
}
