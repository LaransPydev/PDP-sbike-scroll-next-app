import { gsap } from "gsap";

const stProxy = { frame: 1 };

const tl = gsap.timeline({
  paused: true
});

const PLAY = 2.0;
const PAUSE = 1.5;
let t = 0;

const handleUpdate = () => {
  console.log("time:", tl.time().toFixed(3), "frame:", Math.round(stProxy.frame));
};

const PAUSE_POINTS = [
  { at: 50 },
  { at: 130 }
];

PAUSE_POINTS.forEach(p => {
  tl.to(stProxy, { frame: p.at, duration: PLAY, ease: "none", onUpdate: handleUpdate }, t);
  t += PLAY + PAUSE;
});
tl.to(stProxy, { frame: 200, duration: PLAY, ease: "none", onUpdate: handleUpdate }, t);
t += PLAY;

const SECTIONS = [
  { frameStart: 210, frameEnd: 433 },
  { frameStart: 500, frameEnd: 666 }
];

SECTIONS.forEach((sec, idx) => {
  t += PAUSE;
  tl.to(stProxy, { frame: sec.frameStart, duration: 0.001, ease: "none", onUpdate: handleUpdate }, t);
  tl.to(stProxy, { frame: sec.frameEnd, duration: PLAY * 1.5, ease: "none", onUpdate: handleUpdate }, t + 0.001);
  t += 0.001 + PLAY * 1.5;
});

// simulate scrubbing
tl.progress(0.5); // skip to middle
tl.progress(0.7);
tl.progress(0.9);
tl.progress(1.0);
