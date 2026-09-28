import { useEffect, useRef } from 'react';

const INTRO_SRC = '/animations/intro.riv';
const INTRO_STATE_MACHINE = 'Intro';
// 2.4s walking, anticipation and kick, exit, then a quiet logo-only hold.
const INTRO_DURATION_MS = 4650;

export default function IntroRive() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = document.querySelector<HTMLElement>('.intro-curtain');
    const layer = document.querySelector<HTMLElement>('.intro-rive');
    const canvas = canvasRef.current;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // BaseLayout writes sessionStorage during the initial HTML pass. Checking
    // the body class instead lets the first hydrated visit still play Rive.
    const alreadySeen = document.body.classList.contains('intro-skip');

    if (!host || !layer || !canvas || reducedMotion || alreadySeen) return;

    let finished = false;
    let fallbackTimer = 0;
    let cleanupTimer = 0;
    let disposed = false;
    let riveInstance: import('@rive-app/canvas').Rive | undefined;
    const finish = () => {
      if (finished || disposed) return;
      finished = true;
      window.clearTimeout(fallbackTimer);
      host.classList.remove('intro-curtain--rive-pending');
      host.classList.add('intro-curtain--rive-done');
      layer.classList.add('is-done');
      cleanupTimer = window.setTimeout(() => {
        host.classList.add('intro-skip');
        riveInstance?.cleanup();
        riveInstance = undefined;
      }, 700);
    };

    const fail = () => {
      if (disposed) return;
      finish();
    };

    // The package ships as CommonJS. Loading it only in the browser avoids
    // Vite SSR trying to resolve its named exports during the server pass.
    void import('@rive-app/canvas')
      .then((module) => {
        if (disposed) return;
        const runtime = (
          'default' in module ? module.default : module
        ) as typeof import('@rive-app/canvas');
        const { Alignment, Fit, Layout, Rive, RuntimeLoader } = runtime;
        RuntimeLoader.setWasmUrl('/animations/rive.wasm');
        riveInstance = new Rive({
          src: INTRO_SRC,
          canvas,
          artboard: window.innerWidth / window.innerHeight < 0.85 ? 'IntroMobile' : 'Intro',
          stateMachine: INTRO_STATE_MACHINE,
          autoplay: true,
          layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
          onLoad: () => {
            if (disposed || finished) return;
            window.clearTimeout(fallbackTimer);
            riveInstance?.resizeDrawingSurfaceToCanvas();
            host.classList.add('intro-curtain--rive-pending');
            layer.classList.add('is-active');
            fallbackTimer = window.setTimeout(finish, INTRO_DURATION_MS);
          },
          onLoadError: fail,
        });
      })
      .catch(fail);

    fallbackTimer = window.setTimeout(finish, 2500);

    const resize = () => riveInstance?.resizeDrawingSurfaceToCanvas();
    window.addEventListener('resize', resize);

    return () => {
      disposed = true;
      window.clearTimeout(fallbackTimer);
      window.clearTimeout(cleanupTimer);
      window.removeEventListener('resize', resize);
      riveInstance?.cleanup();
    };
  }, []);

  return (
    <div className="intro-rive" aria-hidden="true">
      <canvas ref={canvasRef} className="intro-rive__canvas" />
    </div>
  );
}
