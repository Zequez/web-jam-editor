export function changeWorld() {
  const phases = ["🌎", "🌏", "🌍"];

  const metaTag = document.getElementById("world-icon")!;

  let phase = Math.floor(Math.random() * phases.length);

  function doChange() {
    phase = (phase + 1) % phases.length;

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <text y=".9em" font-size="90">${phases[phase]}</text>
    </svg>
  `;

    metaTag.setAttribute(
      "href",
      `data:image/svg+xml,${encodeURIComponent(svg)}`,
    );
  }

  setInterval(() => {
    doChange();
  }, 60000);

  doChange();
}
