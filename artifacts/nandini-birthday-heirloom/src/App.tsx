import { useCallback, useEffect, useRef, useState, type ReactNode, type TouchEvent, type WheelEvent } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

function Home() {
  const [chapter, setChapter] = useState(0);
  const touchStart = useRef<number | null>(null);
  const wheelLock = useRef(false);
  const totalChapters = 6;

  const goTo = useCallback((index: number) => {
    setChapter(Math.max(0, Math.min(totalChapters - 1, index)));
  }, []);

  const next = useCallback(() => goTo(chapter + 1), [chapter, goTo]);
  const previous = useCallback(() => goTo(chapter - 1), [chapter, goTo]);

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
      className="heirloom-app"
      data-testid="experience-nandini-birthday"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div className="chapter-stage" data-testid="chapter-stage">
        <section className={`chapter chapter--welcome ${chapter === 0 ? 'is-active' : ''}`} aria-hidden={chapter !== 0} data-testid="chapter-opening">
          <div className="welcome-mark" aria-hidden="true" />
          <div className="ink-reveal">
            <p className="eyebrow" data-testid="text-opening-eyebrow">A small archive · 19 June</p>
            <h1 className="chapter-title" data-testid="text-opening-title">For<br />Nandini.</h1>
            <p className="chapter-copy small" data-testid="text-opening-copy">Some things are better opened slowly.</p>
            <button className="double-button" type="button" onClick={next} data-testid="button-open-letter">
              Open the letter
            </button>
          </div>
          <div className="chapter-footer">
            <span data-testid="status-opening-chapter">Chapter 01 / 06</span>
            <span data-testid="text-opening-note">Made for one person</span>
          </div>
        </section>

        <section className={`chapter ${chapter === 1 ? 'is-active' : ''}`} aria-hidden={chapter !== 1} data-testid="chapter-letter">
          <div className="ink-reveal">
            <p className="eyebrow" data-testid="text-letter-eyebrow">The first page</p>
            <h2 className="chapter-title" data-testid="text-letter-title">Dear<br />Nandini,</h2>
            <div className="letter-rule" aria-hidden="true" />
            <p className="chapter-copy small" data-testid="text-letter-copy">
              <span className="letter-initial">I</span> wanted to give you something that could not be wrapped, put in a bag, or finished in a single glance.
            </p>
          </div>
          <div className="chapter-footer">
            <span data-testid="status-letter-chapter">Chapter 02 / 06</span>
            <button className="footer-next" type="button" onClick={next} data-testid="button-letter-next">Turn the page <span aria-hidden="true">→</span></button>
          </div>
        </section>

        <section className={`chapter chapter--dark ${chapter === 2 ? 'is-active' : ''}`} aria-hidden={chapter !== 2} data-testid="chapter-recognition">
          <div className="reveal-orbit" aria-hidden="true" />
          <div className="ink-reveal">
            <p className="eyebrow" data-testid="text-recognition-eyebrow">A fact I keep returning to</p>
            <p className="chapter-copy" data-testid="text-recognition-quote">“Out of eight billion people on this Earth, my heart only ever recognized you.”</p>
            <p className="chapter-copy small" data-testid="text-recognition-copy">Not loudly. Not all at once. Just with the quiet certainty of something finding its way home.</p>
          </div>
          <div className="chapter-footer">
            <span data-testid="status-recognition-chapter">Chapter 03 / 06</span>
            <button className="footer-next" type="button" onClick={next} data-testid="button-recognition-next">Keep going <span aria-hidden="true">→</span></button>
          </div>
        </section>

        <section className={`chapter ${chapter === 3 ? 'is-active' : ''}`} aria-hidden={chapter !== 3} data-testid="chapter-portrait">
          <div className="watercolor" aria-label="Abstract watercolor portrait in slate blue, rust, and ochre" data-testid="artwork-abstract-portrait">
            <div className="watercolor-shape one" />
            <div className="watercolor-shape two" />
            <div className="watercolor-shape three" />
            <div className="watercolor-shape four" />
            <div className="portrait-line" />
          </div>
          <div className="ink-reveal" style={{ position: 'relative', zIndex: 1 }}>
            <p className="eyebrow" data-testid="text-portrait-eyebrow">In another language</p>
            <h2 className="chapter-title" data-testid="text-portrait-title">You are<br />a whole sky.</h2>
            <p className="chapter-copy small" data-testid="text-portrait-copy">The kind that changes colour without asking permission.</p>
          </div>
          <div className="chapter-footer">
            <span data-testid="status-portrait-chapter">Chapter 04 / 06</span>
            <button className="footer-next" type="button" onClick={next} data-testid="button-portrait-next">A few details <span aria-hidden="true">→</span></button>
          </div>
        </section>

        <section className={`chapter ${chapter === 4 ? 'is-active' : ''}`} aria-hidden={chapter !== 4} data-testid="chapter-memories">
          <div className="ink-reveal">
            <p className="eyebrow" data-testid="text-memories-eyebrow">The things I hope you know</p>
            <h2 className="chapter-title" data-testid="text-memories-title">Keep these.</h2>
            <p className="chapter-copy small" data-testid="text-memories-copy">Small truths, pressed between the pages for later.</p>
          </div>
          <div className="memory-grid" data-testid="memory-grid">
            <div className="memory-note" data-testid="memory-note-01">You make ordinary days feel chosen.</div>
            <div className="memory-note" data-testid="memory-note-02">Your softness is not a weakness.</div>
            <div className="memory-note" data-testid="memory-note-03">You are allowed to become.</div>
            <div className="memory-note" data-testid="memory-note-04">There is so much more ahead.</div>
          </div>
          <div className="chapter-footer">
            <span data-testid="status-memories-chapter">Chapter 05 / 06</span>
            <button className="footer-next" type="button" onClick={next} data-testid="button-memories-next">The last page <span aria-hidden="true">→</span></button>
          </div>
        </section>

        <section className={`chapter chapter--dark final-message ${chapter === 5 ? 'is-active' : ''}`} aria-hidden={chapter !== 5} data-testid="chapter-birthday">
          <div className="ink-reveal">
            <p className="eyebrow" data-testid="text-birthday-eyebrow">Today, and every day after</p>
            <h2 className="chapter-title" data-testid="text-birthday-title">Happy<br />birthday,<br />Nandini.</h2>
            <p className="chapter-copy small" data-testid="text-birthday-copy">May this next year meet you gently, then surprise you with how beautiful it becomes.</p>
            <p className="signature" data-testid="text-birthday-signature">with all my love</p>
            <button className="double-button" type="button" onClick={() => goTo(0)} data-testid="button-read-again">Read it again</button>
          </div>
          <div className="chapter-footer">
            <span data-testid="status-birthday-chapter">Chapter 06 / 06</span>
            <span data-testid="text-birthday-note">Keep this close</span>
          </div>
        </section>
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
