(() => {
  const headerSlot = document.querySelector('.shared-header');
  const categoryTargets = Array.from(
    document.querySelectorAll('.work-page [data-category]'),
  );
  const requestedCategory = new URLSearchParams(window.location.search).get(
    'category',
  );
  const activeCategory = categoryTargets.some(
    (target) => target.dataset.category === requestedCategory,
  )
    ? requestedCategory
    : null;

  categoryTargets.forEach((target) => {
    target.hidden = Boolean(
      activeCategory && target.dataset.category !== activeCategory,
    );
  });

  const designWorkScroller = document.querySelector(
    '.design-work-page .main-content',
  );
  if (designWorkScroller) {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    requestAnimationFrame(() => {
      designWorkScroller.scrollTop = -designWorkScroller.scrollHeight;
    });
  }

  const bindCategoryHover = (link) => {
    const target = categoryTargets.find(
      (section) => section.dataset.category === link.dataset.categoryLink,
    );
    if (!target || link.dataset.sectionHoverBound) return;

    link.dataset.sectionHoverBound = 'true';
    const setHighlight = (visible) => {
      target.classList.toggle('category-hover-highlight', visible);
    };
    link.addEventListener('mouseenter', () => setHighlight(true));
    link.addEventListener('mouseleave', () => setHighlight(false));
    link.addEventListener('focus', () => setHighlight(true));
    link.addEventListener('blur', () => setHighlight(false));
  };

  const syncHeaderState = () => {
    if (!headerSlot?.querySelector('.main-nav')) return;

    const activeNav = headerSlot.dataset.activeNav;
    const activeItem = headerSlot
      .querySelector(`[data-nav="${activeNav}"]`)
      ?.closest('li');

    if (activeNav === 'design-work' || activeNav === 'artistic-work') {
      activeItem?.classList.add('submenu-current');
    }

    activeItem?.querySelectorAll('[data-category-link]').forEach((link) => {
      bindCategoryHover(link);
      if (link.dataset.categoryLink === activeCategory) {
        link.classList.add('active-nav');
      }
    });
  };

  if (headerSlot) {
    headerSlot.addEventListener('sharedheader:loaded', syncHeaderState);
    syncHeaderState();
  }

  if (document.querySelector('.work-page .grid-item')) {
    const updateSundialShadow = () => {
      const now = new Date();
      const hours = now.getHours() + now.getMinutes() / 60;
      let skewDeg = -35;
      let shadowLength = 1.1;
      let shadowOpacity = 0.35;

      if (hours >= 6 && hours <= 18) {
        const sunPosition = (hours - 12) / 6;
        skewDeg = sunPosition * -50;
        const altitude = Math.cos(sunPosition * (Math.PI / 2));
        shadowLength = 0.8 + (1 - altitude) * 1.3;
        shadowOpacity = 0.65 + altitude * 0.25;
      }

      document.documentElement.style.setProperty(
        '--shadow-skew',
        `${skewDeg.toFixed(2)}deg`,
      );
      document.documentElement.style.setProperty(
        '--shadow-length',
        shadowLength.toFixed(2),
      );
      document.documentElement.style.setProperty(
        '--shadow-opacity',
        shadowOpacity.toFixed(2),
      );
    };

    updateSundialShadow();
    window.setInterval(updateSundialShadow, 60000);
  }
})();
