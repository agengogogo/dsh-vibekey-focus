window.__ModuleLoader__.load({
  id: 'dsh-vibekey-focus',
  factory(require) {
    const React = require('react');

    // The composer is a Lexical contenteditable in DSH 0.1.5+ and a textarea in
    // older builds. Keep every marker the official/session-hotkey plugins rely on.
    const INPUT_SELECTORS = [
      '[data-composer-input]',
      'textarea[data-phase]',
      '[data-composer-card] textarea',
      '[data-composer-card] [contenteditable="true"]',
      '[data-input-scroll] textarea',
      '[data-input-scroll] [contenteditable="true"]',
      'textarea[data-dsv-tui-input]',
      '.dsv-tui-input',
    ];
    const COMPOSER_CARD_SELECTOR = '[data-composer-card], [data-dsv-composer-card]';
    const POPUP_SELECTORS = [
      '[role="menu"]',
      '[role="listbox"]',
      '[role="dialog"]',
      '[role="alertdialog"]',
      '[aria-modal="true"]',
      '[data-state="open"][role="menu"]',
      '[data-state="open"][role="listbox"]',
    ];
    // Keys that belong to navigation/menus; never yank focus for these.
    const NAV_KEYS = new Set([
      'Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'PageUp', 'PageDown', 'Home', 'End',
    ]);

    const isElement = (value) => typeof Element !== 'undefined' && value instanceof Element;

    const visible = (element) => {
      try {
        return isElement(element) && element.getClientRects().length > 0;
      } catch {
        return false;
      }
    };

    const isEditable = (element) => {
      if (!isElement(element) || element === document.body || element === document.documentElement) return false;
      if (element.isContentEditable) return true;
      const tag = element.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    };

    const anyVisible = (selectors) => {
      for (const selector of selectors) {
        let nodes;
        try {
          nodes = document.querySelectorAll(selector);
        } catch {
          continue;
        }
        for (const node of nodes) if (visible(node)) return true;
      }
      return false;
    };

    const modalOpen = () => anyVisible(['[role="dialog"]', '[role="alertdialog"]', '[aria-modal="true"]']);
    const popupOpen = () => anyVisible(POPUP_SELECTORS);

    // The shipped approval composer takeover. Its own Enter/Escape handler only
    // runs when focus is inside this panel, and it renders no autofocus, so a
    // keyboard-only "allow" is otherwise lost.
    const APPROVAL_SELECTOR = '[data-approval-key]';
    const APPROVAL_BODY_SELECTOR = '[data-approval-scroll]';
    const INTERACTIVE_SELECTOR = [
      'button', 'a[href]', 'summary', '[role="button"]', '[role="menuitem"]',
      '[role="tab"]', '[role="switch"]', '[role="checkbox"]', '[role="radio"]',
      '[role="option"]', '[role="link"]', '[role="combobox"]',
    ].join(', ');

    function findApprovalPanel() {
      let nodes;
      try {
        nodes = document.querySelectorAll(APPROVAL_SELECTOR);
      } catch {
        return null;
      }
      for (const node of nodes) if (visible(node)) return node;
      return null;
    }

    function focusApprovalPanel(panel) {
      if (!isElement(panel) || !panel.isConnected) return false;
      if (panel.contains(document.activeElement)) return true;
      if (document.visibilityState !== 'visible' || !document.hasFocus()) return false;
      const body = panel.querySelector(APPROVAL_BODY_SELECTOR);
      let target = body;
      if (!isElement(target) || !visible(target)) {
        const buttons = approvalActionButtons(panel);
        target = buttons[buttons.length - 1] ?? null;
      }
      if (!isElement(target)) return false;
      try {
        target.focus({ preventScroll: true });
      } catch {
        try {
          target.focus();
        } catch {
          return false;
        }
      }
      return panel.contains(document.activeElement);
    }

    /**
     * Buttons of the approval action row (the last group in the card), not
     * buttons that a Tool detail may render above it.
     */
    function approvalActionButtons(panel) {
      if (!isElement(panel)) return [];
      let row = null;
      try {
        const card = panel.firstElementChild;
        if (card !== null) row = card.lastElementChild;
      } catch {}
      const scope = row ?? panel;
      try {
        return Array.from(scope.querySelectorAll('button')).filter((button) => !button.disabled);
      } catch {
        return [];
      }
    }

    // The multi-option interaction is the ask_user_question card, not the
    // approval card (which always has exactly reject/allow-once).
    const QUESTION_SELECTOR = '[data-question-key]';
    const QUESTION_OPTION_SELECTOR = '[role="radio"], [role="checkbox"]';

    function findQuestionCard() {
      let nodes;
      try {
        nodes = document.querySelectorAll(QUESTION_SELECTOR);
      } catch {
        return null;
      }
      for (const node of nodes) if (visible(node)) return node;
      return null;
    }

    function questionOptions(card) {
      if (!isElement(card)) return [];
      try {
        return Array.from(card.querySelectorAll(QUESTION_OPTION_SELECTOR))
          .filter((option) => !option.disabled);
      } catch {
        return [];
      }
    }

    function questionInput(card) {
      if (!isElement(card)) return null;
      let nodes;
      try {
        nodes = card.querySelectorAll('textarea:not([disabled]), input[type="text"]:not([disabled])');
      } catch {
        return null;
      }
      for (const node of nodes) if (visible(node)) return node;
      return null;
    }

    function focusQuestionCard(card) {
      if (!isElement(card) || !card.isConnected) return false;
      if (card.contains(document.activeElement)) return true;
      if (document.visibilityState !== 'visible' || !document.hasFocus()) return false;
      const options = questionOptions(card);
      const input = questionInput(card);
      const target = options.length > 0 ? options[0] : input;
      if (!isElement(target)) return false;
      try {
        if (target === input) target.focus();
        else target.focus({ preventScroll: true });
      } catch {
        try {
          target.focus();
        } catch {
          return false;
        }
      }
      return card.contains(document.activeElement);
    }

    function focusQuestionInput(card) {
      if (!isElement(card) || !card.isConnected) return false;
      if (document.visibilityState !== 'visible' || !document.hasFocus()) return false;
      const input = questionInput(card);
      if (input === null) return false;
      try {
        input.focus();
      } catch {
        return false;
      }
      return card.contains(document.activeElement);
    }

    function questionTargets(card) {
      const options = questionOptions(card);
      const input = questionInput(card);
      return input !== null ? [...options, input] : options;
    }

    /**
     * Find the composer input in the same composer card as this slot entry.
     * Scoping by the card avoids focusing another (hidden) split-view composer.
     */
    function findInput(anchor) {
      if (!isElement(anchor) || !anchor.isConnected) return null;
      let scope = document;
      try {
        const card = anchor.closest(COMPOSER_CARD_SELECTOR);
        if (card !== null) scope = card;
      } catch {}
      for (const selector of INPUT_SELECTORS) {
        let nodes;
        try {
          nodes = scope.querySelectorAll(selector);
        } catch {
          continue;
        }
        for (const node of nodes) {
          if (!visible(node)) continue;
          if (node.disabled === true) continue;
          return node;
        }
      }
      return null;
    }

    function selectionInside(element) {
      try {
        const selection = window.getSelection();
        if (selection === null || selection.rangeCount === 0) return false;
        return element.contains(selection.anchorNode) && element.contains(selection.focusNode);
      } catch {
        return false;
      }
    }

    function caretToEnd(element) {
      try {
        if (typeof element.setSelectionRange === 'function') {
          const length = String(element.value ?? '').length;
          element.setSelectionRange(length, length);
          return;
        }
        const selection = window.getSelection();
        if (selection === null || typeof document.createRange !== 'function') return;
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch {}
    }

    function focusInput(anchor) {
      if (document.visibilityState !== 'visible' || !document.hasFocus()) return false;
      if (modalOpen()) return false;
      const input = findInput(anchor);
      if (input === null) return false;
      if (document.activeElement === input) return true;
      try {
        input.focus({ preventScroll: true });
      } catch {
        try {
          input.focus();
        } catch {
          return false;
        }
      }
      if (document.activeElement !== input) return false;
      if (!selectionInside(input)) caretToEnd(input);
      return true;
    }

    // One hidden anchor per live composer; it locates the card whose focus we own.
    function FocusGuard() {
      const anchorRef = React.useRef(null);

      React.useEffect(() => {
        const anchor = () => anchorRef.current;
        let disposed = false;
        let clickTimer = 0;
        let mountTimer = 0;
        let down = null;

        const canTakeFocus = () => {
          if (disposed) return false;
          if (document.visibilityState !== 'visible' || !document.hasFocus()) return false;
          if (modalOpen()) return false;
          // Composer takeovers own focus while they are on screen.
          if (findApprovalPanel() !== null) return false;
          if (findQuestionCard() !== null) return false;
          // Never steal from another text field (search, settings, question box).
          return !isEditable(document.activeElement);
        };

        const focusWhenAllowed = () => {
          if (!canTakeFocus()) return false;
          return focusInput(anchor());
        };

        const onWindowFocus = () => {
          window.requestAnimationFrame(() => {
            if (!disposed) focusWhenAllowed();
          });
        };

        const onVisibilityChange = () => {
          if (document.visibilityState === 'visible') onWindowFocus();
        };

        const onKeyDown = (event) => {
          if (disposed || event.defaultPrevented || event.isComposing) return;
          if (findApprovalPanel() !== null) return;
          if (findQuestionCard() !== null) return;
          const active = document.activeElement;
          if (isEditable(active)) return;
          if (popupOpen()) return;
          if (NAV_KEYS.has(event.key)) return;
          // Enter/Space belong to the focused button/menu item; focusing the
          // composer here would swallow its native activation.
          if ((event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar')
            && isElement(active) && active.closest(INTERACTIVE_SELECTOR) !== null) return;
          // A non-collapsed selection means the user is reading/copying or
          // navigating text; focusing the composer would collapse it.
          const selection = window.getSelection();
          if (selection !== null && !selection.isCollapsed && String(selection).trim() !== '') return;
          // Covers modifier-only dictation chords (VibeKey -> Ctrl+Win) and any
          // stray typing aimed at a non-editable part of the page.
          focusInput(anchor());
        };

        const onPointerDown = (event) => {
          down = event.button === 0
            ? { x: event.clientX, y: event.clientY, target: event.target }
            : null;
        };

        const onPointerUp = (event) => {
          if (down === null) return;
          const { x, y, target } = down;
          down = null;
          if (!isElement(target)) return;
          if (Math.abs(event.clientX - x) > 6 || Math.abs(event.clientY - y) > 6) return;
          if (target.closest(COMPOSER_CARD_SELECTOR)) return;
          const approval = findApprovalPanel();
          if (approval !== null && approval.contains(target)) return;
          const question = findQuestionCard();
          if (question !== null && question.contains(target)) return;
          if (target.closest('a[href], input, textarea, select, [contenteditable="true"], [role="textbox"]')) return;
          const selection = window.getSelection();
          if (selection !== null && !selection.isCollapsed && String(selection).trim() !== '') return;
          // Let the click's own menu/dialog render before deciding to take focus.
          // A popup that is still open (model menu, session menu) gets one later
          // retry so choosing a menu item hands focus back to the composer.
          window.clearTimeout(clickTimer);
          clickTimer = window.setTimeout(() => {
            if (disposed) return;
            if (popupOpen()) {
              clickTimer = window.setTimeout(() => {
                if (!disposed && !popupOpen()) focusWhenAllowed();
              }, 500);
              return;
            }
            if (isEditable(document.activeElement)) return;
            focusWhenAllowed();
          }, 350);
        };

        window.addEventListener('focus', onWindowFocus);
        document.addEventListener('visibilitychange', onVisibilityChange);
        document.addEventListener('keydown', onKeyDown, true);
        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('pointerup', onPointerUp, true);

        // Session switch / first paint: the window may already be focused while
        // <body> or a sidebar row owns focus, so focus once the composer exists.
        mountTimer = window.setTimeout(() => {
          if (!disposed) focusWhenAllowed();
        }, 120);

        return () => {
          disposed = true;
          window.clearTimeout(clickTimer);
          window.clearTimeout(mountTimer);
          window.removeEventListener('focus', onWindowFocus);
          document.removeEventListener('visibilitychange', onVisibilityChange);
          document.removeEventListener('keydown', onKeyDown, true);
          document.removeEventListener('pointerdown', onPointerDown, true);
          document.removeEventListener('pointerup', onPointerUp, true);
        };
      }, []);

      return React.createElement('span', {
        ref: anchorRef,
        hidden: true,
        'aria-hidden': 'true',
        'data-vibekey-focus-anchor': 'true',
      });
    }

    // Root-scope companion: the approval takeover replaces the composer, so the
    // composer-scoped guard above is unmounted exactly when approval needs focus.
    function ApprovalFocus() {
      React.useEffect(() => {
        let disposed = false;
        let scheduled = 0;

        const focusWhenPossible = () => {
          if (disposed) return false;
          const panel = findApprovalPanel();
          if (panel === null) return false;
          if (panel.contains(document.activeElement)) return true;
          if (isEditable(document.activeElement)) return false;
          const active = document.activeElement;
          if (isElement(active)) {
            const dialog = active.closest('[role="dialog"], [aria-modal="true"]');
            if (dialog !== null && !panel.contains(dialog)) return false;
          }
          return focusApprovalPanel(panel);
        };
        const schedule = () => {
          if (disposed) return;
          window.clearTimeout(scheduled);
          scheduled = window.setTimeout(() => {
            scheduled = 0;
            if (!disposed) focusWhenPossible();
          }, 0);
        };

        const touchesApproval = (node) => {
          if (!isElement(node)) return false;
          try {
            return node.matches(APPROVAL_SELECTOR) || node.querySelector(APPROVAL_SELECTOR) !== null;
          } catch {
            return false;
          }
        };

        let observer;
        try {
          observer = new MutationObserver((records) => {
            for (const record of records) {
              for (const node of record.addedNodes) {
                if (touchesApproval(node)) {
                  schedule();
                  return;
                }
              }
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
        } catch {}

        // The panel has its own Enter/Escape handler, but it only runs when
        // focus is inside the panel. If focus is elsewhere, answer directly.
        // Arrow/Tab navigation is ours: the panel rows are plain buttons, so a
        // knob mapped to Up/Down (or Tab/Shift+Tab) can select before confirming.
        const onKeyDown = (event) => {
          if (disposed || event.defaultPrevented || event.isComposing) return;
          const panel = findApprovalPanel();
          if (panel === null) return;
          const active = document.activeElement;
          const inside = panel.contains(active);
          const buttons = approvalActionButtons(panel);
          const navigation = event.key === 'Tab'
            || event.key === 'ArrowUp' || event.key === 'ArrowDown'
            || event.key === 'ArrowLeft' || event.key === 'ArrowRight';
          if (navigation) {
            if (isEditable(active)) return;
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            if (inside) {
              const body = panel.querySelector(APPROVAL_BODY_SELECTOR);
              const inActionRow = buttons.includes(active);
              // Tool-detail controls keep their own arrow/Tab behavior.
              if (!inActionRow && active !== body) return;
              event.preventDefault();
              event.stopPropagation();
              if (!inActionRow) {
                const primary = buttons[buttons.length - 1];
                if (primary !== undefined) primary.focus();
                else if (body !== null) body.focus();
                return;
              }
              const index = buttons.indexOf(active);
              if (index < 0 || buttons.length === 0) return;
              const forward = event.key === 'Tab'
                ? !event.shiftKey
                : event.key === 'ArrowDown' || event.key === 'ArrowRight';
              const next = forward
                ? (index + 1) % buttons.length
                : (index - 1 + buttons.length) % buttons.length;
              buttons[next].focus();
              return;
            }
            if (popupOpen()) return;
            event.preventDefault();
            event.stopPropagation();
            const primary = buttons[buttons.length - 1]
              ?? panel.querySelector(APPROVAL_BODY_SELECTOR);
            if (primary !== null) primary.focus();
            return;
          }
          // Knob press (Ulanzi's Alt+NumPad Enter). The shipped panel ignores
          // modified Enter, so map it to the focused action (or Allow).
          if (event.key === 'Enter' && event.altKey) {
            if (event.ctrlKey || event.metaKey || event.shiftKey) return;
            if (isEditable(active)) return;
            if (popupOpen()) return;
            event.preventDefault();
            event.stopPropagation();
            const target = inside && buttons.includes(active)
              ? active
              : buttons[buttons.length - 1] ?? panel.querySelector(APPROVAL_BODY_SELECTOR);
            if (target !== null && typeof target.click === 'function') target.click();
            return;
          }
          if (inside) return;
          if (event.key !== 'Enter' && event.key !== 'Escape') return;
          if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
          if (isEditable(active)) return;
          if (popupOpen()) return;
          event.preventDefault();
          event.stopPropagation();
          const target = event.key === 'Enter'
            ? buttons[buttons.length - 1]
            : buttons[buttons.length - 2];
          if (target !== undefined) target.click();
        };

        const onWindowFocus = () => schedule();
        const onVisibility = () => {
          if (document.visibilityState === 'visible') schedule();
        };

        window.addEventListener('focus', onWindowFocus);
        document.addEventListener('visibilitychange', onVisibility);
        document.addEventListener('keydown', onKeyDown, true);
        schedule();

        return () => {
          disposed = true;
          window.clearTimeout(scheduled);
          try {
            observer?.disconnect();
          } catch {}
          window.removeEventListener('focus', onWindowFocus);
          document.removeEventListener('visibilitychange', onVisibility);
          document.removeEventListener('keydown', onKeyDown, true);
        };
      }, []);

      return React.createElement('span', {
        hidden: true,
        'aria-hidden': 'true',
        'data-vibekey-approval-anchor': 'true',
      });
    }

    // Multi-option ask_user_question card. The approval card is fixed at two
    // actions; this card is the real multi-option surface.
    function QuestionFocus() {
      React.useEffect(() => {
        let disposed = false;
        let scheduled = 0;
        let bodyObserver;
        const observedCards = new WeakSet();
        const cardObservers = new Set();

        function schedule() {
          if (disposed) return;
          window.clearTimeout(scheduled);
          scheduled = window.setTimeout(() => {
            scheduled = 0;
            if (!disposed) focusWhenPossible();
          }, 0);
        }

        function observeCard(card) {
          if (!isElement(card) || observedCards.has(card)) return;
          observedCards.add(card);
          let observer;
          try {
            observer = new MutationObserver(() => {
              if (disposed) return;
              if (!card.isConnected) {
                observer.disconnect();
                cardObservers.delete(observer);
                return;
              }
              // Do not steal from the footer buttons or the custom textarea.
              if (card.contains(document.activeElement)) return;
              if (isEditable(document.activeElement)) return;
              schedule();
            });
            observer.observe(card, { childList: true, subtree: true });
            cardObservers.add(observer);
          } catch {}
        }

        function focusWhenPossible() {
          if (disposed) return false;
          const card = findQuestionCard();
          if (card === null) return false;
          observeCard(card);
          if (card.contains(document.activeElement)) return true;
          if (isEditable(document.activeElement)) return false;
          const active = document.activeElement;
          if (isElement(active)) {
            const dialog = active.closest('[role="dialog"], [aria-modal="true"]');
            if (dialog !== null && !card.contains(dialog)) return false;
          }
          return focusQuestionCard(card);
        }

        try {
          bodyObserver = new MutationObserver((records) => {
            for (const record of records) {
              for (const node of record.addedNodes) {
                if (!isElement(node)) continue;
                try {
                  if (node.matches(QUESTION_SELECTOR) || node.querySelector(QUESTION_SELECTOR) !== null) {
                    schedule();
                    return;
                  }
                } catch {}
              }
            }
          });
          bodyObserver.observe(document.body, { childList: true, subtree: true });
        } catch {}

        const onKeyDown = (event) => {
          if (disposed || event.defaultPrevented || event.isComposing) return;
          const card = findQuestionCard();
          if (card === null) return;
          const active = document.activeElement;
          const inside = card.contains(active);
          const options = questionOptions(card);
          const inOption = isElement(active)
            && inside
            && active.closest(QUESTION_OPTION_SELECTOR) !== null;

          // Knob press (Alt+NumPad Enter): in the custom answer it switches to
          // option selection; on an option it selects and returns to the
          // custom answer so the voice key is immediately usable again.
          if (event.key === 'Enter' && event.altKey) {
            if (event.ctrlKey || event.metaKey || event.shiftKey) return;
            if (popupOpen()) return;
            if (!inside) {
              event.preventDefault();
              event.stopPropagation();
              focusQuestionCard(card);
              return;
            }
            if (isEditable(active)) {
              if (options.length === 0) return;
              event.preventDefault();
              event.stopPropagation();
              options[0].focus();
              return;
            }
            if (!inOption || options.length === 0) return;
            event.preventDefault();
            event.stopPropagation();
            active.click();
            window.setTimeout(() => {
              const current = findQuestionCard();
              if (current !== null) {
                if (!focusQuestionInput(current)) focusQuestionCard(current);
              }
            }, 50);
            return;
          }

          // Space is the other natural knob-press binding; selecting an option
          // returns to the custom answer as well.
          if (event.key === ' ' && inOption) {
            if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
            event.preventDefault();
            event.stopPropagation();
            active.click();
            window.setTimeout(() => {
              const current = findQuestionCard();
              if (current !== null) {
                if (!focusQuestionInput(current)) focusQuestionCard(current);
              }
            }, 50);
            return;
          }

          const navigation = event.key === 'Tab'
            || event.key === 'ArrowUp' || event.key === 'ArrowDown'
            || event.key === 'ArrowLeft' || event.key === 'ArrowRight';
          if (!navigation) return;
          // Inside the custom textarea, arrows edit text (the knob press above
          // switches back to the options).
          if (isEditable(active)) return;
          if (event.ctrlKey || event.metaKey || event.altKey) return;
          if (inside && !inOption) return;
          if (popupOpen()) return;
          event.preventDefault();
          event.stopPropagation();
          const targets = questionTargets(card);
          if (!inOption) {
            focusQuestionCard(card);
            return;
          }
          const index = targets.indexOf(active);
          if (index < 0 || targets.length === 0) return;
          const forward = event.key === 'Tab'
            ? !event.shiftKey
            : event.key === 'ArrowDown' || event.key === 'ArrowRight';
          const next = forward
            ? (index + 1) % targets.length
            : (index - 1 + targets.length) % targets.length;
          targets[next].focus();
        };

        const onWindowFocus = () => schedule();
        const onVisibility = () => {
          if (document.visibilityState === 'visible') schedule();
        };

        window.addEventListener('focus', onWindowFocus);
        document.addEventListener('visibilitychange', onVisibility);
        document.addEventListener('keydown', onKeyDown, true);
        schedule();

        return () => {
          disposed = true;
          window.clearTimeout(scheduled);
          try {
            bodyObserver?.disconnect();
          } catch {}
          for (const observer of cardObservers) {
            try {
              observer.disconnect();
            } catch {}
          }
          cardObservers.clear();
          window.removeEventListener('focus', onWindowFocus);
          document.removeEventListener('visibilitychange', onVisibility);
          document.removeEventListener('keydown', onKeyDown, true);
        };
      }, []);

      return React.createElement('span', {
        hidden: true,
        'aria-hidden': 'true',
        'data-vibekey-question-anchor': 'true',
      });
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
          name: 'conversation.input.right',
          id: 'vibekey-focus',
          order: 1000,
        }, FocusGuard));
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'vibekey-approval-focus',
          order: 1000,
        }, ApprovalFocus));
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'vibekey-question-focus-v2',
          order: 1000,
        }, QuestionFocus));
      },
    };
  },
});
