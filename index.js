const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("score", {
    autoResize: false,
    newSystemFromXML: true,
    newPageFromXML: false,
    defaultFontFamily: "MuseJazz Text"
});
osmd.TransposeCalculator = new opensheetmusicdisplay.TransposeCalculator();

const INSTRUMENTS = {
    C: {
        semitones: 0,
        bassClef: false
    },
    Bb: {
        semitones: 2,
        bassClef: false
    },
    Eb: {
        semitones: 9,
        bassClef: false
    },
    bass: {
        semitones: 0,
        bassClef: true
    }
};

const MAX_OCTAVES = 3; // how far up or down you can go

const currentFile = "Planet Wisp (Act 1).musicxml";
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
    const label = document.getElementById("octave-label");
    label.textContent = (octaveShift > 0 ? "+" : "") + octaveShift;
    document.getElementById("octave-up").disabled = octaveShift >= MAX_OCTAVES;
    document.getElementById("octave-down").disabled = octaveShift <= -MAX_OCTAVES;
}

async function showScore() {
    const inst = INSTRUMENTS[currentInstrument];
    try {
        const res = await fetch("scores/" + encodeURIComponent(currentFile));
        if (!res.ok) throw new Error("HTTP " + res.status);
        let xml = await res.text();
        if (inst.bassClef) xml = toBassClef(xml);

        await document.fonts.load('16px "MuseJazz Text"');
        await osmd.load(xml);
        osmd.Sheet.Transpose = inst.semitones + octaveShift * 12;
        osmd.updateGraphic();
        osmd.render();
    } catch (err) {
        console.error("Could not show score:", err);
    }
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

updateOctaveLabel();
showScore();