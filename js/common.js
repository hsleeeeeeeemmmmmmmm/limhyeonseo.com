const headerSlot = document.querySelector('.shared-header');
const commonScriptUrl = document.currentScript?.src
  ? new URL(document.currentScript.src)
  : new URL('js/common.js', window.location.href);
const siteRootUrl = new URL('../', commonScriptUrl);

const introBio = document.getElementById('intro-bio');
if (introBio && !introBio.dataset.typewriterStarted) {
  introBio.dataset.typewriterStarted = 'true';
  const bioText = `Hello, I am Lim Hyeonseo!

I am a multidisciplinary designer based in The Hague and Seoul, working across brand identity, editorial systems, 3D motion, and creative technology.

My practice is rooted in research and narrative-driven thinking, exploring how design connects people, systems, and an evolving digital landscape. Working fluidly between physical materials—like specialized print and hardware—and digital screens, I translate complex ideas into clear, engaging visual forms.

Rather than seeing design as mere decoration, I approach each project as a way to bring people together: building scalable identities, intuitive publications, and interactive spaces. Across all mediums, my goal is to spark active engagement rather than passive consumption.
`;

  const bioContainer = introBio.parentElement;
  const measureBioHeight = () => {
    const measure = introBio.cloneNode(false);
    measure.textContent = bioText;
    measure.style.visibility = 'hidden';
    measure.style.top = '0px';
    measure.style.left = '0px';
    bioContainer.append(measure);
    const height = measure.offsetHeight;
    measure.remove();
    return height;
  };

  const placeBio = () => {
    const bioHeight = measureBioHeight();
    const maxLeft = Math.max(
      0,
      bioContainer.clientWidth - introBio.offsetWidth,
    );
    const maxTop = Math.max(0, bioContainer.clientHeight - bioHeight);
    introBio.style.setProperty('--bio-left', `${Math.random() * maxLeft}px`);
    introBio.style.setProperty('--bio-top', `${Math.random() * maxTop}px`);
  };

  placeBio();
  window.addEventListener('resize', placeBio);

  const typedText = document.createTextNode('');
  const caret = document.createElement('span');
  caret.className = 'intro-bio-caret';
  caret.setAttribute('aria-hidden', 'true');
  introBio.append(typedText, caret);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    typedText.data = bioText;
    caret.remove();
  } else {
    const characters = Array.from(bioText);
    let index = 0;
    const typeNext = () => {
      if (index >= characters.length) {
        caret.remove();
        return;
      }

      const character = characters[index++];
      typedText.data += character;
      const pause = /[.!?]/.test(character)
        ? 160 + Math.random() * 220
        : character === '\n'
          ? 90 + Math.random() * 150
          : character === ','
            ? 80 + Math.random() * 120
            : character === ' '
              ? 10 + Math.random() * 22
              : 14 + Math.random() * 28;
      window.setTimeout(typeNext, pause);
    };

    window.setTimeout(typeNext, 250 + Math.random() * 400);
  }
}

if (headerSlot) {
  fetch(new URL('common.html?v=design-category-order-20261010', siteRootUrl))
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Could not load common.html: ${response.status}`);
      }
      return response.text();
    })
    .then((markup) => {
      headerSlot.innerHTML = markup;

      // 링크 및 상대 경로 보정
      headerSlot.querySelectorAll('[href]').forEach((link) => {
        const href = link.getAttribute('href');
        if (href && !/^(?:[a-z]+:|\/|#)/i.test(href)) {
          link.setAttribute('href', new URL(href, siteRootUrl));
        }
      });

      const activeNav = headerSlot.dataset.activeNav;
      const activeLink = headerSlot.querySelector(`[data-nav="${activeNav}"]`);
      activeLink?.classList.add('active-nav');

      if (
        headerSlot.dataset.subnavEnabled === 'true' ||
        activeNav === 'cv' ||
        activeNav === 'design-work' ||
        activeNav === 'artistic-work'
      ) {
        headerSlot.querySelectorAll('.main-nav > ul > li').forEach((item) => {
          const trigger = item.querySelector(':scope > a');
          const submenu = item.querySelector(':scope > .nav-subnav');
          if (!trigger || !submenu) return;

          let closeTimer;
          const openSubmenu = () => {
            clearTimeout(closeTimer);
            item.classList.add('submenu-open');
          };
          const scheduleClose = () => {
            clearTimeout(closeTimer);
            closeTimer = setTimeout(() => {
              if (
                !item.classList.contains('submenu-current') &&
                !trigger.matches(':hover') &&
                !submenu.matches(':hover')
              ) {
                item.classList.remove('submenu-open');
              }
            }, 180);
          };

          trigger.addEventListener('mouseenter', openSubmenu);
          trigger.addEventListener('mouseleave', scheduleClose);
          submenu.addEventListener('mouseenter', openSubmenu);
          submenu.addEventListener('mouseleave', scheduleClose);
          item.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
              item.classList.remove('submenu-open');
              trigger.focus();
            }
          });
        });
      }

      const hoverPreview = document.getElementById('intro-hover-preview');

      if (hoverPreview) {
        const faceImages = {
          default: 'image/hy face/Kinh.png',
          logo: 'image/hy face/western african.png', // Lim Hyeonseo
          cv: 'image/hy face/Scandinavian.png', // CV
          design: 'image/hy face/asian.png', // Design Work
          artistic: 'image/hy face/northern indian.png', // Artistic Project
        };

        // 단일 이미지 생성
        const previewImg = document.createElement('img');
        previewImg.className = 'intro-face-preview__image';
        previewImg.alt = 'Face Preview';
        previewImg.src = new URL(faceImages.default, siteRootUrl);

        hoverPreview.replaceChildren(previewImg);

        let revertTimer = null;

        // 이미지 즉시 변경 및 복귀 타이머 취소
        const setPreview = (key) => {
          if (revertTimer) {
            clearTimeout(revertTimer);
            revertTimer = null;
          }
          const targetPath = faceImages[key] || faceImages.default;
          previewImg.src = new URL(targetPath, siteRootUrl);
        };

        // 3초 대기 후 0.png 복귀 타이머 시작
        const startRevertTimer = () => {
          if (revertTimer) clearTimeout(revertTimer);
          revertTimer = setTimeout(() => {
            previewImg.src = new URL(faceImages.default, siteRootUrl);
          }, 3000);
        };

        // 복귀 타이머 일시 정지 (사진 영역 또는 텍스트 컨테이너 위에 머물 때)
        const keepCurrentPreview = () => {
          if (revertTimer) {
            clearTimeout(revertTimer);
            revertTimer = null;
          }
        };

        // 1. 사진이 표시되는 컨테이너 자체에 호버 연결
        hoverPreview.addEventListener('mouseenter', keepCurrentPreview);
        hoverPreview.addEventListener('mouseleave', startRevertTimer);

        // 2. Logo 컨테이너
        const logoContainer = headerSlot.querySelector('.logo');
        if (logoContainer) {
          logoContainer.addEventListener('mouseenter', () =>
            setPreview('logo'),
          );
          logoContainer.addEventListener('mouseleave', startRevertTimer);
        }

        // 3. Navigation 각 메뉴 컨테이너
        const navItems =
          headerSlot.querySelectorAll('.main-nav li').length > 0
            ? headerSlot.querySelectorAll('.main-nav li')
            : headerSlot.querySelectorAll('.main-nav a');

        navItems.forEach((item) => {
          const link = item.tagName === 'A' ? item : item.querySelector('a');
          const navAttr = (
            link?.dataset.nav ||
            link?.dataset.hoverPreview ||
            ''
          ).toLowerCase();
          const itemText = (link?.textContent || item.textContent || '')
            .trim()
            .toLowerCase();

          item.addEventListener('mouseenter', () => {
            if (navAttr.includes('cv') || itemText.includes('cv')) {
              setPreview('cv');
            } else if (
              navAttr.includes('design') ||
              itemText.includes('design')
            ) {
              setPreview('design');
            } else if (
              navAttr.includes('artistic') ||
              itemText.includes('artistic')
            ) {
              setPreview('artistic');
            }
          });

          item.addEventListener('mouseleave', startRevertTimer);
        });
      }

      headerSlot.dispatchEvent(new Event('sharedheader:loaded'));
    })
    .catch((error) => console.error(error));
}
