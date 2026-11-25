const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("score", {
    autoResize: false,
    newSystemFromXML: true,
    newPageFromXML: false,
    defaultFontFamily: "MuseJazz Text"
  });
  osmd.TransposeCalculator = new opensheetmusicdisplay.TransposeCalculator();
  
  const INSTRUMENTS = {
    C:    { semitones: 0, bassClef: false },
    Bb:   { semitones: 2, bassClef: false },
    Eb:   { semitones: 9, bassClef: false },
    bass: { semitones: 0, bassClef: true }
  };
  
  const MAX_OCTAVES = 3;
  
  let currentFile = null;
  let currentInstrument = "C";
  let octaveShift = 0;
  
  function toBassClef(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    doc.querySelectorAll("clef").forEach(clef => {
      const sign = clef.querySelector("sign");
      if (sign && sign.textContent === "G") {
        sign.textContent = "F";
        const line = clef.querySelector("line");
        if (line) line.textContent = "4";
        const oct = clef.querySelector("clef-octave-change");
        if (oct) oct.remove();
      }
    });
    return new XMLSerializer().serializeToString(doc);
  }
  
  function updateOctaveLabel() {
    document.getElementById("octave-label").textContent =
      (octaveShift > 0 ? "+" : "") + octaveShift;
    document.getElementById("octave-up").disabled = octaveShift >= MAX_OCTAVES;
    document.getElementById("octave-down").disabled = octaveShift <= -MAX_OCTAVES;
  }

  
  async function showScore() {
    if (!currentFile) return;
    const inst = INSTRUMENTS[currentInstrument];
    try {
      const res = await fetch("/scores/" + encodeURIComponent(currentFile));
      if (!res.ok) throw new Error("HTTP " + res.status);
      let xml = await res.text();
      if (inst.bassClef) xml = toBassClef(xml);
  
      await document.fonts.load('16px "MuseJazz Text"');
      await osmd.load(xml);
      osmd.Sheet.Transpose = inst.semitones + octaveShift * 12;
      osmd.updateGraphic();
      osmd.zoom = 0.5;
    osmd.render();
    } catch (err) {
      console.error("Could not show score:", err);
    }
  }
  
  function loadScore(file) {
    currentFile = file;
    document.querySelectorAll("#score-links a").forEach(a =>
      a.classList.toggle("active", a.dataset.file === file)
    );
    showScore();
  }
  
  async function buildLinks() {
    const container = document.getElementById("score-links");
    let files = [];
    try {
      const res = await fetch("/api/scores");
      if (!res.ok) throw new Error("HTTP " + res.status);
      files = await res.json();
    } catch (err) {
      console.error("Could not load score list:", err);
      container.textContent = "Could not load scores";
      return;
    }
  
    if (!files.length) {
      container.textContent = "No scores found";
      return;
    }
  
    for (const file of files) {
      const link = document.createElement("a");
      link.href = "#";
      link.dataset.file = file;
      link.textContent = file.replace(/\.musicxml$/i, "");
      link.addEventListener("click", e => {
        e.preventDefault();
        loadScore(file);
      });
      container.appendChild(link);
    }
  
    loadScore(files[0]);
  }
  
  document.querySelectorAll("#instrument-buttons button").forEach(btn => {
    btn.addEventListener("click", () => {
      currentInstrument = btn.dataset.inst;
      document.querySelectorAll("#instrument-buttons button")
        .forEach(b => b.classList.toggle("active", b === btn));
      showScore();
    });
  });
  
  document.getElementById("octave-up").addEventListener("click", () => {
    if (octaveShift < MAX_OCTAVES) {
      octaveShift++;
      updateOctaveLabel();
      showScore();
    }
  });
  
  document.getElementById("octave-down").addEventListener("click", () => {
    if (octaveShift > -MAX_OCTAVES) {
      octaveShift--;
      updateOctaveLabel();
      showScore();
    }
  });
  
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitToPage, 200);
  });
  
  updateOctaveLabel();
  buildLinks();