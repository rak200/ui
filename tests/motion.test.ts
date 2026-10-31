import { afterEach, describe, expect, it } from 'vitest';
import { kinds, query } from '../src/motion.js';

/** The colour a probe takes when its effect is drawn, and no rule here gives it otherwise. */
const drawn = 'rgb(255, 0, 0)';

/**
 * A component that offers one effect for one moment, `glow` for `hover-fill`, drawn on an element
 * inside its shadow root — where every effect a component draws is drawn, RFC 0004's S5.
 */
class Probe extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = `<style>
            @container ${query('probe')('hover-fill', 'glow')} {
                span { color: ${drawn}; }
            }
        </style><span>probe</span>`;
    }
}

/** The same effect drawn on the host itself, which is what S8 is about. */
class HostProbe extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = `<style>
            @container ${query('probe')('hover-fill', 'glow')} {
                :host { color: ${drawn}; }
            }
        </style>`;
    }
}

customElements.define('test-motion', Probe);
customElements.define('test-motion-host', HostProbe);

afterEach(() => {
    document.body.replaceChildren();
});

/** Mounts the markup under the CSS a page writes, and returns what holds it. */
function mount(sheet: string, markup = '<test-motion></test-motion>'): HTMLElement {
    const style = document.createElement('style');
    style.textContent = sheet;

    const holder = document.createElement('div');
    holder.innerHTML = markup;
    document.body.append(style, holder);

    return holder;
}

/** Whether the probe matched by `selector` draws its effect. */
function draws(holder: HTMLElement, selector = 'test-motion'): boolean {
    const probe = holder.querySelector(selector)?.shadowRoot?.querySelector('span');

    if (probe === null || probe === undefined) {
        throw new Error(`no probe under ${selector}`);
    }

    return getComputedStyle(probe).color === drawn;
}

describe('kinds', () => {
    it('names each kind of name that is not a token by its own prefix under --ui-', () => {
        expect(kinds).toEqual({
            choice: '--ui-motion-',
            taste: '--ui-taste-',
            animated: '--ui-fx-',
        });
    });
});

describe('query', () => {
    it("asks for the choice, then the component's taste, then the page's, each `not` in parentheses of its own", () => {
        // Without the parentheses Chromium and WebKit dropped the rule and Firefox read only its
        // first half, which is a measurement the suite cannot repeat in the two engines it does
        // not run. The string is held here so a rewrite cannot lose them unnoticed.
        expect(query('card')('hover-move', 'tilt')).toBe(
            '(style(--ui-motion-hover-move: tilt) or ((not style(--ui-motion-hover-move)) and (style(--ui-taste-card-hover-move: tilt) or ((not style(--ui-taste-card-hover-move)) and style(--ui-taste-hover-move: tilt)))))',
        );
    });

    it('draws nothing where nothing is chosen and no taste is written', () => {
        expect(draws(mount(''))).toBe(false);
    });

    it('draws the effect a page chooses', () => {
        expect(draws(mount(':root { --ui-motion-hover-fill: glow; }'))).toBe(true);
    });

    it('lets a region choose apart from the page', () => {
        const holder = mount(
            ':root { --ui-motion-hover-fill: raise; } .region { --ui-motion-hover-fill: glow; }',
            '<test-motion id="out"></test-motion><div class="region"><test-motion id="in"></test-motion></div>',
        );

        expect(draws(holder, '#out'), 'outside').toBe(false);
        expect(draws(holder, '#in'), 'inside').toBe(true);
    });

    it('lets a component type choose apart from the region around it', () => {
        const holder = mount(
            '.region { --ui-motion-hover-fill: raise; } test-motion { --ui-motion-hover-fill: glow; }',
            '<div class="region"><test-motion></test-motion></div>',
        );

        expect(draws(holder)).toBe(true);
    });

    it('lets one instance choose apart from its type', () => {
        const holder = mount(
            'test-motion { --ui-motion-hover-fill: raise; }',
            '<test-motion id="typed"></test-motion><test-motion id="own" style="--ui-motion-hover-fill: glow"></test-motion>',
        );

        expect(draws(holder, '#typed'), 'the type').toBe(false);
        expect(draws(holder, '#own'), 'the instance').toBe(true);
    });

    it("draws the page's taste where nothing is chosen", () => {
        expect(draws(mount(':root { --ui-taste-hover-fill: glow; }'))).toBe(true);
    });

    it("takes the component's own taste over the page's, in both directions", () => {
        expect(
            draws(
                mount(':root { --ui-taste-hover-fill: raise; --ui-taste-probe-hover-fill: glow; }'),
            ),
            'its own names the effect',
        ).toBe(true);
        document.body.replaceChildren();
        expect(
            draws(
                mount(':root { --ui-taste-hover-fill: glow; --ui-taste-probe-hover-fill: raise; }'),
            ),
            'its own names another',
        ).toBe(false);
    });

    it('runs any choice instead of every taste', () => {
        const sheet =
            ':root { --ui-taste-hover-fill: glow; --ui-taste-probe-hover-fill: glow; --ui-motion-hover-fill: raise; }';

        expect(draws(mount(sheet))).toBe(false);
    });

    it('draws nothing for none, for an effect the component does not offer, or for a misspelling', () => {
        for (const choice of ['none', 'raise', 'glwo']) {
            const sheet = `:root { --ui-taste-hover-fill: glow; --ui-motion-hover-fill: ${choice}; }`;

            expect(draws(mount(sheet)), choice).toBe(false);
            document.body.replaceChildren();
        }
    });

    it("reads another component's taste, or another moment's choice, as none of its own", () => {
        expect(draws(mount(':root { --ui-taste-other-hover-fill: glow; }')), 'taste').toBe(false);
        document.body.replaceChildren();
        expect(draws(mount(':root { --ui-motion-hover-shadow: glow; }')), 'choice').toBe(false);
    });

    it('misses a choice written on the host for an effect drawn on the host — S8', () => {
        // A query asks the element's ancestors, never the element itself, so a rule on `:host`
        // reads what is around the component: the page's choice, and not the instance's own.
        const holder = mount(
            '',
            '<test-motion-host id="own" style="--ui-motion-hover-fill: glow"></test-motion-host><div style="--ui-motion-hover-fill: glow"><test-motion-host id="around"></test-motion-host></div>',
        );
        const color = (selector: string): string => {
            const host = holder.querySelector(selector);

            return host === null ? '' : getComputedStyle(host).color;
        };

        expect(color('#own'), 'written on the host').not.toBe(drawn);
        expect(color('#around'), 'written around it').toBe(drawn);
    });
});
