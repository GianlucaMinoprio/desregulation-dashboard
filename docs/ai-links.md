# AI links and button treatment

Reviewed September 10, 2026.

## Link formats

These are provider-specific web conventions, not a shared, versioned deep-link standard. The website uses HTTPS links to reach the browser experience without requiring an installed application. `URLSearchParams` encodes the complete prompt; the link includes no visitor data, model override, automatic-send flag, or memory-setting override.

| Provider | Website format | Evidence and scope |
| --- | --- | --- |
| ChatGPT | `https://chatgpt.com/?q=…` | The same query convention is used by [Daimo](https://daimo.com/) through its older `chat.openai.com` hostname. A stable consumer-web deep-link contract was not found in the official documentation reviewed. |
| Claude | `https://claude.ai/new?q=…` | Matches the live [Daimo](https://daimo.com/) link. Anthropic separately documents [`claude://claude.ai/new?q=…` for desktop](https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link), with a prefilled composer for review; the app-specific scheme is not the website default. |
| Grok | `https://grok.com/?q=…` | Used in the maintained [Oh My Zsh web-search integration](https://github.com/ohmyzsh/ohmyzsh/blob/master/plugins/web-search/web-search.plugin.zsh). This replaces the older `https://x.com/i/grok?text=…` link copied from Daimo. A documented, versioned consumer deep-link contract was not found. |

The copy and selectable-text fallbacks remain available because authentication redirects and provider changes can affect prefilling. Verification checks that the complete, correct prompt survives URL encoding for both official-form destinations. No signed-in AI conversation or government form was submitted during these checks.

## Logo and interaction reference

The provider logo paths and view boxes in `participation-ai.js` were inspected from the first inline SVG of each corresponding AI link on Daimo. Only the three provider marks were retained; their fills use CSS `currentColor`. The visible provider name supplies the accessible label, and SVGs are decorative. No external icon library, image request, or script was added.

Claude keeps the standard one-line provider label and 48px control height. Only its hover/keyboard-focus tooltip carries the editorial aside: “Claude no nos da buena espina. El prompt igual es para vos 😉”. Escape dismisses the tooltip, and the pointer can move onto it without closing it. The link still opens Claude directly with the identical full prompt; the aside is not included in the AI prompt.

Daimo's inspected hover changes the background, text, and icon colors over 100 ms. The final treatment follows this site's rectangular outline buttons: a 3px radius, navy outline and text, 14px labels, and 48px minimum height. All three providers share a navy hover/focus/pressed fill, white text, and gold logos over 150 ms. A neutral keyboard focus ring and 0.96 pressed scale remain. Touch feedback uses the active state, and the existing reduced-motion rule removes transitions. The AI disclosure uses a simple top rule and the parent surface instead of an additional yellow box.

## Color changes in `styles.css`

The refinement aligns the provider controls with the site's existing button and disclosure treatment. No palette tokens changed.

| Declaration | Previous | Replacement / new state | Purpose |
| --- | --- | --- | --- |
| `.ai-helper` surface | Gold border and `#f9edd2` fill | `var(--line)` top rule; transparent surface | Matches the other expandable information areas. |
| `.ai-provider` surface | White pill with `var(--line)` border | Transparent rectangle with `var(--navy)` border | Matches the site's outline buttons. |
| Hover/focus/pressed background | Navy for ChatGPT, gold for Claude, blue for Grok | `var(--navy)` for all three | Consistent response across providers. |
| Hover/focus/pressed text | White or navy by provider | `var(--white)` for all three | Consistent readable labels. |
| Hover/focus/pressed logo | Gold or blue by provider | `var(--gold)` for all three | A restrained accent from the site's palette. |
| `.ai-provider-arrow` color | Muted at rest | Inherits navy at rest and white when active | Matches the surrounding action arrows. |

Default button text remains `var(--navy)`; keyboard focus remains `CanvasText`. Body labels retain at least 4.5:1 contrast on both parent surfaces and in the filled state; logos retain at least 3:1.
