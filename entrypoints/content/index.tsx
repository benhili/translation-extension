import ReactDOM from "react-dom/client";
import TranslationWrapper from "./TranslationPopup";

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  main(ctx) {
    let debounceTimeout;
    let uiRef: ShadowRootContentScriptUi<{ root: ReactDOM.Root; wrapper: HTMLDivElement; }> | null = null;

    ctx.addEventListener(document, "mouseup", async (event) => {
      clearTimeout(debounceTimeout);
      debounceTimeout = ctx.setTimeout(async () => {
        const selection = window.getSelection();

        if (uiRef !== null && !uiRef.shadowHost.contains(event.target as Node)) {
          return
        }

        if (!selection || selection.isCollapsed || selection.rangeCount === 0 || selection.toString().trim() === "") {
          return;
        }

        const selectedText = selection.toString().trim();

        if (selectedText && uiRef === null) {
          try {
            const rect = selection.getRangeAt(0).getBoundingClientRect();

            const ui = await createShadowRootUi(ctx, {
              name: 'translation-popup-container',
              position: 'inline',
              anchor: 'body',
              onMount(container) {
                const wrapper = document.createElement("div");
                container.append(wrapper);

                const root = ReactDOM.createRoot(wrapper);
                root.render(<TranslationWrapper
                  prompt={selectedText}
                  rect={rect}
                />);
                return { root, wrapper };
              },
              onRemove: (elements) => {
                elements?.root.unmount();
                elements?.wrapper.remove();
              },
            });
            ui.mount();
            uiRef = ui;
          } catch (error) {
            console.error("Error fetching translation:", error);
          }
        }
      }, 300);
    });

    ctx.addEventListener(document, "click", (event) => {
      if (uiRef !== null && !uiRef.shadowHost.contains(event.target as Node)) {
        uiRef.remove();
        uiRef = null;
      }
    });
  },
});