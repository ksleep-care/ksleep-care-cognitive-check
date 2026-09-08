import { useId, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  returnFocusSelector?: string;
}

/** 배경은 호출부에서 inert 처리하고, 닫힐 때까지 초점을 창 안에 유지한다. */
export default function ConfirmDialog({ title, description, confirmLabel, cancelLabel, onConfirm, onCancel, returnFocusSelector }: ConfirmDialogProps) {
  const id = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelRef.current?.focus();
    // React가 배경의 inert를 제거한 다음 복원해야 실제 브라우저에서도 초점이 돌아간다.
    return () => { queueMicrotask(() => {
      const target = returnFocusSelector ? document.querySelector<HTMLElement>(returnFocusSelector) : previous;
      if (target?.isConnected) target.focus();
    }); };
  }, [returnFocusSelector]);
  return createPortal(
    <div className="dialog-backdrop">
      <section className="confirm-card" role="alertdialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
        onKeyDown={event => {
          if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onCancel(); }
          if (event.key !== 'Tab') return;
          const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
          const first = buttons[0]; const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }}>
        <h2 id={`${id}-title`}>{title}</h2>
        <p id={`${id}-description`}>{description}</p>
        <button ref={cancelRef} className="primary-button" type="button" onClick={onCancel}>{cancelLabel}</button>
        <button className="quiet-button" type="button" onClick={onConfirm}>{confirmLabel}</button>
      </section>
    </div>, document.body,
  );
}
