import { useCallback, useEffect, useRef, useState, type ReactNode, type TouchEvent, type WheelEvent } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import portraitImage from '@assets/IMG-20260911-WA3730_1789193689811.jpg';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function LiquidPortal({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false });
    if (!gl) return;

    const vertexSource = `
      attribute vec2 position;
      varying vec2 uv;
      void main() {
        uv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;
    const fragmentSource = `
      precision mediump float;
      varying vec2 uv;
      uniform float uTime;
      uniform float uProgress;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      void main() {
        vec2 centered = uv - 0.5;
        float distanceFromCenter = length(centered);
        float grain = hash(floor(uv * 18.0 + uTime * 0.4));
        float wave = sin(distanceFromCenter * 30.0 - uTime * 7.0 + grain * 4.0) * 0.024;
        float radius = uProgress * 0.92;
        float bloom = 1.0 - smoothstep(radius - 0.22, radius + 0.05, distanceFromCenter + wave);
        float edge = 1.0 - smoothstep(0.02, 0.14, abs(distanceFromCenter - radius + wave));
        float burst = smoothstep(0.18, 0.0, distanceFromCenter) * (0.25 + grain * 0.55);
        vec3 cream = vec3(0.91, 0.86, 0.74);
        vec3 lake = vec3(0.20, 0.42, 0.48);
        vec3 rust = vec3(0.64, 0.25, 0.18);
        vec3 ochre = vec3(0.88, 0.62, 0.24);
        vec3 ink = mix(lake, rust, smoothstep(0.1, 0.7, uv.x + sin(uTime) * 0.18));
        ink = mix(ink, ochre, smoothstep(0.32, 0.9, grain + uv.y * 0.3));
        vec3 color = mix(cream, ink, clamp(bloom * 0.9 + edge * 0.76 + burst, 0.0, 1.0));
        float alpha = clamp(bloom * 0.88 + edge * 0.7 + burst, 0.0, 1.0);
        gl_FragColor = vec4(color, alpha);
      }
    `;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.useProgram(program);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const timeLocation = gl.getUniformLocation(program, 'uTime');
    const progressLocation = gl.getUniformLocation(program, 'uProgress');
    const startedAt = performance.now();
    let animationFrame = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const render = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / 1180, 1);
      gl.uniform1f(timeLocation, elapsed / 1000);
      gl.uniform1f(progressLocation, progress);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (progress < 1) animationFrame = requestAnimationFrame(render);
    };
    resize();
    window.addEventListener('resize', resize);
    animationFrame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [active]);

  return <canvas ref={canvasRef} className="liquid-portal-canvas" aria-hidden="true" />;
}

function Home() {
  const [chapter, setChapter] = useState(0);
  const [portalOpen, setPortalOpen] = useState(false);
  const touchStart = useRef<number | null>(null);
  const wheelLock = useRef(false);
  const totalChapters = 6;

  const goTo = useCallback((index: number) => {
    setChapter(Math.max(0, Math.min(totalChapters - 1, index)));
  }, []);

  const next = useCallback(() => goTo(chapter + 1), [chapter, goTo]);
  const previous = useCallback(() => goTo(chapter - 1), [chapter, goTo]);
  const openPortal = useCallback(() => {
    if (portalOpen) return;
    setPortalOpen(true);
    window.setTimeout(() => {
      setPortalOpen(false);
      goTo(1);
    }, 1360);
  }, [goTo, portalOpen]);

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchStart.current = event.changedTouches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (touchStart.current === null) return;
    const distance = (event.changedTouches[0]?.clientY ?? 0) - touchStart.current;
    touchStart.current = null;
    if (Math.abs(distance) < 40) return;
    if (distance < 0) next();
    else previous();
  };

  const handleWheel = (event: WheelEvent<HTMLElement>) => {
    if (wheelLock.current || Math.abs(event.deltaY) < 12) return;
    wheelLock.current = true;
    if (event.deltaY > 0) next();
    else previous();
    window.setTimeout(() => { wheelLock.current = false; }, 760);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault();
        next();
      }
      if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault();
        previous();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [next, previous]);

  const chapters = [
    { id: 'opening', label: 'Opening' },
    { id: 'letter', label: 'A letter' },
    { id: 'recognition', label: 'Recognition' },
    { id: 'portrait', label: 'Portrait' },
    { id: 'memories', label: 'Little things' },
    { id: 'birthday', label: 'Birthday' },
  ];

  return (
    <main
      className={`heirloom-app ${portalOpen ? 'is-portal-open' : ''}`}
      data-testid="experience-nandini-birthday"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div className="chapter-stage" data-testid="chapter-stage">
        <svg className="liquid-defs" aria-hidden="true">
          <defs>
            <filter id="portrait-liquid-filter" x="-12%" y="-12%" width="124%" height="124%">
              <feTurbulence type="fractalNoise" baseFrequency="0.014 0.035" numOctaves="2" seed="7" result="liquid-noise">
                <animate attributeName="baseFrequency" dur="8s" values="0.014 0.035;0.03 0.012;0.014 0.035" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="liquid-noise" scale="8" xChannelSelector="R" yChannelSelector="G">
                <animate attributeName="scale" dur="6s" values="5;13;5" repeatCount="indefinite" />
              </feDisplacementMap>
            </filter>
          </defs>
        </svg>
        <section className={`chapter chapter--welcome ${chapter === 0 ? 'is-active' : ''}`} aria-hidden={chapter !== 0} data-testid="chapter-opening">
          <div className="welcome-mark" aria-hidden="true" />
          <div className="welcome-hearts" aria-hidden="true">
            <svg className="welcome-heart heart-main" viewBox="0 0 100 90">
              <path d="M50 82C42 73 11 54 8 31 5 10 30 3 44 18c4 4 6 10 6 10s2-6 6-10C70 3 95 10 92 31c-3 23-34 42-42 51Z" />
            </svg>
            <svg className="welcome-heart heart-small heart-small-one" viewBox="0 0 100 90">
              <path d="M50 82C42 73 11 54 8 31 5 10 30 3 44 18c4 4 6 10 6 10s2-6 6-10C70 3 95 10 92 31c-3 23-34 42-42 51Z" />
            </svg>
            <svg className="welcome-heart heart-small heart-small-two" viewBox="0 0 100 90">
              <path d="M50 82C42 73 11 54 8 31 5 10 30 3 44 18c4 4 6 10 6 10s2-6 6-10C70 3 95 10 92 31c-3 23-34 42-42 51Z" />
            </svg>
          </div>
          <div className="ink-reveal">
            <p className="eyebrow" data-testid="text-opening-eyebrow">TO MY FAVORITE PERSON • 24th December</p>
            <h1 className="chapter-title" data-testid="text-opening-title">For You.</h1>
            <p className="chapter-copy small" data-testid="text-opening-copy">A few things I’ve been holding in my heart.</p>
            <button className="double-button ready-button" type="button" onClick={openPortal} data-testid="button-ready">
              Ready
            </button>
          </div>
          <div className="chapter-footer">
            <span data-testid="status-opening-chapter">Chapter 01 / 06</span>
            <span data-testid="text-opening-note">YOURS ALWAYS</span>
          </div>
        </section>

        <section className={`chapter ${chapter === 1 ? 'is-active' : ''}`} aria-hidden={chapter !== 1} data-testid="chapter-letter">
          <div className="ink-reveal">
            <p className="eyebrow" data-testid="text-letter-eyebrow">The first page</p>
            <h2 className="chapter-title" data-testid="text-letter-title">mi amor,</h2>
            <div className="letter-rule" aria-hidden="true" />
            <p className="chapter-copy small" data-testid="text-letter-copy">
              <span className="letter-initial">I</span> am not always the best at saying everything I feel out loud. So I wanted to put it all down here instead. Just a quiet place to remind you exactly how much you mean to me.
            </p>
          </div>
          <div className="letter-keepsake" aria-hidden="true">
            <div className="keepsake-card">
              <span className="keepsake-label">for later</span>
              <span className="keepsake-mark">N</span>
            </div>
            <span className="keepsake-caption">read this slowly</span>
          </div>
          <div className="chapter-footer">
            <span data-testid="status-letter-chapter">Chapter 02 / 06</span>
            <button className="footer-next" type="button" onClick={next} data-testid="button-letter-next">Turn the page <span aria-hidden="true">→</span></button>
          </div>
        </section>

        <section className={`chapter chapter--dark chapter--recognition ${chapter === 2 ? 'is-active' : ''}`} aria-hidden={chapter !== 2} data-testid="chapter-recognition">
          <div className="reveal-orbit" aria-hidden="true" />
          <div className="ink-reveal">
            <p className="eyebrow" data-testid="text-recognition-eyebrow">A SIMPLE TRUTH</p>
            <p className="chapter-copy" data-testid="text-recognition-quote">“No matter how many people I cross paths with, my eyes and heart will only ever look for you.”</p>
            <p className="chapter-copy small" data-testid="text-recognition-copy">You didn&apos;t just walk into my life—you became the best part of it.</p>
          </div>
          <div className="recognition-photo" data-testid="recognition-photo">
            <div className="liquid-photo-frame">
              <div className="liquid-photo-blob blob-a" aria-hidden="true" />
              <div className="liquid-photo-blob blob-b" aria-hidden="true" />
              <div className="liquid-photo-sheen" aria-hidden="true" />
              <img src={portraitImage} className="recognition-image" alt="Nandini, softly revealed through a liquid watercolor effect" data-testid="img-recognition-portrait" />
              <span className="liquid-photo-ring" aria-hidden="true" />
            </div>
            <p className="recognition-caption" data-testid="text-recognition-caption">Somehow, it was always you.</p>
          </div>
          <div className="chapter-footer">
            <span data-testid="status-recognition-chapter">Chapter 03 / 06</span>
            <button className="footer-next" type="button" onClick={next} data-testid="button-recognition-next">Keep going <span aria-hidden="true">→</span></button>
          </div>
        </section>

        <section className={`chapter ${chapter === 3 ? 'is-active' : ''}`} aria-hidden={chapter !== 3} data-testid="chapter-portrait">
          <div className="watercolor" aria-label="Watercolor portrait of Nandini with a soft paint-dissolve effect" data-testid="artwork-nandini-portrait">
            <img className="portrait-image" src={portraitImage} alt="Nandini smiling in a red patterned outfit" data-testid="img-nandini-portrait" />
          </div>
          <div className="ink-reveal" style={{ position: 'relative', zIndex: 1 }}>
            <p className="eyebrow" data-testid="text-portrait-eyebrow">IN SIMPLE WORDS</p>
            <h2 className="chapter-title" data-testid="text-portrait-title">One smile from you changes everything.</h2>
            <p className="chapter-copy small" data-testid="text-portrait-copy">No matter how chaotic my day gets, just thinking of you brings me instant peace.</p>
          </div>
          <div className="chapter-footer">
            <span data-testid="status-portrait-chapter">Chapter 04 / 06</span>
            <button className="footer-next" type="button" onClick={next} data-testid="button-portrait-next">A few details <span aria-hidden="true">→</span></button>
          </div>
        </section>

        <section className={`chapter ${chapter === 4 ? 'is-active' : ''}`} aria-hidden={chapter !== 4} data-testid="chapter-memories">
          <div className="ink-reveal">
            <p className="eyebrow" data-testid="text-memories-eyebrow">FEW THINGS TO REMEMBER</p>
            <h2 className="chapter-title" data-testid="text-memories-title">Promises from my heart.</h2>
            <p className="chapter-copy small" data-testid="text-memories-copy">Small truths, pressed between the pages for later.</p>
          </div>
          <div className="memory-grid" data-testid="memory-grid">
            <div className="memory-note" data-testid="memory-note-01">Your happiness will always be my main priority.</div>
            <div className="memory-note" data-testid="memory-note-02">My future only looks beautiful because you are in it.</div>
            <div className="memory-note" data-testid="memory-note-03">No matter where life takes us, I’m right here with you.</div>
            <div className="memory-note" data-testid="memory-note-04">I don&apos;t just want you for today; I am looking forward to a whole life with you.</div>
          </div>
          <div className="chapter-footer">
            <span data-testid="status-memories-chapter">Chapter 05 / 06</span>
            <button className="footer-next" type="button" onClick={next} data-testid="button-memories-next">The last page <span aria-hidden="true">→</span></button>
          </div>
        </section>

        <section className={`chapter chapter--dark final-message ${chapter === 5 ? 'is-active' : ''}`} aria-hidden={chapter !== 5} data-testid="chapter-birthday">
          <div className="final-atmosphere" aria-hidden="true">
            <span className="final-orb orb-one" />
            <span className="final-orb orb-two" />
            <span className="final-ring ring-one" />
            <span className="final-ring ring-two" />
            <span className="final-star star-one" />
            <span className="final-star star-two" />
          </div>
          <div className="ink-reveal">
            <p className="eyebrow" data-testid="text-birthday-eyebrow">TO MY FAVORITE PERSON</p>
            <h2 className="chapter-title" data-testid="text-birthday-title">Happy<br />birthday,<br />Nandini.</h2>
            <p className="chapter-copy small" data-testid="text-birthday-copy">I wish you the best of health, endless happiness, and all the success you deserve. May every dream you chase this turn into reality. May you got lots of reasons to smile, and whatever you are wishing for, I hope it comes true.</p>
            <p className="signature" data-testid="text-birthday-signature">
              with all my love,<br />
              <span className="signature-name">Manish</span>
            </p>
            <button className="double-button" type="button" onClick={() => goTo(0)} data-testid="button-read-again">Read it again</button>
          </div>
          <div className="chapter-footer">
            <span data-testid="status-birthday-chapter">Chapter 06 / 06</span>
            <span data-testid="text-birthday-note">Keep this close</span>
          </div>
        </section>
      </div>

      <div className="portal-overlay" aria-hidden={!portalOpen}>
        <LiquidPortal active={portalOpen} />
        <div className="portal-wash wash-one" />
        <div className="portal-wash wash-two" />
        <div className="portal-wash wash-three" />
        <div className="portal-wash wash-four" />
        <div className="portal-rinse" />
        <span className="portal-caption">turning the page</span>
      </div>

      <nav className="progress-rail" aria-label="Letter chapters" data-testid="navigation-chapters">
        {chapters.map((item, index) => (
          <button
            key={item.id}
            className={`progress-dot ${chapter === index ? 'is-current' : ''}`}
            type="button"
            aria-label={`Go to ${item.label}`}
            aria-current={chapter === index ? 'step' : undefined}
            onClick={() => goTo(index)}
            data-testid={`button-chapter-${item.id}`}
          />
        ))}
      </nav>
      <p className="swipe-hint" data-testid="text-swipe-hint">Swipe up to continue</p>
    </main>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
