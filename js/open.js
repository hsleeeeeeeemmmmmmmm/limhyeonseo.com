const rows = [...document.querySelectorAll('.marquee-row')];
const rootStyles = getComputedStyle(document.documentElement);
const fastestDuration = Number.parseFloat(
  rootStyles.getPropertyValue('--fastest-duration'),
);
const slowestDuration = Number.parseFloat(
  rootStyles.getPropertyValue('--slowest-duration'),
);
const rowDurations = rows.map(
  (_, index) =>
    fastestDuration +
    ((index + Math.random()) / rows.length) *
      (slowestDuration - fastestDuration),
);

for (let index = rowDurations.length - 1; index > 0; index -= 1) {
  const randomIndex = Math.floor(Math.random() * (index + 1));
  [rowDurations[index], rowDurations[randomIndex]] = [
    rowDurations[randomIndex],
    rowDurations[index],
  ];
}

rows.forEach((row, index) => {
  const track = row.querySelector('.track');
  row.classList.add(Math.random() < 0.5 ? 'move-left' : 'move-right');
  track.style.animationDuration = `${rowDurations[index]}s`;
});

const tracks = [...document.querySelectorAll('.track')];
const trackSettings = new Map(
  tracks.map((track) => {
    const baseItems = [...track.children];
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    const baseWidth = baseItems.reduce(
      (width, item) => width + item.getBoundingClientRect().width,
      gap * Math.max(0, baseItems.length - 1),
    );
    const baseDuration = Number.parseFloat(
      getComputedStyle(track).animationDuration,
    );

    return [track, { baseItems, baseWidth, baseDuration }];
  }),
);

function fillTracks() {
  for (const [track, settings] of trackSettings) {
    const rowWidth = track.parentElement.clientWidth;
    if (!settings.baseWidth || !rowWidth) {
      continue;
    }

    const minimumCopies = Math.ceil((rowWidth * 2) / settings.baseWidth);
    const copyCount = Math.max(2, minimumCopies + (minimumCopies % 2));
    const currentCopies = track.children.length / settings.baseItems.length;

    if (
      Number.isInteger(currentCopies) &&
      currentCopies >= copyCount &&
      currentCopies % 2 === 0
    ) {
      continue;
    }

    track.replaceChildren(...settings.baseItems);
    for (let copy = 1; copy < copyCount; copy += 1) {
      settings.baseItems.forEach((item) => track.append(item.cloneNode(true)));
    }

    track.style.animationDuration = `${settings.baseDuration * copyCount}s`;
  }
}

fillTracks();

let resizeFrame;
window.addEventListener('resize', () => {
  window.cancelAnimationFrame(resizeFrame);
  resizeFrame = window.requestAnimationFrame(fillTracks);
});
