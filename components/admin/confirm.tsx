'use client'

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'

export type ConfirmOptions = {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Destructive actions get a red button, and focus starts on Cancel. */
  danger?: boolean
  /** Just tells the editor something: one OK button, and the promise resolves to false. */
  acknowledgeOnly?: boolean
}

type Request = ConfirmOptions & { resolve: (ok: boolean) => void }

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null)

/**
 * Asks the editor to confirm an action:
 *   const confirm = useConfirm()
 *   if (!(await confirm({ title: 'Delete project?', danger: true }))) return
 */
export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm must be used inside <ConfirmProvider>.')
  return confirm
}

/**
 * Renders one confirmation dialog for the whole editor. Uses the native <dialog>
 * element: focus stays inside while it's open, Escape cancels, and focus returns
 * to the button that opened it.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const messageId = useId()

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setRequest((current) => {
          current?.resolve(false) // a newer request replaces an unanswered one
          return { ...options, resolve }
        })
      }),
    [],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (request && dialog && !dialog.open) dialog.showModal()
  }, [request])

  const answer = useCallback(
    (ok: boolean) => {
      request?.resolve(ok)
      dialogRef.current?.close()
      setRequest(null)
    },
    [request],
  )

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        className="confirm"
        aria-labelledby={titleId}
        aria-describedby={request?.message ? messageId : undefined}
        onCancel={(e) => {
          e.preventDefault() // Escape: answer "no" ourselves so the promise always resolves
          answer(false)
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) answer(false) // click on the backdrop
        }}
      >
        {request && (
          <div className="confirm-panel">
            <h2 id={titleId}>{request.title}</h2>
            {request.message && <p id={messageId}>{request.message}</p>}
            <div className="confirm-actions">
              {request.acknowledgeOnly ? (
                <button className="b b-primary" type="button" autoFocus onClick={() => answer(false)} data-confirm>
                  {request.confirmLabel ?? 'OK'}
                </button>
              ) : (
                <>
                  <button className="b" type="button" autoFocus={request.danger} onClick={() => answer(false)}>
                    {request.cancelLabel ?? 'Cancel'}
                  </button>
                  <button
                    className={`b ${request.danger ? 'b-danger-solid' : 'b-primary'}`}
                    type="button"
                    autoFocus={!request.danger}
                    onClick={() => answer(true)}
                    data-confirm
                  >
                    {request.confirmLabel ?? 'Confirm'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  )
}
