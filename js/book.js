pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const pdfPath = urlParams.get('pdf');
  let pdfUrl = pdfPath ? new URL(pdfPath, window.location.href).href : '';

  const loadingText = document.getElementById('loading');
  const flipbookEl = document.getElementById('flipbook');
  const pageCounter = document.getElementById('page-counter');

  if (!pdfPath) {
    if (loadingText)
      loadingText.textContent = 'PDF 경로가 지정되지 않았습니다.';
    return;
  }

  try {
    let pdfDoc;
    try {
      pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;
    } catch (firstError) {
      const requestedUrl = new URL(pdfUrl);
      const requestedPath = requestedUrl.pathname.replace(/^\/+/, '');

      // Also support older links that omitted the common image/ folder.
      if (
        requestedUrl.origin !== window.location.origin ||
        requestedPath.startsWith('image/')
      ) {
        throw firstError;
      }

      pdfUrl = new URL(`image/${requestedPath}`, `${window.location.origin}/`)
        .href;
      pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;
    }
    const totalPages = pdfDoc.numPages;

    const firstPage = await pdfDoc.getPage(1);
    const viewport = firstPage.getViewport({ scale: 1 });
    const pageRatio = viewport.width / viewport.height;
    const stageWidth =
      document.querySelector('.book-stage')?.clientWidth ?? window.innerWidth;
    const bookHeight = Math.min(
      window.innerHeight * 0.75,
      720,
      stageWidth / (2 * pageRatio),
    );
    const bookWidth = bookHeight * pageRatio;

    // 1. 먼저 빈 페이지 껍데기(DIV)를 한 번에 생성해 구조를 잡음
    const pageCanvases = [];
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'my-page';

      const canvas = document.createElement('canvas');
      canvas.className = 'page-canvas';
      pageDiv.appendChild(canvas);
      flipbookEl.appendChild(pageDiv);

      pageCanvases.push({ pageNum, canvas });
    }

    // 2. 단일 페이지 렌더링 함수
    const renderPage = async ({ pageNum, canvas }) => {
      const page = await pdfDoc.getPage(pageNum);
      // 고해상도 배율을 1.5배로 최적화해 렌더링 부하 절감
      const renderViewport = page.getViewport({
        scale: (bookHeight / viewport.height) * 1.5,
      });
      canvas.width = renderViewport.width;
      canvas.height = renderViewport.height;

      const ctx = canvas.getContext('2d');
      return page.render({ canvasContext: ctx, viewport: renderViewport })
        .promise;
    };

    // 3. 앞쪽 표지 및 첫 펼침(1~4페이지)만 우선 즉시 렌더링
    const initialPages = pageCanvases.slice(0, Math.min(4, totalPages));
    await Promise.all(initialPages.map(renderPage));

    // 로딩 숨기고 플립북 인스턴스 즉시 활성화
    if (loadingText) loadingText.style.display = 'none';
    if (flipbookEl) flipbookEl.style.display = 'block';

    const pageFlip = new St.PageFlip(flipbookEl, {
      width: bookWidth,
      height: bookHeight,
      size: 'fixed',
      usePortrait: false,
      useMouseEvents: true,
      showPageCorners: true,
      disableFlipByClick: false,
      drawShadow: true,
      maxShadowOpacity: 0.35,
      showCover: true,
      mobileScrollSupport: false,
    });

    pageFlip.loadFromHTML(document.querySelectorAll('.my-page'));

    const updateCounter = () => {
      const current = pageFlip.getCurrentPageIndex() + 1;
      if (pageCounter) {
        pageCounter.textContent = `Page ${current} / ${totalPages}`;
      }
    };

    pageFlip.on('flip', updateCounter);
    updateCounter();

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') history.back();
    });

    // 4. 나머지 뒤쪽 페이지들은 백그라운드에서 순차적으로 백업 렌더링
    const remainingPages = pageCanvases.slice(4);
    for (const item of remainingPages) {
      await renderPage(item);
    }
  } catch (error) {
    if (loadingText) {
      loadingText.textContent = `PDF 로드 실패 (${pdfUrl}): ${error.message}`;
    }
    console.error('PDF 로드 에러:', error);
  }
});
